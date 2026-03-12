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
// 2. مسار تفعيل الكورس
// POST /api/manager/grant-course
// ==========================================
router.post('/grant-course', async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ message: 'بيانات المستخدم أو الكورس مفقودة' });
    }

    // 🔴 تم التعديل هنا ليتوافق مع الـ Schema الخاصة بك 100%
    await prisma.userCourse.create({
      data: {
        userId: userId,
        courseId: courseId,
        status: 'COMPLETED',         // حالة الشراء: مكتمل
        amountPaid: 0,               // 🔴 إجباري في السكيما: السعر 0 لأنه تفعيل مجاني
        paymentMethod: 'MANUAL_GRANT'// طريقة الدفع للتوضيح في الداتابيز
      }
    });

    res.status(200).json({ message: 'تم تفعيل الكورس للمستخدم بنجاح 🎉' });
  } catch (error: any) {
    console.error('[Manager Grant Course Error]:', error);
    
    // 🔴 معالجة ذكية لقاعدة @@unique([userId, courseId])
    // P2002 = خطأ تكرار البيانات في Prisma
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'هذا الكورس مفعل بالفعل لهذا المستخدم 🔒' });
    }

    res.status(500).json({ message: 'حدث خطأ أثناء تفعيل الكورس' });
  }
});

export default router;