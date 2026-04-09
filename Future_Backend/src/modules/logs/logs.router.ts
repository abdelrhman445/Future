import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../core/guards/auth.guard';
import { requireLogsAccess } from '../../core/guards/auth.guard';
import { sendSuccess } from '../../core/middlewares';
import prisma from '../../config/prisma';

const router = Router();

// ==================== GET ALL LOGS ====================
router.get('/', authenticate, requireLogsAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50; // هنجيب 50 لوج في الصفحة
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // الأحدث أولاً
      }),
      prisma.auditLog.count()
    ]);

    // نجيب بيانات اليوزرز اللي عملوا الأكشن (عشان نعرض أسمائهم بدل الـ ID)
    const userIds = [...new Set(logs.map(log => log.userId).filter(Boolean))] as string[];
    
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true, role: true }
    });

    // دمج اللوجات مع بيانات اليوزرز
    const enrichedLogs = logs.map(log => {
      const user = users.find(u => u.id === log.userId);
      return {
        ...log,
        user: user 
          ? { name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role } 
          : { name: 'System / Guest', email: '-', role: '-' }
      };
    });

    sendSuccess(res, {
      logs: enrichedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
});

export default router;