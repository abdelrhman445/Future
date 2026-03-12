import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireManager } from '../../core/guards/auth.guard';
import { AppError, ForbiddenError, NotFoundError, sendSuccess } from '../../core/middlewares';
import { YouTubeService } from './youtube.service';
import prisma from '../../config/prisma';

const router = Router();

// ==================== SAVE YOUTUBE LINK (Admin/Manager) ====================
// ملاحظة للفرونت إند: الريكويست هنا مبقاش FormData، بقى مجرد JSON عادي
// { "lessonId": "...", "youtubeUrl": "https://youtu.be/..." }
router.post(
  '/upload', // سيبنا نفس الاسم عشان منكسرش الفرونت إند بتاع الأدمن، بس هو مجرد بيحفظ لينك
  authenticate,
  requireManager,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lessonId, youtubeUrl } = req.body;
      
      if (!lessonId || !youtubeUrl) {
        throw new AppError(400, 'lessonId and youtubeUrl are required');
      }

      // تأكد إن الـ lesson موجود
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (!lesson) throw new NotFoundError('Lesson not found');

      // احفظ لينك اليوتيوب في الداتابيز
      await prisma.lesson.update({
        where: { id: lessonId },
        data: {
          videoUrl: youtubeUrl, // هنحفظ اللينك زي ما هو
          thumbnailUrl: null, // ممكن تجيب صورة اليوتيوب لو حابب، أو تسيبها null
        },
      });

      // بنرجع اللينك الآمن عشان لو الأدمن حابب يعرضه عنده
      const embedUrl = YouTubeService.getSecureEmbedUrl(youtubeUrl);

      sendSuccess(res, {
        videoUrl: youtubeUrl,
        embedUrl: embedUrl,
        status: 'finished', // يوتيوب دايماً جاهز
      }, 'YouTube video linked successfully', 201);
    } catch (err) {
      next(err);
    }
  }
);

// ==================== GET SECURE VIDEO URL (Purchased Users) ====================
router.get(
  '/video/:lessonId/stream',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lessonId } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // جيب الـ lesson مع الكورس بتاعه
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          section: {
            include: { course: true },
          },
        },
      });

      if (!lesson) throw new NotFoundError('Lesson not found');
      if (!lesson.videoUrl) throw new AppError(404, 'No video for this lesson');

      const courseId = lesson.section.course.id;

      // فحص الصلاحيات (Admin/Manager أو درس مجاني)
      const isPrivileged = userRole === 'ADMIN' || userRole === 'MANAGER';
      const isFreePreview = lesson.isFreePreview;

      if (!isPrivileged && !isFreePreview) {
        // تحقق إن اليوزر اشترى الكورس
        const purchase = await prisma.userCourse.findUnique({
          where: { userId_courseId: { userId, courseId } },
        });

        if (!purchase || purchase.status !== 'COMPLETED') {
          throw new ForbiddenError('Purchase required to watch this video');
        }
      }

      // تحويل لينك اليوتيوب العادي للينك Embed مخفي التحكمات قدر الإمكان
      const isPlaylist = lesson.videoUrl.includes('list=');
      const secureEmbedUrl = YouTubeService.getSecureEmbedUrl(lesson.videoUrl, isPlaylist);

      sendSuccess(res, {
        streamUrl: secureEmbedUrl, // الفرونت إند هيستخدم ده في الـ iframe
        duration: lesson.videoDuration,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== DELETE VIDEO LINK ====================
router.delete(
  '/video/:lessonId',
  authenticate,
  requireManager,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lesson = await prisma.lesson.findUnique({
        where: { id: req.params.lessonId },
      });

      if (!lesson) throw new NotFoundError('Lesson not found');
      if (!lesson.videoUrl) throw new AppError(404, 'No video to delete');

      // مش هنمسح من يوتيوب، إحنا بس هنشيل اللينك من الداتابيز عندنا
      await prisma.lesson.update({
        where: { id: req.params.lessonId },
        data: { videoUrl: null, thumbnailUrl: null },
      });

      sendSuccess(res, null, 'Video unlinked successfully');
    } catch (err) {
      next(err);
    }
  }
);

export default router;