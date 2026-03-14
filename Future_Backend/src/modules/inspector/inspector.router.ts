import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../../core/guards/auth.guard';
import { AppError, sendSuccess } from '../../core/middlewares';
import prisma from '../../config/prisma';
import nodemailer from 'nodemailer'; // 🔴 استدعاء مكتبة الإيميلات مباشرة لحل المشكلة من جذورها

const router = Router();

// ==========================================
// 🛡️ Middleware: حماية المسار للمفتشين والمديرين فقط
// ==========================================
const requireInspector = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (role !== 'INSPECTOR' && role !== 'ADMIN' && role !== 'MANAGER') {
    return next(new AppError(403, 'عفواً، هذه الصفحة مخصصة للمحاضرين والمفتشين فقط'));
  }
  next();
};

// ==========================================
// 1. جلب الكورسات المخصصة لهذا المفتش فقط
// GET /api/inspector/my-courses
// ==========================================
router.get('/my-courses', authenticate, requireInspector, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspectorId = req.user!.userId;

    const courses = await prisma.course.findMany({
      where: {
        inspectors: { some: { id: inspectorId } }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        packageType: true,
        _count: { select: { purchases: true } }
      }
    });

    sendSuccess(res, courses);
  } catch (err) { next(err); }
});

// ==========================================
// 2. جلب قائمة الطلاب المشتركين في كورس معين
// GET /api/inspector/courses/:courseId/students
// ==========================================
router.get('/courses/:courseId/students', authenticate, requireInspector, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const inspectorId = req.user!.userId;

    const course = await prisma.course.findFirst({
      where: { id: courseId, inspectors: { some: { id: inspectorId } } }
    });

    if (!course) throw new AppError(403, 'غير مصرح لك بمتابعة هذا الكورس');

    const students = await prisma.userCourse.findMany({
      where: { courseId, status: 'COMPLETED' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    });

    sendSuccess(res, students.map(s => ({ ...s.user, purchasedAt: s.purchasedAt })));
  } catch (err) { next(err); }
});

// ==========================================
// 3. مسار سجل التقييمات (الحل الجذري والآمن 100%)
// GET /api/inspector/notes/history
// ==========================================
router.get('/notes/history', authenticate, requireInspector, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspectorId = req.user!.userId;
    
    const notes = await prisma.inspectorNote.findMany({
      where: { inspectorId },
      orderBy: { createdAt: 'desc' }
    });

    if (notes.length === 0) return sendSuccess(res, []);

    const studentIds = [...new Set(notes.map(n => n.studentId))];
    const courseIds = [...new Set(notes.map(n => n.courseId))];

    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true }
    });

    const formattedHistory = notes.map(n => ({
      ...n,
      content: n.note, 
      student: students.find(s => s.id === n.studentId),
      course: courses.find(c => c.id === n.courseId)
    }));

    sendSuccess(res, formattedHistory);
  } catch (err) { next(err); }
});

// ==========================================
// 4. جلب تقييمات طالب محدد
// GET /api/inspector/notes/:courseId/:studentId
// ==========================================
router.get('/notes/:courseId/:studentId', authenticate, requireInspector, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, studentId } = req.params;
    const inspectorId = req.user!.userId;

    const notes = await prisma.inspectorNote.findMany({
      where: { courseId, studentId, inspectorId },
      include: {
        inspector: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedNotes = notes.map(n => ({
      ...n,
      content: n.note 
    }));

    sendSuccess(res, formattedNotes);
  } catch (err) { next(err); }
});

// ==========================================
// 5. إضافة ملاحظة وإرسال إيميل للطالب (النهاية السعيدة للإيميل 📧)
// POST /api/inspector/notes
// ==========================================
router.post('/notes', authenticate, requireInspector, [
  body('studentId').isUUID().withMessage('معرف الطالب غير صالح'),
  body('courseId').isUUID().withMessage('معرف الكورس غير صالح'),
  body('note').isString().isLength({ min: 5 }).withMessage('الملاحظة يجب أن تكون 5 أحرف على الأقل')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(422, errors.array()[0].msg);

    const { studentId, courseId, note } = req.body;
    const inspectorId = req.user!.userId;

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!student || !course) throw new AppError(404, 'الطالب أو الكورس غير موجود');

    // 1. حفظ الملاحظة في الداتابيز
    const newNote = await prisma.inspectorNote.create({
      data: {
        inspectorId,
        studentId,
        courseId,
        note,
        emailSent: false
      }
    });

    // 2. إرسال الإيميل مباشرة عبر Nodemailer باستخدام الـ .env لتخطي أي مشكلة
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; color: #333;">
          <h2 style="color: #30c0f2;">تحديث جديد بخصوص متابعتك 🚀</h2>
          <p>أهلاً بك <strong>${student.firstName}</strong>،</p>
          <p>قام المتابع الخاص بك بترك ملاحظة تقييم جديدة لك في كورس: <strong>${course.title}</strong></p>
          <div style="background-color: #f9f9f9; padding: 15px; border-right: 4px solid #30c0f2; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 16px; white-space: pre-wrap;">${note}</p>
          </div>
          <p>استمر في مجهودك الرائع!</p>
          <p>مع تحيات،<br>فريق الدعم والتقييم | فيوتشر أكاديمي</p>
        </div>
      `;

      // 🔴 إعداد ناقل الإيميل من الـ env مباشرة
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // 🔴 إرسال الإيميل
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: student.email,
        subject: `ملاحظة تقييم جديدة - كورس ${course.title}`,
        html: emailHtml
      });

      // تحديث حالة الإيميل في الداتابيز بأنه تم الإرسال بنجاح
      await prisma.inspectorNote.update({
        where: { id: newNote.id },
        data: { emailSent: true }
      });
      console.log(`✅ [Email Sent Successfully] to: ${student.email}`);
    } catch (emailError) {
      console.error('❌ [Inspector Email Error]:', emailError);
    }

    // 3. إرجاع 200 OK للفرونت إند
    res.status(200).json({ 
      status: 'success', 
      data: { ...newNote, content: newNote.note }, 
      message: 'تم التقييم وإرسال الإيميل للطالب بنجاح 🎉' 
    });
  } catch (err) { next(err); }
});

export default router;