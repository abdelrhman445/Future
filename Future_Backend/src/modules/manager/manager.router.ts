import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma'; 

const router = Router();

// ==========================================
// 1. مسار البحث عن المستخدمين
// GET /api/manager/users/search?q=email
// ==========================================
router.get('/users/search', async (req: Request, res: Response) => {
  try {
    const searchQuery = req.query.q as string;
    
    if (!searchQuery) {
      return res.status(200).json({ data: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { lastName: { contains: searchQuery, mode: 'insensitive' } }
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

    res.status(200).json({ data: users });
  } catch (error) {
    console.error('[Manager Search Error]:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء البحث عن المستخدم' });
  }
});

// ==========================================
// 2. مسار تفعيل الكورس وتوزيع العمولات
// POST /api/manager/grant-course
// ==========================================
router.post('/grant-course', async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ message: 'بيانات المستخدم أو الكورس مفقودة' });
    }

    // 1. نجيب بيانات المستخدم والكورس من الداتابيز
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!user || !course) {
      return res.status(404).json({ message: 'المستخدم أو الكورس غير موجود' });
    }

    // 2. نحدد السعر الفعلي للكورس
    const actualPrice = course.salePrice && course.salePrice > 0 
      ? course.salePrice 
      : course.originalPrice;

    // 3. ننفذ العملية كلها في Transaction عشان نضمن الفلوس متضيعش وأمان البيانات
    await prisma.$transaction(async (tx) => {
      
      // 🔴 السحر كله هنا: هنجيب حركة الإحالة الأول قبل ما نضيف الكورس
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
          // 🔴 السطر ده اللي هيخلي "إجمالي المبيعات المحققة" تشتغل زي الفل!
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

    res.status(200).json({ message: 'تم تفعيل الكورس وتوزيع العمولات بنجاح 🎉' });
  } catch (error: any) {
    console.error('[Manager Grant Course Error]:', error);
    
    // P2002 = خطأ تكرار البيانات في Prisma (الكورس مفعل مسبقاً)
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'هذا الكورس مفعل بالفعل لهذا المستخدم 🔒' });
    }

    res.status(500).json({ message: 'حدث خطأ أثناء تفعيل الكورس وتوزيع العمولات' });
  }
});

export default router;