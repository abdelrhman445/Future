import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken, setTokenCookies, clearTokenCookies } from '../../core/utils/jwt';
import { generateOtpCode, generateAffiliateCode } from '../../core/utils/signedUrl';
import { sendOtpEmail } from '../../core/utils/email';
import { AppError, UnauthorizedError, ConflictError, sendSuccess } from '../../core/middlewares';
import { authenticate } from '../../core/guards/auth.guard';
import { authRateLimiter, otpRateLimiter } from '../../core/security';
import { config } from '../../config';
import { logger } from '../../core/utils/logger';

const router = Router();

// ==================== VALIDATION RULES ====================
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, number and special char'),
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name required (2-50 chars)'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name required (2-50 chars)'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone required'),
  body('referralCode').optional().trim(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const otpValidation = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
];

function handleValidation(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(422, errors.array()[0].msg));
  }
  next();
}

// ==================== REGISTER ====================
router.post('/register', authRateLimiter, registerValidation, handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone, referralCode } = req.body;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email already registered');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate affiliate code
    const tempId = uuidv4();
    const affiliateCode = generateAffiliateCode(tempId);
    const affiliateLink = `${config.frontend.url}/register?ref=${affiliateCode}`;

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        affiliateCode,
        affiliateLink,
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    // Handle referral
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { affiliateCode: referralCode } });
      if (referrer && referrer.id !== user.id) {
        await prisma.affiliateTracking.create({
          data: {
            referrerId: referrer.id,
            referredUserId: user.id,
            registrationIp: req.ip,
          },
        });
      }
    }

    // Generate OTP
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + config.otp.expiresInMinutes * 60 * 1000);

    await prisma.otp.create({
      data: {
        code: await bcrypt.hash(otpCode, 8),
        type: 'EMAIL_VERIFICATION',
        userId: user.id,
        expiresAt,
        ipAddress: req.ip,
      },
    });

    // Send OTP email
    await sendOtpEmail(email, otpCode, firstName);

    logger.info('User registered', { userId: user.id, email });
    sendSuccess(res, { email: user.email }, 'Registration successful. Please verify your email.', 201);
  } catch (err) {
    next(err);
  }
});

// ==================== VERIFY OTP ====================
router.post('/verify-otp', otpRateLimiter, otpValidation, handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(404, 'User not found');
    if (user.isEmailVerified) throw new AppError(400, 'Email already verified');

    // Find valid OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) throw new AppError(400, 'OTP expired or invalid. Please request a new one.');

    // Check brute force
    if (otpRecord.attempts >= 5) {
      await prisma.otp.update({ where: { id: otpRecord.id }, data: { isUsed: true } });
      throw new AppError(429, 'Too many failed attempts. Please request a new OTP.');
    }

    const isValid = await bcrypt.compare(otp, otpRecord.code);
    if (!isValid) {
      await prisma.otp.update({ where: { id: otpRecord.id }, data: { attempts: { increment: 1 } } });
      throw new AppError(400, `Invalid OTP. ${4 - otpRecord.attempts} attempts remaining.`);
    }

    // Mark OTP as used, verify email
    await prisma.$transaction([
      prisma.otp.update({ where: { id: otpRecord.id }, data: { isUsed: true } }),
      prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true } }),
    ]);

    // Auto-login after verification - generate tokens
    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
    });

    setTokenCookies(res, accessToken, refreshToken);

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        affiliateCode: user.affiliateCode,
        affiliateLink: user.affiliateLink,
        totalEarnings: user.totalEarnings,
        pendingEarnings: user.pendingEarnings,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    }, 'Email verified successfully.');
  } catch (err) {
    next(err);
  }
});

// ==================== RESEND OTP ====================
router.post('/resend-otp', otpRateLimiter, [body('email').isEmail().normalizeEmail()], handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isEmailVerified) {
      // Don't reveal if user exists
      sendSuccess(res, null, 'If your email is registered and unverified, you will receive a code.');
      return;
    }

    // Invalidate old OTPs
    await prisma.otp.updateMany({
      where: { userId: user.id, type: 'EMAIL_VERIFICATION', isUsed: false },
      data: { isUsed: true },
    });

    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + config.otp.expiresInMinutes * 60 * 1000);

    await prisma.otp.create({
      data: {
        code: await bcrypt.hash(otpCode, 8),
        type: 'EMAIL_VERIFICATION',
        userId: user.id,
        expiresAt,
        ipAddress: req.ip,
      },
    });

    await sendOtpEmail(email, otpCode, user.firstName);
    sendSuccess(res, null, 'OTP sent successfully.');
  } catch (err) {
    next(err);
  }
});

// ==================== LOGIN ====================
router.post('/login', authRateLimiter, loginValidation, handleValidation, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Prevent timing attacks - always hash compare
    const dummyHash = '$2a$12$dummyhashfordummycomparison.dummyhash';
    const passwordValid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new AppError(403, 'Please verify your email before logging in');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account has been suspended. Contact support.');
    }

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    logger.info('User logged in', { userId: user.id });
    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        affiliateCode: user.affiliateCode,
        affiliateLink: user.affiliateLink,
        totalEarnings: user.totalEarnings,
        pendingEarnings: user.pendingEarnings,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
});

// ==================== REFRESH TOKEN ====================
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) throw new UnauthorizedError('Refresh token required');

    const payload = verifyRefreshToken(token);

    // Check token in DB
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Rotate refresh token (revoke old, create new)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) throw new UnauthorizedError();

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    await prisma.$transaction([
      prisma.refreshToken.update({ where: { token }, data: { isRevoked: true } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      }),
    ]);

    setTokenCookies(res, newAccessToken, newRefreshToken);
    sendSuccess(res, null, 'Token refreshed');
  } catch (err) {
    next(err);
  }
});

// ==================== LOGOUT ====================
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { isRevoked: true },
      });
    }
    clearTokenCookies(res);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
});

// ==================== ME ====================
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, phone: true, avatarUrl: true,
        affiliateCode: true, affiliateLink: true,
        totalEarnings: true, pendingEarnings: true,
        isEmailVerified: true, createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedError();
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
});

export default router;
