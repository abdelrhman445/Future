import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../../core/guards/auth.guard';
import { AppError, sendSuccess } from '../../core/middlewares';
import prisma from '../../config/prisma';

const router = Router();

function handleValidation(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(422, errors.array()[0].msg));
  next();
}

// ==================== MY AFFILIATE DASHBOARD ====================
router.get('/dashboard', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // ✅ التعديل الجوهري: حساب المبيعات من جدول userCourse بالاعتماد على التتبع أو الربط المباشر لضمان عدم ظهور 0
    const salesAgg = await prisma.userCourse.aggregate({
      where: {
        user: {
          OR: [
            { referredById: userId }, // الربط المباشر الجديد
            { referredTracking: { some: { referrerId: userId } } } // الربط عن طريق جدول التتبع (للمستخدمين القدامى)
          ]
        },
        amountPaid: { gt: 0 }
      },
      _sum: { amountPaid: true }
    });
    const totalSales = salesAgg._sum.amountPaid || 0;

    const [user, referrals, totalEarnings, pendingCount, withdrawals] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          affiliateCode: true, affiliateLink: true,
          totalEarnings: true, pendingEarnings: true,
        },
      }),
      prisma.affiliateTracking.findMany({
        where: { referrerId: userId },
        include: {
          referredUser: {
            select: { firstName: true, lastName: true, email: true, createdAt: true },
          },
          course: { select: { title: true, thumbnailUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.affiliateTracking.aggregate({
        where: { referrerId: userId, status: 'APPROVED' },
        _sum: { commissionAmount: true },
      }),
      prisma.affiliateTracking.count({ where: { referrerId: userId, status: 'PENDING' } }),
      
      // الاستعلام الجديد: جلب أحدث طلبات السحب الخاصة بهذا المستخدم
      prisma.withdrawalRequest.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    sendSuccess(res, {
      affiliate: user,
      referrals,
      withdrawals,
      stats: {
        totalReferrals: await prisma.affiliateTracking.count({ where: { referrerId: userId } }),
        totalEarnings: user?.totalEarnings || 0, // 🔴 تم التصحيح لتقرأ من حقل المستخدم مباشرة
        pendingReferrals: pendingCount,
        totalSalesGenerated: totalSales, 
      },
      page,
    });
  } catch (err) { next(err); }
});

// ==================== MY REFERRALS ====================
router.get('/my-referrals', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const referrals = await prisma.affiliateTracking.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            isActive: true, createdAt: true,
            _count: { select: { purchases: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, referrals.map(r => ({
      ...r.referredUser,
      referralDate: r.createdAt,
      hasPurchased: (r.referredUser as { _count?: { purchases?: number } })._count?.purchases ? (r.referredUser as { _count?: { purchases?: number } })._count!.purchases! > 0 : false,
      commissionEarned: r.commissionAmount,
    })));
  } catch (err) { next(err); }
});

// ==================== REQUEST WITHDRAWAL ====================
router.post('/withdraw', authenticate, [
  body('amount').isFloat({ min: 10 }).withMessage('Minimum withdrawal is $10'),
  body('method').isIn(['bank', 'paypal', 'vodafone_cash', 'instapay']),
  body('accountDetails').trim().isLength({ min: 5 }),
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { amount, method, accountDetails } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');
    
    if (user.pendingEarnings < amount) {
      throw new AppError(400, `Insufficient balance. Available: $${user.pendingEarnings}`);
    }

    // ✅ التعديل: حساب المبيعات بنفس المنطق القوي (OR) لضمان دقة شرط الـ 300 دولار
    const salesAgg = await prisma.userCourse.aggregate({
      where: {
        user: {
          OR: [
            { referredById: userId },
            { referredTracking: { some: { referrerId: userId } } }
          ]
        },
        amountPaid: { gt: 0 }
      },
      _sum: { amountPaid: true }
    });
    
    const totalSales = salesAgg._sum.amountPaid || 0;
    if (totalSales < 300) {
      throw new AppError(400, `لا يمكنك سحب الأرباح حتى يصل إجمالي مبيعاتك إلى 300 دولار. مبيعاتك الحالية: $${totalSales}`);
    }

    const pendingWithdrawal = await prisma.withdrawalRequest.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (pendingWithdrawal) throw new AppError(409, 'You already have a pending withdrawal request');

    const withdrawal = await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawalRequest.create({
        data: { userId, amount, method, accountDetails },
      });
      await tx.user.update({
        where: { id: userId },
        data: { pendingEarnings: { decrement: amount } },
      });
      return w;
    });

    // 🔴 [إضافة اللوج] تسجيل طلب السحب الجديد
    await prisma.auditLog.create({
      data: {
        userId: userId, // المسوق اللي طلب الفلوس
        action: 'WITHDRAWAL_REQUEST',
        resource: 'Withdrawals',
        resourceId: withdrawal.id,
        ipAddress: req.ip || '', // عشان نعرف طلب منين
        metadata: JSON.stringify({ amount, method, accountDetails })
      }
    });

    sendSuccess(res, { withdrawalId: withdrawal.id }, 'Withdrawal request submitted', 201);
  } catch (err) { next(err); }
});

// ==================== ADMIN - All Withdrawals ====================
router.get('/withdrawals', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string;
    const where = status ? { status: status as never } : {};

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, withdrawals);
  } catch (err) { next(err); }
});

// ==================== ADMIN - Process Withdrawal ====================
router.patch('/withdrawals/:id', authenticate, requireAdmin, [
  body('status').isIn(['PROCESSING', 'COMPLETED', 'REJECTED']),
  body('adminNote').optional().trim(),
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, adminNote } = req.body;

    const withdrawal = await prisma.withdrawalRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        adminNote,
        processedAt: new Date(),
      },
    });

    if (status === 'REJECTED') {
      await prisma.user.update({
        where: { id: withdrawal.userId },
        data: { pendingEarnings: { increment: withdrawal.amount } },
      });
    }

    if (status === 'COMPLETED') {
      await prisma.user.update({
        where: { id: withdrawal.userId },
        data: { totalEarnings: { decrement: withdrawal.amount } },
      });
      await prisma.affiliateTracking.updateMany({
        where: { referrerId: withdrawal.userId, status: 'APPROVED' },
        data: { status: 'PAID' },
      });
    }

    // 🔴 [إضافة اللوج] تسجيل مراجعة الأدمن لطلب السحب
    let actionName = 'WITHDRAWAL_PROCESSING';
    if (status === 'COMPLETED') actionName = 'WITHDRAWAL_APPROVED';
    if (status === 'REJECTED') actionName = 'WITHDRAWAL_REJECTED';

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId, // الأدمن اللي راجع الطلب
        action: actionName,
        resource: 'Withdrawals',
        resourceId: withdrawal.id,
        ipAddress: req.ip || '',
        metadata: JSON.stringify({ targetUserId: withdrawal.userId, amount: withdrawal.amount, adminNote })
      }
    });

    sendSuccess(res, withdrawal, 'Withdrawal updated');
  } catch (err) { next(err); }
});

// ==================== ADMIN - Affiliate Stats ====================
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalTracking, topReferrers, totalPaid] = await Promise.all([
      prisma.affiliateTracking.count(),
      prisma.user.findMany({
        where: { totalEarnings: { gt: 0 } },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          totalEarnings: true, affiliateCode: true,
          _count: { select: { referrals: true } },
        },
        orderBy: { totalEarnings: 'desc' },
        take: 10,
      }),
      prisma.affiliateTracking.aggregate({
        where: { status: 'PAID' },
        _sum: { commissionAmount: true },
      }),
    ]);

    sendSuccess(res, { totalTracking, topReferrers, totalPaid: totalPaid._sum.commissionAmount || 0 });
  } catch (err) { next(err); }
});

export default router;

// ============================================================================
// 🔴 دالة توزيع الأرباح الشبكية (Multi-Tier Affiliate) لـ 3 مستويات فقط 🔴
// تم حل مشكلة التايب سكريبت والاعتماد على جدول AffiliateTracking
// ============================================================================
export async function distributeTieredCommissions(buyerId: string, amountPaid: number, courseId?: string) {
  
  // ================= المستوى الأول (المباشر) - يأخذ 15% =================
  // هنجيب حركة الإحالة بدل ما ندور جوه اليوزر
  const level1Tracking = await prisma.affiliateTracking.findFirst({
    where: { referredUserId: buyerId }
  });

  if (!level1Tracking) return; // المستخدم لم يسجل عن طريق إحالة

  const comm1 = amountPaid * 0.15; 
  if (comm1 > 0) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: level1Tracking.referrerId },
        data: { 
          pendingEarnings: { increment: comm1 },
          totalEarnings: { increment: comm1 } 
        }
      }),
      prisma.affiliateTracking.update({
        where: { id: level1Tracking.id },
        data: { 
          commissionAmount: { increment: comm1 }, 
          courseId: courseId || null,
          status: 'APPROVED' 
        }
      })
    ]);

    // ================= المستوى الثاني - يأخذ 5% =================
    const level2Tracking = await prisma.affiliateTracking.findFirst({
      where: { referredUserId: level1Tracking.referrerId }
    });

    if (level2Tracking) {
      const comm2 = amountPaid * 0.05; 
      if (comm2 > 0) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: level2Tracking.referrerId },
            data: { 
              pendingEarnings: { increment: comm2 },
              totalEarnings: { increment: comm2 } 
            }
          }),
          prisma.affiliateTracking.update({
            where: { id: level2Tracking.id },
            data: { 
              commissionAmount: { increment: comm2 }, 
              status: 'APPROVED' 
            }
          })
        ]);

        // ================= المستوى الثالث - يأخذ 4% =================
        const level3Tracking = await prisma.affiliateTracking.findFirst({
          where: { referredUserId: level2Tracking.referrerId }
        });

        if (level3Tracking) {
          const comm3 = amountPaid * 0.04; 
          if (comm3 > 0) {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: level3Tracking.referrerId },
                data: { 
                  pendingEarnings: { increment: comm3 },
                  totalEarnings: { increment: comm3 } 
                }
              }),
              prisma.affiliateTracking.update({
                where: { id: level3Tracking.id },
                data: { 
                  commissionAmount: { increment: comm3 }, 
                  status: 'APPROVED' 
                }
              })
            ]);
          }
        }
      }
    }
  }
}