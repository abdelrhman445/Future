import { Request, Response } from 'express';
import { constructWebhookEvent } from './stripe.service';
import prisma from '../../config/prisma';
import { logger } from '../../core/utils/logger';
// 🔴 استيراد دالة توزيع الأرباح الشبكية من موديل الـ affiliate
import { distributeTieredCommissions } from '../affiliate/affiliate.router'; 

/**
 * STRIPE WEBHOOK HANDLER
 * يستقبل إشعارات الدفع من Stripe ويقوم بتفعيل الكورسات وتوزيع العمولات
 */
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event;
  try {
    // ملاحظة: req.body يجب أن يكون raw Buffer كما تم ضبطه في server.ts
    event = constructWebhookEvent(req.body as Buffer, signature);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err });
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  logger.info('Stripe webhook received', { type: event.type });

  try {
    switch (event.type) {

      // ✅ الحالة: نجاح عملية الدفع
      case 'checkout.session.completed': {
        const session = event.data.object as unknown as {
  metadata: { courseId: string; userId: string; affiliateTrackingId?: string };
  amount_total: number;
  currency: string;
  id: string;
};

const { courseId, userId, affiliateTrackingId = null } = session.metadata;
        // تحويل المبلغ من سنت (Stripe) إلى دولار
        const amountPaid = (session.amount_total || 0) / 100;

        // 1. تفعيل الكورس للمشتري
        const existing = await prisma.userCourse.findUnique({
          where: { userId_courseId: { userId, courseId } },
        });

        if (existing?.status === 'COMPLETED') {
          logger.warn('Course already activated', { userId, courseId });
          break;
        }

        if (existing) {
          await prisma.userCourse.update({
            where: { userId_courseId: { userId, courseId } },
            data: {
              status: 'COMPLETED',
              amountPaid,
              paymentRef: session.id,
            },
          });
        } else {
          await prisma.userCourse.create({
            data: {
              userId,
              courseId,
              status: 'COMPLETED',
              amountPaid,
              currency: session.currency?.toUpperCase() || 'USD',
              paymentMethod: 'stripe',
              paymentRef: session.id,
              affiliateTrackingId: affiliateTrackingId || null,
            },
          });
        }

        // 2. 🔴 توزيع العمولات بنظام المستويات (15% - 5% - 4%)
        // تم استبدال الكود القديم اليدوي بالدالة المركزية لضمان دقة الحسابات
        if (affiliateTrackingId) {
          try {
            await distributeTieredCommissions(userId, amountPaid, affiliateTrackingId);
            logger.info('Tiered commissions distributed successfully', { affiliateTrackingId, amountPaid });
          } catch (commErr) {
            // سجل الخطأ ولكن لا تعطل الـ Webhook لأن تفعيل الكورس للمشتري تم بنجاح
            logger.error('Error distributing tiered commissions', { error: commErr, affiliateTrackingId });
          }
        }

        // 3. تسجيل العملية في سجل التدقيق (AuditLog)
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'COURSE_PURCHASED',
            resource: 'UserCourse',
            resourceId: courseId,
            metadata: JSON.stringify({ 
              amountPaid, 
              paymentRef: session.id, 
              gateway: 'stripe',
              affiliateId: affiliateTrackingId 
            }),
          },
        });

        logger.info('Course purchase processed fully', { userId, courseId });
        break;
      }

      // ❌ الحالة: فشل عملية الدفع
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as { 
          metadata: { userId?: string; courseId?: string }; 
          last_payment_error?: { message?: string } 
        };
        logger.warn('Payment failed for user', {
          userId: paymentIntent.metadata?.userId,
          error: paymentIntent.last_payment_error?.message,
        });
        break;
      }

      default:
        logger.info('Unhandled Stripe event type', { type: event.type });
    }

    // إرسال رد لـ Stripe بأن الإشعار تم استلامه بنجاح
    res.json({ received: true });

  } catch (err) {
    logger.error('Critical error in Webhook processing', { error: err, eventType: event.type });
    res.status(500).json({ error: 'Internal Server Error during webhook processing' });
  }
}