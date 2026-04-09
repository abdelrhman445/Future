import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../middlewares';
import prisma from '../../config/prisma'; // 🔴 تمت إضافة استيراد بريزما هنا للوصول لقاعدة البيانات

export const Role = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
} as const;

type Role = (typeof Role)[keyof typeof Role];

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ==================== AUTHENTICATE (JWT) ====================
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err instanceof UnauthorizedError ? err : new UnauthorizedError('Invalid or expired token'));
  }
}

// ==================== ROLE GUARDS ====================
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.user.role as Role)) {
      return next(new ForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`));
    }

    next();
  };
}

export const requireAdmin = requireRole(Role.ADMIN);
export const requireManager = requireRole(Role.ADMIN, Role.MANAGER);
export const requireUser = requireRole(Role.ADMIN, Role.MANAGER, Role.USER);


// ==================== CUSTOM PERMISSIONS GUARDS ====================
// 🔴 إضافة حماية جديدة للتحقق من صلاحية رؤية اللوجات (canViewLogs)
export const requireLogsAccess = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. نتأكد إن اليوزر موجود في التوكن
    const userId = req.user?.userId; 

    if (!userId) {
      throw new UnauthorizedError('Unauthorized access');
    }

    // 2. نجيب حالة الـ canViewLogs من الداتابيز مباشرة
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { canViewLogs: true }
    });

    // 3. لو مش موجود أو معندوش الصلاحية نرفض الدخول
    if (!currentUser || !currentUser.canViewLogs) {
      throw new ForbiddenError('Access denied. You do not have permission to view system logs.');
    }

    // 4. لو عنده الصلاحية، نعديه للمسار اللي بعده
    next();
  } catch (err) {
    next(err);
  }
};