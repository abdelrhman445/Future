import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../../core/guards/auth.guard';
import { AppError, NotFoundError, sendSuccess } from '../../core/middlewares';
import { createCheckoutSession, getCheckoutSession } from './stripe.service';
import { stripeWebhookHandler } from './webhook.handler';
import prisma from '../../config/prisma';
import { config } from '../../config';
import { logger } from '../../core/utils/logger';
// 🔴 استيراد الدالة الذكية لتوزيع العمولات
import { distributeTieredCommissions } from '../affiliate/affiliate.router';

const router = Router();

function handleValidation(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(422, errors.array()[0].msg));
  next();
}

// ==================== STRIPE WEBHOOK ====================
router.post(
  '/webhook/stripe',
  stripeWebhookHandler
);

// ==================== CREATE CHECKOUT SESSION ====================
router.post(
  '/checkout/stripe',
  authenticate,
  [body('courseId').isUUID().withMessage('Valid courseId required')],
  handleValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.body;
      const userId = req.user!.userId;
      const userEmail = req.user!.email;

      const course = await prisma.course.findUnique({
        where: { id: courseId, status: 'PUBLISHED' },
      });
      if (!course) throw new NotFoundError('Course not found');

      const existing = await prisma.userCourse.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (existing?.status === 'COMPLETED') {
        throw new AppError(409, 'Course already purchased');
      }

      const affiliateTracking = await prisma.affiliateTracking.findFirst({
        where: { referredUserId: userId },
      });

      const price = course.salePrice || course.originalPrice;

      await prisma.userCourse.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { status: 'PENDING' },
        create: {
          userId,
          courseId,
          status: 'PENDING',
          amountPaid: price,
          currency: course.currency,
          paymentMethod: 'stripe',
          affiliateTrackingId: affiliateTracking?.id,
        },
      });

      const checkoutUrl = await createCheckoutSession({
        courseId,
        courseTitle: course.title,
        price,
        currency: course.currency,
        userId,
        userEmail,
        affiliateTrackingId: affiliateTracking?.id,
      });

      sendSuccess(res, { checkoutUrl, publishableKey: config.stripe.publishableKey });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== VERIFY PAYMENT (Fallback) ====================
router.get(
  '/verify/:sessionId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await getCheckoutSession(req.params.sessionId);

      if (session.payment_status !== 'paid') {
        throw new AppError(402, 'Payment not completed');
      }

      const { courseId, userId, affiliateTrackingId } = session.metadata as {
        courseId: string; userId: string; affiliateTrackingId?: string;
      };

      if (userId !== req.user!.userId) {
        throw new AppError(403, 'Session does not belong to this user');
      }

      const amountPaid = (session.amount_total || 0) / 100;

      const existing = await prisma.userCourse.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });

      // ✅ تفعيل الكورس وتوزيع العمولات لو لم يتم تفعيلهم من الـ Webhook
      if (!existing || existing.status !== 'COMPLETED') {
        if (existing) {
          await prisma.userCourse.update({
            where: { userId_courseId: { userId, courseId } },
            data: { status: 'COMPLETED', amountPaid, paymentRef: session.id },
          });
        } else {
          await prisma.userCourse.create({
            data: {
              userId, courseId, status: 'COMPLETED',
              amountPaid,
              currency: session.currency?.toUpperCase() || 'USD',
              paymentMethod: 'stripe',
              paymentRef: session.id,
              affiliateTrackingId: affiliateTrackingId || null,
            },
          });
        }

        // 🔴 التعديل الجوهري: استدعاء نظام توزيع العمولات المطور 🔴
        if (affiliateTrackingId) {
          try {
            // الدالة دي هتوزع الـ 15% و 5% و 4% وتحدث كل الجداول صح
            await distributeTieredCommissions(userId, amountPaid, affiliateTrackingId);
            logger.info('Tiered commissions distributed via verify fallback', { affiliateTrackingId });
          } catch (commErr) {
            logger.error('Failed to distribute commissions in fallback', { error: commErr });
          }
        }

        logger.info('Course activated via verify fallback', { userId, courseId, amountPaid });
      }

      const purchase = await prisma.userCourse.findUnique({
        where: { userId_courseId: { userId, courseId } },
        include: { course: { select: { id: true, title: true, slug: true } } },
      });

      sendSuccess(res, {
        status: purchase?.status,
        courseId: purchase?.course?.id,
        course: purchase?.course,
        paidAt: purchase?.purchasedAt,
      }, 'Payment verified successfully');
    } catch (err) {
      next(err);
    }
  }
);

// ==================== MY PURCHASE HISTORY ====================
router.get(
  '/history',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const purchases = await prisma.userCourse.findMany({
        where: { userId: req.user!.userId },
        include: {
          course: { select: { title: true, slug: true, thumbnailUrl: true } },
        },
        orderBy: { purchasedAt: 'desc' },
      });
      sendSuccess(res, purchases);
    } catch (err) {
      next(err);
    }
  }
);

// ==================== ADMIN - All Transactions ====================
router.get(
  '/admin/transactions',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;

      const [transactions, total, revenue] = await Promise.all([
        prisma.userCourse.findMany({
          where: { status: 'COMPLETED' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { title: true } },
          },
          orderBy: { purchasedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.userCourse.count({ where: { status: 'COMPLETED' } }),
        prisma.userCourse.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amountPaid: true },
        }),
      ]);

      sendSuccess(res, {
        transactions,
        total,
        totalRevenue: revenue._sum.amountPaid || 0,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;