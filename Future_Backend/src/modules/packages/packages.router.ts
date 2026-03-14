import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireAdmin } from '../../core/guards/auth.guard'; // 🔴 تم التعديل لـ requireAdmin
import { AppError, sendSuccess } from '../../core/middlewares';
import prisma from '../../config/prisma';

const router = Router();

function handleValidation(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(422, errors.array()[0].msg));
  next();
}

// ==================== GET ALL PACKAGES ====================
// مسار عام لجلب كل الباقات
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { createdAt: 'desc' }
    });
    sendSuccess(res, packages);
  } catch (err) { next(err); }
});

// ==================== ADMIN - CREATE PACKAGE ====================
// 🔴 مسار محمي للأدمن فقط لإنشاء باقة جديدة
router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty().withMessage('اسم الباقة مطلوب'),
  body('price').isFloat({ min: 0 }).withMessage('سعر الباقة مطلوب'),
  body('coursesCount').optional().isInt({ min: 0 }),
  body('thumbnailUrl').optional().isString()
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, price, coursesCount, thumbnailUrl } = req.body;
    
    const newPackage = await prisma.package.create({
      data: {
        name,
        price: parseFloat(price),
        coursesCount: coursesCount ? parseInt(coursesCount) : 0,
        thumbnailUrl: thumbnailUrl || null
      }
    });
    
    sendSuccess(res, newPackage, 'تم إنشاء الباقة بنجاح 🎉', 201);
  } catch (err) { next(err); }
});

// ==================== ADMIN - UPDATE PACKAGE ====================
// 🔴 مسار محمي للأدمن فقط لتعديل باقة موجودة
router.patch('/:id', authenticate, requireAdmin, [
  body('name').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('coursesCount').optional().isInt({ min: 0 }),
  body('thumbnailUrl').optional().isString()
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, price, coursesCount, thumbnailUrl } = req.body;
    
    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(coursesCount !== undefined && { coursesCount: parseInt(coursesCount) }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl })
      }
    });
    
    sendSuccess(res, updatedPackage, 'تم تعديل الباقة بنجاح');
  } catch (err) { next(err); }
});

export default router;