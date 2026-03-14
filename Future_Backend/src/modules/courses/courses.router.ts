import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin, requireManager } from '../../core/guards/auth.guard';
import { AppError, NotFoundError, ForbiddenError, sendSuccess } from '../../core/middlewares';
import { generateSignedUrl } from '../../core/utils/signedUrl';
import prisma from '../../config/prisma';

const router = Router();

function handleValidation(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(422, errors.array()[0].msg));
  next();
}

//
// ==================== ADMIN - List ALL Courses (Dashboard Only) ====================
//
router.get('/admin/all', authenticate, requireManager, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        thumbnailUrl: true,
        packageType: true,
        originalPrice: true,
        salePrice: true,
        currency: true,
        duration: true,
        totalLessons: true,
        language: true,
        level: true,
        commissionRate: true,
        status: true,
        createdAt: true,
        // 🔴🔴 الحل هنا: جلب بيانات المحاضرين عشان تظهر في الجدول
        inspectors: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    sendSuccess(res, { courses });
  } catch (err) { next(err); }
});

//
// ==================== PUBLIC - List Courses ====================
//
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
    const skip = (page - 1) * limit;
    const packageType = req.query.package as string;

    const where = {
      status: 'PUBLISHED' as any,
      ...(packageType && { packageType: packageType as never }),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          thumbnailUrl: true,
          packageType: true,
          originalPrice: true,
          salePrice: true,
          currency: true,
          duration: true,
          totalLessons: true,
          language: true,
          level: true,
          commissionRate: true,
          status: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.course.count({ where })
    ]);

    sendSuccess(res, {
      courses,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) { next(err); }
});

//
// ==================== PUBLIC - Get Course Details ====================
//
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await prisma.course.findFirst({
      where: {
        slug: req.params.slug,
        status: 'PUBLISHED' as any 
      },
      include: {
        sections: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                order: true,
                videoDuration: true,
                isFreePreview: true
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        // 🔴 جلب المحاضرين في صفحة الكورس العامة
        inspectors: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    if (!course) throw new NotFoundError('Course not found');

    sendSuccess(res, course);
  } catch (err) { next(err); }
});

//
// ==================== AUTH - Course Content (Purchased Users & Free Previews) ====================
//
router.get('/:courseId/content', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { courseId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 1. هل هو مدير؟
    const isPrivileged = userRole === 'ADMIN' || userRole === 'MANAGER';

    // 2. هل هو اشترى الكورس؟
    let hasPurchased = false;
    if (!isPrivileged) {
      const purchase = await prisma.userCourse.findUnique({
        where: { userId_courseId: { userId, courseId } }
      });
      if (purchase && purchase.status === 'COMPLETED') {
        hasPurchased = true;
      }
    }

    // 3. نجيب محتوى الكورس بالكامل
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lessons: { orderBy: { order: 'asc' } }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!course) throw new NotFoundError('Course not found');

    // 4. نوزع الروابط بناءً على الصلاحيات أو إذا كانت المحاضرة مجانية
    const courseWithSignedUrls = {
      ...course,
      sections: course.sections.map(section => ({
        ...section,
        lessons: section.lessons.map(lesson => {
          
          // الشرط السحري: يقدر يشوف الفيديو لو مدير، أو مشتري، أو المحاضرة دي بالذات مجانية
          const canWatchVideo = isPrivileged || hasPurchased || lesson.isFreePreview;

          return {
            ...lesson,
            videoUrl: canWatchVideo && lesson.videoUrl
              ? generateSignedUrl({
                  resourceId: lesson.id,
                  resourceType: 'video',
                  userId
                }).url
              : null // لو مش مسموحله، الرابط يرجع فاضي عشان مايسرقوش
          };
        })
      }))
    };

    sendSuccess(res, courseWithSignedUrls);

  } catch (err) { next(err); }
});

//
// ==================== ADMIN - Create Course ====================
//
router.post(
  '/',
  authenticate,
  requireManager,
  [
    body('title').trim().isLength({ min: 3, max: 200 }),
    body('originalPrice').isFloat({ min: 0 }),
    body('packageType').isIn(['BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE']),
    body('commissionRate').optional().isFloat({ min: 0, max: 100 })
  ],
  handleValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {

      const {
        title,
        description,
        shortDescription,
        thumbnailUrl,
        originalPrice,
        salePrice,
        packageType,
        commissionRate,
        language,
        level,
        duration,
        currency
      } = req.body;

      const baseSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const uniqueSuffix = Date.now().toString(36);
      const slug = `${baseSlug}-${uniqueSuffix}`;

      const course = await prisma.course.create({
        data: {
          title,
          slug,
          description: description || shortDescription || title,
          shortDescription: shortDescription || '',
          thumbnailUrl: thumbnailUrl || null,
          originalPrice: parseFloat(originalPrice),
          salePrice: salePrice ? parseFloat(salePrice) : null,
          currency: currency || 'USD',
          packageType,
          commissionRate: commissionRate ? parseFloat(commissionRate) : 15,
          language: language || 'Arabic',
          level: level || 'Beginner',
          duration: duration ? parseInt(duration) : null
        }
      });

      sendSuccess(res, course, 'Course created', 201);

    } catch (err) { next(err); }
  }
);

//
// ==================== ADMIN - Assign Inspectors to Course ====================
// 🔴 إضافة جديدة: لتعيين المفتشين للكورسات
//
router.post('/:courseId/assign-inspectors', authenticate, requireAdmin, [
  body('inspectorIds').isArray().withMessage('يجب إرسال مصفوفة بمعرفات المفتشين')
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const { inspectorIds } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError('الكورس غير موجود');

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        inspectors: {
          set: inspectorIds.map((id: string) => ({ id })) 
        }
      },
      include: {
        inspectors: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    sendSuccess(res, updatedCourse, 'تم تحديث مفتشي الكورس بنجاح 🎉');
  } catch (err) { next(err); }
});

//
// ==================== ADMIN - Update Course ====================
//
router.patch('/:courseId', authenticate, requireManager, async (req: Request, res: Response, next: NextFunction) => {
  try {

    const course = await prisma.course.update({
      where: { id: req.params.courseId },
      data: req.body
    });

    sendSuccess(res, course, 'Course updated');

  } catch (err) { next(err); }
});

//
// ==================== ADMIN - Delete Course ====================
//
router.delete('/:courseId', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {

    await prisma.course.update({
      where: { id: req.params.courseId },
      data: { status: 'ARCHIVED' as any } 
    });

    sendSuccess(res, null, 'Course archived');

  } catch (err) { next(err); }
});

//
// ==================== ADMIN - Add Section ====================
//
router.post('/:courseId/sections', authenticate, requireManager, [
  body('title').trim().isLength({ min: 1 }),
  body('order').isInt({ min: 1 })
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {

    const section = await prisma.courseSection.create({
      data: {
        courseId: req.params.courseId,
        title: req.body.title,
        order: req.body.order
      }
    });

    sendSuccess(res, section, 'Section created', 201);

  } catch (err) { next(err); }
});

//
// ==================== ADMIN - Add Lesson ====================
//
router.post('/sections/:sectionId/lessons', authenticate, requireManager, [
  body('title').trim().isLength({ min: 1 }),
  body('order').isInt({ min: 1 })
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {

    const lesson = await prisma.lesson.create({
      data: {
        sectionId: req.params.sectionId,
        title: req.body.title,
        description: req.body.description,
        videoUrl: req.body.videoUrl,
        videoDuration: req.body.videoDuration,
        order: req.body.order,
        isFreePreview: req.body.isFreePreview || false
      }
    });

    sendSuccess(res, lesson, 'Lesson created', 201);

  } catch (err) { next(err); }
});

//
// ==================== ADMIN - Update Lesson ====================
// 
// تم إضافة هذا المسار لحل مشكلة "Failed to save lesson" عند التعديل
//
router.patch('/lessons/:lessonId', authenticate, requireManager, [
  body('title').optional().trim().isLength({ min: 1 }),
  body('isFreePreview').optional().isBoolean()
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, videoUrl, videoDuration, order, isFreePreview } = req.body;

    const lesson = await prisma.lesson.update({
      where: { id: req.params.lessonId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(videoDuration !== undefined && { videoDuration }),
        ...(order !== undefined && { order }),
        ...(isFreePreview !== undefined && { isFreePreview })
      }
    });

    sendSuccess(res, lesson, 'Lesson updated successfully');

  } catch (err) { next(err); }
});

//
// ==================== ADMIN - Pending Courses ====================
//
// 🔴 تم تصحيح هذا المسار ليصبح /admin/pending بدلاً من /admin/all لتجنب التضارب
router.get('/admin/pending', authenticate, requireManager, async (req, res, next) => {
  try {

    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        thumbnailUrl: true,
        originalPrice: true,
        packageType: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    sendSuccess(res, { courses });

  } catch (err) {
    next(err);
  }
});

//
// ==================== ADMIN - Publish Course ====================
//
router.patch(
  '/:courseId/publish',
  authenticate,
  requireManager,
  async (req: Request, res: Response, next: NextFunction) => {
    try {

      const course = await prisma.course.update({
        where: { id: req.params.courseId },
        data: { status: 'PUBLISHED' as any } 
      });

      sendSuccess(res, course, 'Course published');

    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/admin/:courseId',
  authenticate,
  requireManager,
  async (req, res, next) => {
    try {

      const course = await prisma.course.findUnique({
        where: { id: req.params.courseId },
        include: {
          sections: {
            include: {
              lessons: true
            },
            orderBy: { order: 'asc' }
          },
          // 🔴 جلب المحاضرين هنا أيضاً لضمان ظهورهم عند فتح نافذة التعديل
          inspectors: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      sendSuccess(res, course);

    } catch (err) {
      next(err);
    }
  }
);

export default router;