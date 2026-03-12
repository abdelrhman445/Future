import crypto from 'crypto';
import { config } from '../../config';

interface SignedUrlOptions {
  resourceId: string;
  resourceType: 'video' | 'image' | 'attachment';
  userId: string;
  expiresInSeconds?: number;
}

interface SignedUrlResult {
  url: string;
  expiresAt: number;
  token: string;
}

export function generateSignedUrl(options: SignedUrlOptions): SignedUrlResult {
  const { resourceId, resourceType, userId, expiresInSeconds } = options;
  const exp = expiresInSeconds || config.signedUrl.expiresInSeconds;
  const expiresAt = Math.floor(Date.now() / 1000) + exp;

  const payload = `${resourceId}:${resourceType}:${userId}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', config.signedUrl.secret)
    .update(payload)
    .digest('hex');

  const token = Buffer.from(
    JSON.stringify({ resourceId, resourceType, userId, expiresAt, signature })
  ).toString('base64url');

  return {
    url: `/api/media/stream/${token}`,
    expiresAt,
    token,
  };
}

export function verifySignedUrl(token: string): {
  valid: boolean;
  data?: { resourceId: string; resourceType: string; userId: string };
  error?: string;
} {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    const { resourceId, resourceType, userId, expiresAt, signature } = decoded;

    // Check expiry
    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return { valid: false, error: 'URL expired' };
    }

    // Verify signature
    const payload = `${resourceId}:${resourceType}:${userId}:${expiresAt}`;
    const expectedSig = crypto
      .createHmac('sha256', config.signedUrl.secret)
      .update(payload)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, data: { resourceId, resourceType, userId } };
  } catch {
    return { valid: false, error: 'Malformed token' };
  }
}

export function generateAffiliateCode(userId: string): string {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const userPart = userId.slice(0, 4).toUpperCase();
  return `AFF-${userPart}-${random}`;
}

export function generateOtpCode(): string {
  // 6-digit cryptographically secure OTP
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, '0');
}

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
