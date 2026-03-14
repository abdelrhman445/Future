import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin, requireManager } from '../../core/guards/auth.guard';
import { AppError, NotFoundError, sendSuccess } from '../../core/middlewares';
import prisma from '../../config/prisma';
import { config } from '../../config';

const router = Router();

function handleValidation(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(422, errors.array()[0].msg));
  next();
}

// ==================== USER DASHBOARD ====================
router.get('/dashboard', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const [user, purchases, referralsCount, recentEarnings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          affiliateCode: true, affiliateLink: true,
          totalEarnings: true, pendingEarnings: true, avatarUrl: true,
        },
      }),
      prisma.userCourse.findMany({
        where: { userId, status: 'COMPLETED' },
        include: {
          course: {
            select: { id: true, title: true, thumbnailUrl: true, totalLessons: true },
          },
        },
        orderBy: { purchasedAt: 'desc' },
        take: 10,
      }),
      prisma.affiliateTracking.count({ where: { referrerId: userId } }),
      prisma.affiliateTracking.findMany({
        where: { referrerId: userId, status: 'APPROVED' },
        include: {
          referredUser: { select: { firstName: true, lastName: true, createdAt: true } },
          course: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    if (!user) throw new NotFoundError('User not found');

    sendSuccess(res, { user, purchases, referralsCount, recentEarnings });
  } catch (err) { next(err); }
});

// ==================== MY COURSES ====================
router.get('/my-courses', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await prisma.userCourse.findMany({
      where: { userId: req.user!.userId, status: 'COMPLETED' },
      include: {
        course: {
          include: {
            sections: { select: { id: true, title: true, _count: { select: { lessons: true } } } },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });
    sendSuccess(res, courses);
  } catch (err) { next(err); }
});

// ==================== UPDATE PROFILE ====================
router.patch('/profile', authenticate, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone('any'),
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { firstName, lastName, phone },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });
    sendSuccess(res, user, 'Profile updated');
  } catch (err) { next(err); }
});

// ==================== CHANGE PASSWORD ====================
router.patch('/password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, number and special char'),
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new NotFoundError();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError(400, 'Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    // Revoke all refresh tokens (force re-login on other devices)
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    sendSuccess(res, null, 'Password changed. Please login again.');
  } catch (err) { next(err); }
});

// ==================== ADMIN - List All Users ====================
router.get('/', authenticate, requireManager, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where = search ? {
      OR: [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, isEmailVerified: true,
          totalEarnings: true, createdAt: true, lastLoginAt: true,
          _count: { select: { purchases: true, referrals: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, { users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// ==========================================
// ADMIN - جلب قائمة المفتشين فقط (لتعيينهم في الكورسات)
// GET /api/users/inspectors
// ==========================================
router.get('/inspectors', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspectors = await prisma.user.findMany({
      where: { role: 'INSPECTOR' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    });
    sendSuccess(res, inspectors);
  } catch (err) { next(err); }
});

// ==================== ADMIN - Toggle User Status ====================
router.patch('/:userId/status', authenticate, requireManager, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // لو المانجر بيحاول يعطل حساب أدمن، نمنعه
    if (req.user!.role === 'MANAGER') {
      const targetUser = await prisma.user.findUnique({ where: { id: req.params.userId } });
      if (targetUser?.role === 'ADMIN') {
        throw new AppError(403, 'ليس لديك صلاحية لتعطيل حساب مدير النظام 🔒');
      }
    }

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { isActive: req.body.isActive },
      select: { id: true, email: true, isActive: true },
    });
    sendSuccess(res, user, `User ${user.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) { next(err); }
});

// ==================== ADMIN/MANAGER - Change User Role ====================
router.patch('/:userId/role', authenticate, requireManager, [
  body('role').isIn(['ADMIN', 'MANAGER', 'INSPECTOR','USER']),
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { role: newRole } = req.body;
    
    // 1. نجيب اليوزر المستهدف من الداتابيز عشان نعرف رتبته الحالية
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new NotFoundError('User not found');

    // 2. تطبيق القيود الصارمة لو اللي بيعمل الطلب MANAGER
    if (req.user!.role === 'MANAGER') {
      
      // أ) ممنوع يعدل رتبة حد هو أصلاً ADMIN
      if (targetUser.role === 'ADMIN') {
        throw new AppError(403, 'ليس لديك صلاحية لتعديل رتبة مدير النظام (ADMIN) 🔒');
      }

      // ب) ممنوع يدي حد رتبة ADMIN أو MANAGER
      if (newRole === 'ADMIN' || newRole === 'MANAGER') {
        throw new AppError(403, 'صلاحياتك تسمح بالترقية إلى (Inspector أو User) فقط 🔒');
      }
    }

    // 3. لو عدى من القيود، يتنفذ التعديل
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, email: true, role: true },
    });
    
    sendSuccess(res, user, 'Role updated successfully');
  } catch (err) { next(err); }
});

// ==================== ADMIN - Refresh Affiliate Links ====================
router.post('/admin/refresh-affiliate-links', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { affiliateCode: { not: undefined } }, // التصحيح هنا: undefined بدل null
      select: { id: true, affiliateCode: true },
    });

    let updated = 0;
    for (const user of users) {
      if (user.affiliateCode) {
        const newLink = `${config.frontend.url}/register?ref=${user.affiliateCode}`;
        await prisma.user.update({
          where: { id: user.id },
          data: { affiliateLink: newLink },
        });
        updated++;
      }
    }

    sendSuccess(res, { updated }, `Updated ${updated} affiliate links`);
  } catch (err) { next(err); }
});

export default router;