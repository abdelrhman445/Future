// ══════════════════════════════════════════════════════════
// الملف: src/modules/certificates/certificates.router.ts
// الوصف: إدارة الشهادات + الربط المالي + نظام الأفلييت الشبكي (3 مستويات)
// ══════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin } from '../../core/guards/auth.guard';
import { AppError, NotFoundError, sendSuccess } from '../../core/middlewares';
import prisma from '../../config/prisma';
// استيراد دالة توزيع الأرباح الشبكية من ملف الأفلييت
import { distributeTieredCommissions } from '../affiliate/affiliate.router';

const router = Router();

// ── دالة توليد رقم الشهادة الفريد ──
async function generateCertNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.certificate.count({
    where: { issuedAt: { gte: new Date(`${year}-01-01`) } }
  });
  const serial = String(count + 1).padStart(5, '0');
  return `CERT-${year}-${serial}`;
}

// ── دالة التحقق من إتمام الكورس 100% ──
async function checkCourseCompletion(userId: string, courseId: string): Promise<boolean> {
  const purchase = await prisma.userCourse.findUnique({
    where: { userId_courseId: { userId, courseId } }
  });
  
  if (!purchase) return false;
  if (purchase.status === 'COMPLETED' || purchase.progressPercent >= 100) return true;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        include: {
          lessons: { where: { isPublished: true }, select: { id: true } }
        }
      }
    }
  });
  
  if (!course) return false;
  const totalLessons = course.sections.flatMap(s => s.lessons).length;
  if (totalLessons === 0) return false;

  return !!purchase.completedAt;
}

// ══════════════════════════════════════════════════════════
// 1. شهاداتي — قائمة كل شهاداتي للمستخدم الحالي
// ══════════════════════════════════════════════════════════
router.get('/my/all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certs = await prisma.certificate.findMany({
      where: { userId: req.user!.userId },
      include: {
        course: {
          select: { title: true, thumbnailUrl: true, duration: true, slug: true }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });

    sendSuccess(res, certs.map(c => ({
      certNumber:   c.certNumber,
      courseTitle:  c.course.title,
      thumbnailUrl: c.course.thumbnailUrl,
      duration:     c.course.duration,
      issuedAt:     c.issuedAt,
      viewUrl:      `/certificates/${c.certNumber}`,
    })));

  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════
// 2. ADMIN — عرض كل الشهادات مع خاصية البحث والفلترة
// ══════════════════════════════════════════════════════════
router.get('/admin/all', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search ? {
      OR: [
        { certNumber: { contains: String(search), mode: 'insensitive' as any } },
        { user: { email: { contains: String(search), mode: 'insensitive' as any } } },
        { user: { firstName: { contains: String(search), mode: 'insensitive' as any } } },
        { course: { title: { contains: String(search), mode: 'insensitive' as any } } }
      ]
    } : {};

    const [certs, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          user:   { select: { firstName: true, lastName: true, email: true } },
          course: { select: { title: true } }
        },
        orderBy: { issuedAt: 'desc' },
        skip, 
        take: Number(limit)
      }),
      prisma.certificate.count({ where })
    ]);

    sendSuccess(res, { 
      certs, 
      total, 
      page: Number(page), 
      totalPages: Math.ceil(total / Number(limit)) 
    });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════
// 3. طلب إصدار شهادة (للمستخدم عند الإتمام)
// ══════════════════════════════════════════════════════════
router.post('/issue', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.body;

    if (!courseId) throw new AppError(400, 'courseId مطلوب');

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError('الكورس غير موجود');

    const isComplete = await checkCourseCompletion(userId, courseId);
    if (!isComplete) throw new AppError(403, 'لم تكمل الكورس بعد بنسبة 100% 🎓');

    const existing = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });

    if (existing) {
      return sendSuccess(res, {
        certNumber: existing.certNumber,
        viewUrl: `/certificates/${existing.certNumber}`,
      }, 'شهادتك موجودة بالفعل ✅');
    }

    const certNumber = await generateCertNumber();

    const result = await prisma.$transaction(async (tx) => {
      const newCert = await tx.certificate.create({
        data: { userId, courseId, certNumber },
        include: { course: { select: { title: true } }, user: { select: { firstName: true, lastName: true } } }
      });

      await tx.userCourse.update({
        where: { userId_courseId: { userId, courseId } },
        data: { completedAt: newCert.issuedAt, status: 'COMPLETED', progressPercent: 100 }
      });

      return newCert;
    });

    sendSuccess(res, {
      certNumber: result.certNumber,
      issuedAt:   result.issuedAt,
      courseTitle: result.course.title,
      studentName: `${result.user.firstName} ${result.user.lastName}`,
      viewUrl:    `/certificates/${result.certNumber}`,
    }, 'تم إصدار شهادتك بنجاح 🎉', 201);

  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════
// 4. ADMIN — إصدار شهادة يدوياً (سعر حقيقي + أرباح شبكية 3 مستويات)
// ══════════════════════════════════════════════════════════
router.post('/admin/issue-manual', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, courseId } = req.body;
    if (!userId || !courseId) throw new AppError(400, 'userId و courseId مطلوبين');

    const courseData = await prisma.course.findUnique({ where: { id: courseId } });
    if (!courseData) throw new NotFoundError('الكورس غير موجود');

    const existing = await prisma.certificate.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (existing) throw new AppError(409, 'الطالب لديه شهادة بالفعل');

    const certNumber = await generateCertNumber();
    const amount = courseData.originalPrice || 0;

    const result = await prisma.$transaction(async (tx) => {
      const c = await tx.certificate.create({
        data: { userId, courseId, certNumber },
        include: { user: { select: { firstName: true, lastName: true } }, course: { select: { title: true } } }
      });

      await tx.userCourse.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { 
          userId, courseId, status: 'COMPLETED', 
          progressPercent: 100, completedAt: c.issuedAt, 
          amountPaid: amount 
        },
        update: { 
          status: 'COMPLETED', progressPercent: 100, 
          completedAt: c.issuedAt, amountPaid: amount 
        }
      });

      return c;
    });

    // ✅ التعديل الذكي: التأكد من عدم توزيع عمولة لنفس الكورس مرتين لنفس الطالب
    const existingCommission = await prisma.affiliateTracking.findFirst({
      where: { referredUserId: userId, courseId: courseId }
    });

    if (amount > 0 && !existingCommission) {
      await distributeTieredCommissions(userId, amount, courseId);
    }

    sendSuccess(res, {
      certNumber: result.certNumber,
      studentName: `${result.user.firstName} ${result.user.lastName}`,
      courseTitle: result.course.title,
      recordedAmount: amount,
    }, 'تم إصدار الشهادة وتوزيع عمولات الأفلييت للمستويات الثلاثة بنجاح ✅', 201);

  } catch (err) { 
    console.error("ERROR IN ISSUE-MANUAL-TIERED:", err);
    next(err); 
  }
});

// ══════════════════════════════════════════════════════════
// 5. تحديث التقدم (Progress)
// ══════════════════════════════════════════════════════════
router.patch('/progress', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { courseId, progressPercent } = req.body;

    if (!courseId || progressPercent === undefined) throw new AppError(400, 'البيانات ناقصة');

    const pct = Math.min(100, Math.max(0, Number(progressPercent)));

    const updated = await prisma.userCourse.update({
      where: { userId_courseId: { userId, courseId } },
      data: {
        progressPercent: pct,
        lastAccessedAt:  new Date(),
        ...(pct >= 100 ? { completedAt: new Date(), status: 'COMPLETED' } : {})
      }
    });

    sendSuccess(res, { progressPercent: updated.progressPercent, isCompleted: pct >= 100 }, 
      pct >= 100 ? 'مبروك! أكملت الكورس بنجاح 🎉' : 'تم تحديث التقدم');

  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════
// 6. التحقق من الشهادة (عرض عام)
// ══════════════════════════════════════════════════════════
router.get('/verify/:certNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { certNumber: req.params.certNumber },
      include: {
        user:   { select: { firstName: true, lastName: true } },
        course: { 
          select: { 
            title: true, 
            duration: true,
            // 🔴 التعديل هنا: بنجيب الانسبكتور المربوط بالكورس
            inspectors: { 
              select: { firstName: true, lastName: true },
              take: 1 // هنجيب أول انسبكتور لو الكورس فيه أكتر من واحد
            }
          } 
        }
      }
    });

    if (!cert) throw new NotFoundError('الشهادة غير موجودة');

    // 🔴 تجميع اسم الانسبكتور لو الكورس ليه انسبكتور
    let inspectorFullName = undefined;
    if (cert.course.inspectors && cert.course.inspectors.length > 0) {
      inspectorFullName = `${cert.course.inspectors[0].firstName} ${cert.course.inspectors[0].lastName}`;
    }

    sendSuccess(res, {
      certNumber:  cert.certNumber,
      studentName: `${cert.user.firstName} ${cert.user.lastName}`,
      courseTitle: cert.course.title,
      duration:    cert.course.duration,
      issuedAt:    cert.issuedAt,
      isValid:     true,
      inspectorName: inspectorFullName // 🔴 بنبعت الاسم للفرونت إند هنا
    });

  } catch (err) { next(err); }
});
// ══════════════════════════════════════════════════════════
// 7. ADMIN — حذف/إلغاء شهادة + إعادة حالة الكورس للطلاب
// ══════════════════════════════════════════════════════════
router.delete('/admin/:certNumber', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { certNumber } = req.params;
    
    // إيجاد بيانات الشهادة قبل حذفها
    const cert = await prisma.certificate.findUnique({ where: { certNumber } });
    if (!cert) throw new NotFoundError('الشهادة غير موجودة');

    await prisma.$transaction([
      // 1. حذف الشهادة
      prisma.certificate.delete({ where: { certNumber } }),
      // 2. إعادة حالة الكورس للطالب إلى (قيد التقدم) ومسح تاريخ الانتهاء
      prisma.userCourse.update({
        where: { userId_courseId: { userId: cert.userId, courseId: cert.courseId } },
        data: { status: 'PENDING' as any, completedAt: null, progressPercent: 99 }
      })
    ]);

    sendSuccess(res, null, 'تم إلغاء الشهادة وحذفها وإعادة الكورس لحالة المتابعة بنجاح');
  } catch (err) { next(err); }
});

export default router;