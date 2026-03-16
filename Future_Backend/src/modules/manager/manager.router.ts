import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma';
import { authenticate, requireManager } from '../../core/guards/auth.guard';
import { AppError, sendSuccess } from '../../core/middlewares';

const router = Router();

// ==========================================
// 1. مسار البحث عن المستخدمين
// GET /api/manager/users/search?q=email
// ==========================================
router.get('/users/search', authenticate, requireManager, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const searchQuery = req.query.q as string;
    
    if (!searchQuery) {
      return sendSuccess(res, []);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { lastName: { contains: searchQuery, mode: 'insensitive' } },
          { phone: { contains: searchQuery } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 10 // إرجاع 10 نتائج فقط لتسريع البحث
    });

    sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 2. مسار تفعيل الكورس الواحد وتوزيع العمولات
// POST /api/manager/grant-course
// ==========================================
router.post('/grant-course', authenticate, requireManager, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      throw new AppError(400, 'بيانات المستخدم أو الكورس مفقودة');
    }

    // 1. نجيب بيانات المستخدم والكورس من الداتابيز
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!user || !course) {
      throw new AppError(404, 'المستخدم أو الكورس غير موجود');
    }

    // 2. نحدد السعر الفعلي للكورس
    const actualPrice = course.salePrice && course.salePrice > 0 
      ? course.salePrice 
      : course.originalPrice;

    // 3. ننفذ العملية كلها في Transaction عشان نضمن الفلوس متضيعش وأمان البيانات
    await prisma.$transaction(async (tx) => {
      
      // ================= المستوى الأول (المباشر) - 15% =================
      const level1Tracking = await tx.affiliateTracking.findFirst({
        where: { referredUserId: userId }
      });

      // أ) إضافة الكورس للمستخدم بالسعر الحقيقي مع ربطه برقم الإحالة
      await tx.userCourse.create({
        data: {
          userId: userId,
          courseId: courseId,
          status: 'COMPLETED',
          amountPaid: actualPrice,
          paymentMethod: 'MANUAL_GRANT',
          // 🔴 السطر ده اللي بيخلي "إجمالي المبيعات المحققة" تشتغل
          affiliateTrackingId: level1Tracking ? level1Tracking.id : null
        }
      });

      // ب) نظام الإحالة (Affiliate) - توزيع العمولات على 3 مستويات
      if (level1Tracking) {
        const comm1 = actualPrice * 0.15;
        if (comm1 > 0) {
          // 1. تحديث رصيد المسوق
          await tx.user.update({
            where: { id: level1Tracking.referrerId },
            data: { 
              pendingEarnings: { increment: comm1 },
              totalEarnings: { increment: comm1 } 
            }
          });
          // 2. تحديث حركة الإحالة
          await tx.affiliateTracking.update({
            where: { id: level1Tracking.id },
            data: { 
              commissionAmount: { increment: comm1 }, 
              courseId: courseId, 
              status: 'APPROVED' 
            }
          });

          // ================= المستوى الثاني - 5% =================
          const level2Tracking = await tx.affiliateTracking.findFirst({
            where: { referredUserId: level1Tracking.referrerId }
          });

          if (level2Tracking) {
            const comm2 = actualPrice * 0.05;
            if (comm2 > 0) {
              await tx.user.update({
                where: { id: level2Tracking.referrerId },
                data: { 
                  pendingEarnings: { increment: comm2 },
                  totalEarnings: { increment: comm2 } 
                }
              });
              await tx.affiliateTracking.update({
                where: { id: level2Tracking.id },
                data: { 
                  commissionAmount: { increment: comm2 }, 
                  status: 'APPROVED' 
                }
              });

              // ================= المستوى الثالث - 4% =================
              const level3Tracking = await tx.affiliateTracking.findFirst({
                where: { referredUserId: level2Tracking.referrerId }
              });

              if (level3Tracking) {
                const comm3 = actualPrice * 0.04;
                if (comm3 > 0) {
                  await tx.user.update({
                    where: { id: level3Tracking.referrerId },
                    data: { 
                      pendingEarnings: { increment: comm3 },
                      totalEarnings: { increment: comm3 } 
                    }
                  });
                  await tx.affiliateTracking.update({
                    where: { id: level3Tracking.id },
                    data: { 
                      commissionAmount: { increment: comm3 }, 
                      status: 'APPROVED' 
                    }
                  });
                }
              }
            }
          }
        }
      }
    });

    sendSuccess(res, null, 'تم تفعيل الكورس وتوزيع العمولات بنجاح 🎉');
  } catch (error: any) {
    if (error.code === 'P2002') {
      next(new AppError(400, 'هذا الكورس مفعل بالفعل لهذا المستخدم 🔒'));
    } else {
      next(error);
    }
  }
});

// ==========================================
// 3. مسار تفعيل باقة كاملة وتوزيع العمولات
// POST /api/manager/grant-package
// ==========================================
router.post('/grant-package', authenticate, requireManager, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, packageId } = req.body;

    if (!userId || !packageId) {
      throw new AppError(400, 'بيانات المستخدم أو الباقة مفقودة');
    }

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) throw new AppError(404, 'الباقة غير موجودة');

    // المترجم الذكي للباقات
    let packageTypeEnum: any = null;
    const nameStr = pkg.name.toLowerCase();

    // 🔴 التعديل هنا: إضافة دعم اختيار ALL لفتح كل الكورسات
    if (nameStr.includes('all') || nameStr.includes('الكل')) {
      packageTypeEnum = 'ALL';
    } else if (nameStr.includes('basic') || nameStr.includes('بيزك')) {
      packageTypeEnum = 'BASIC';
    } else if (nameStr.includes('standard') || nameStr.includes('ستاندر')) {
      packageTypeEnum = 'STANDARD';
    } else if (nameStr.includes('premium') || nameStr.includes('بريميوم') || nameStr.includes('بريميم')) {
      packageTypeEnum = 'PREMIUM';
    } else if (nameStr.includes('enterprise') || nameStr.includes('انتربرايز')) {
      packageTypeEnum = 'ENTERPRISE';
    } else {
        const exactMatch = ['ALL', 'BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE'].find(e => e === pkg.name.toUpperCase());
        if (exactMatch) packageTypeEnum = exactMatch;
        else throw new AppError(400, 'اسم الباقة يجب أن يحتوي على (All, Basic, Standard, Premium, Enterprise) أو ما يقابلها بالعربي.');
    }

    // 🔴 التعديل هنا: لو النوع ALL بنجيب كل الكورسات، غير كدة بنفلتر بالنوع
    const courses = await prisma.course.findMany({ 
      where: packageTypeEnum === 'ALL' ? {} : { packageType: packageTypeEnum } 
    });

    if (courses.length === 0) throw new AppError(400, 'لا توجد كورسات مرتبطة بهذه الباقة حالياً ⚠️');

    const pricePerCourse = pkg.price / courses.length;

    // 🔴 ننفذ العملية كلها في Transaction زي الكورس بالظبط
    await prisma.$transaction(async (tx) => {
      
      // ================= المستوى الأول (المباشر) =================
      const level1Tracking = await tx.affiliateTracking.findFirst({
        where: { referredUserId: userId }
      });

      // 1. تفعيل كل الكورسات للمستخدم وربطها بالمسوق عشان المبيعات تسمع
      await Promise.all(courses.map(c => 
        tx.userCourse.upsert({
          where: { userId_courseId: { userId, courseId: c.id } },
          update: { 
            status: 'COMPLETED', 
            amountPaid: pricePerCourse, 
            paymentMethod: 'MANUAL_PACKAGE_GRANT',
            // 🔴 ربط التحديث بالمسوق
            affiliateTrackingId: level1Tracking ? level1Tracking.id : null 
          },
          create: { 
            userId, 
            courseId: c.id, 
            status: 'COMPLETED', 
            amountPaid: pricePerCourse, 
            paymentMethod: 'MANUAL_PACKAGE_GRANT',
            // 🔴 ربط الإنشاء بالمسوق
            affiliateTrackingId: level1Tracking ? level1Tracking.id : null 
          }
        })
      ));

      // 2. توزيع العمولات على 3 مستويات (15%، 5%، 4%) بناءً على سعر الباقة
      if (level1Tracking) {
        const comm1 = pkg.price * 0.15;
        if (comm1 > 0) {
          await tx.user.update({
            where: { id: level1Tracking.referrerId },
            data: { pendingEarnings: { increment: comm1 }, totalEarnings: { increment: comm1 } }
          });
          await tx.affiliateTracking.update({
            where: { id: level1Tracking.id },
            data: { commissionAmount: { increment: comm1 }, status: 'APPROVED' }
          });

          // ================= المستوى الثاني =================
          const level2Tracking = await tx.affiliateTracking.findFirst({
            where: { referredUserId: level1Tracking.referrerId }
          });

          if (level2Tracking) {
            const comm2 = pkg.price * 0.05;
            if (comm2 > 0) {
              await tx.user.update({
                where: { id: level2Tracking.referrerId },
                data: { pendingEarnings: { increment: comm2 }, totalEarnings: { increment: comm2 } }
              });
              await tx.affiliateTracking.update({
                where: { id: level2Tracking.id },
                data: { commissionAmount: { increment: comm2 }, status: 'APPROVED' }
              });

              // ================= المستوى الثالث =================
              const level3Tracking = await tx.affiliateTracking.findFirst({
                where: { referredUserId: level2Tracking.referrerId }
              });

              if (level3Tracking) {
                const comm3 = pkg.price * 0.04;
                if (comm3 > 0) {
                  await tx.user.update({
                    where: { id: level3Tracking.referrerId },
                    data: { pendingEarnings: { increment: comm3 }, totalEarnings: { increment: comm3 } }
                  });
                  await tx.affiliateTracking.update({
                    where: { id: level3Tracking.id },
                    data: { commissionAmount: { increment: comm3 }, status: 'APPROVED' }
                  });
                }
              }
            }
          }
        }
      }
    });

    sendSuccess(res, null, `تم تفعيل باقة ${pkg.name} (${courses.length} كورسات) وتوزيع العمولات والمبيعات بنجاح 🎉`);
  } catch (err) {
    next(err);
  }
});

export default router;