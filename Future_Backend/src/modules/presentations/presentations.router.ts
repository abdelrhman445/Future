import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../../core/guards/auth.guard';
import { AppError, ForbiddenError, NotFoundError, sendSuccess } from '../../core/middlewares';
import { sendPresentationInviteEmail } from '../../core/utils/email';
import prisma from '../../config/prisma';

const router = Router();

function handleValidation(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(422, errors.array()[0].msg));
  next();
}

// ==================== GET MY REFERRALS ====================
// الفرونت هيحتاج دي عشان يعرض للـ User الناس اللي سجلت تحته ليختار منهم
router.get('/my-referrals', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trackings = await prisma.affiliateTracking.findMany({
      where: { referrerId: req.user!.userId },
      include: {
        referredUser: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
    
    // استخراج بيانات اليوزرات من الـ tracking
    const referrals = trackings.map(t => t.referredUser);
    sendSuccess(res, referrals);
  } catch (err) { next(err); }
});

// ==================== GET ALL INSPECTORS ====================
// الفرونت هيحتاج دي عشان يعرض قائمة الـ Inspectors المتاحين
router.get('/inspectors', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const inspectors = await prisma.user.findMany({
      where: { role: 'INSPECTOR', isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true }
    });
    sendSuccess(res, inspectors);
  } catch (err) { next(err); }
});

// ==================== SEND PRESENTATION INVITE ====================
router.post('/invite', authenticate, [
  body('inspectorId').isUUID(),
  body('attendeeIds').isArray({ min: 1 }).withMessage('At least one attendee is required'),
  body('attendeeIds.*').isUUID(),
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('message').optional().trim().isLength({ max: 1000 }),
  body('scheduledAt').isISO8601().toDate(), // إجباري عشان الميعاد
  body('meetingUrl').optional().isURL(),
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user!.userId;
    const { inspectorId, attendeeIds, title, message, scheduledAt, meetingUrl } = req.body;

    // 1. التأكد إن الـ Inspector موجود
    const inspector = await prisma.user.findUnique({ 
        where: { id: inspectorId, role: 'INSPECTOR' } 
    });
    if (!inspector) throw new NotFoundError('Inspector not found');

    // 2. التأكد إن كل الـ attendees اللي اختارهم مسجلين تحت الـ sender
    const validTrackings = await prisma.affiliateTracking.findMany({
      where: { 
        referrerId: senderId, 
        referredUserId: { in: attendeeIds } 
      }
    });

    if (validTrackings.length !== attendeeIds.length) {
      throw new ForbiddenError('You can only invite users who registered using your referral link');
    }

    // 3. منع إرسال دعوة لنفس الميعاد لو موجودة قبل كده
    const existingInvite = await prisma.presentationInvite.findFirst({
      where: { 
        senderId, 
        inspectorId, 
        status: 'PENDING',
        scheduledAt: scheduledAt 
      },
    });
    if (existingInvite) {
      throw new AppError(409, 'You already have a pending invite to this inspector at this time');
    }

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) throw new NotFoundError('Sender not found');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 4. إنشاء الـ Presentation Invite
    const invite = await prisma.presentationInvite.create({
      data: {
        senderId,
        inspectorId,
        attendeeIds,
        title,
        message,
        scheduledAt,
        meetingUrl,
        expiresAt,
      },
    });

    // 5. إرسال إيميل للـ Inspector
    await sendPresentationInviteEmail(
      inspector.email,
      `${inspector.firstName} ${inspector.lastName}`, // To
      `${sender.firstName} ${sender.lastName}`, // From
      title,
      message || 'You have been requested to host a presentation for a team.',
      scheduledAt,
    );

    sendSuccess(res, { inviteId: invite.id }, 'Presentation invite sent successfully to the Inspector', 201);
  } catch (err) { next(err); }
});

// ==================== MY SENT INVITES (User Dashboard) ====================
router.get('/sent', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invites = await prisma.presentationInvite.findMany({
      where: { senderId: req.user!.userId },
      include: {
        inspector: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // هنجيب بيانات الـ attendees لكل invite عشان نعرض أسمائهم للفرونت
    const enhancedInvites = await Promise.all(invites.map(async (invite) => {
        const attendees = await prisma.user.findMany({
            where: { id: { in: invite.attendeeIds } },
            select: { id: true, firstName: true, lastName: true, email: true }
        });
        return { ...invite, attendees };
    }));

    sendSuccess(res, enhancedInvites);
  } catch (err) { next(err); }
});

// ==================== MY RECEIVED INVITES (Inspector Dashboard) ====================
router.get('/received', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // التأكد إن اليوزر هو Inspector
    if (req.user!.role !== 'INSPECTOR' && req.user!.role !== 'ADMIN') {
        throw new ForbiddenError('Access restricted to Inspectors only');
    }

    const invites = await prisma.presentationInvite.findMany({
      where: { inspectorId: req.user!.userId },
      include: {
        sender: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { scheduledAt: 'asc' }, // الترتيب حسب الميعاد الأقرب
    });

    // هنجيب بيانات الـ attendees عشان الـ Inspector يعرف مين هيحضر
    const enhancedInvites = await Promise.all(invites.map(async (invite) => {
        const attendees = await prisma.user.findMany({
            where: { id: { in: invite.attendeeIds } },
            select: { id: true, firstName: true, lastName: true, email: true }
        });
        return { ...invite, attendees };
    }));

    sendSuccess(res, enhancedInvites);
  } catch (err) { next(err); }
});

// ==================== RESPOND TO INVITE (Inspector Only) ====================
router.patch('/invite/:inviteId/respond', authenticate, [
  body('status').isIn(['ACCEPTED', 'DECLINED']),
  body('responseMessage').optional().trim().isLength({ max: 500 }),
], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inviteId } = req.params;
    const userId = req.user!.userId;

    const invite = await prisma.presentationInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new NotFoundError('Invite not found');
    
    // التأكد إن اللي بيرد هو الـ Inspector المبعوتله الدعوة
    if (invite.inspectorId !== userId) throw new ForbiddenError('You are not authorized to respond to this invite');
    if (invite.status !== 'PENDING') throw new AppError(400, 'Invite already responded to');
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new AppError(400, 'Invite has expired');
    }

    const updated = await prisma.presentationInvite.update({
      where: { id: inviteId },
      data: {
        status: req.body.status,
        responseMessage: req.body.responseMessage,
        respondedAt: new Date(),
      },
    });

    // هنا ممكن تضيف كود يبعت إيميل للـ Sender يقوله إن الـ Inspector وافق أو رفض

    sendSuccess(res, updated, `Invite ${req.body.status.toLowerCase()}`);
  } catch (err) { next(err); }
});

// ==================== CANCEL INVITE (Sender Only) ====================
router.delete('/invite/:inviteId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invite = await prisma.presentationInvite.findUnique({ where: { id: req.params.inviteId } });
    if (!invite) throw new NotFoundError('Invite not found');
    
    if (invite.senderId !== req.user!.userId) throw new ForbiddenError();
    if (invite.status !== 'PENDING') throw new AppError(400, 'Cannot cancel a responded invite');

    await prisma.presentationInvite.delete({ where: { id: req.params.inviteId } });
    sendSuccess(res, null, 'Invite cancelled successfully');
  } catch (err) { next(err); }
});

export default router;