import nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: config.email.user ? {
    user: config.email.user,
    pass: config.email.pass,
  } : undefined,
});

export async function sendOtpEmail(to: string, otp: string, firstName: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">مرحباً ${firstName}!</h2>
      <p>كود التحقق الخاص بك هو:</p>
      <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #007bff; font-size: 48px; letter-spacing: 10px; margin: 0;">${otp}</h1>
      </div>
      <p style="color: #666;">هذا الكود صالح لمدة ${config.otp.expiresInMinutes} دقائق فقط.</p>
      <p style="color: #999; font-size: 12px;">إذا لم تطلب هذا الكود، يرجى تجاهل هذا البريد الإلكتروني.</p>
    </div>
  `;

  try {
    if (config.server.isDev) {
      logger.info(`[DEV] OTP Email to ${to}: ${otp}`);
      // return; // 🛑 تم تعطيل هذا السطر لكي يتم إرسال الإيميل الفعلي حتى في وضع التطوير
    }
    
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject: 'كود التحقق - منصة الكورسات',
      html,
    });
  } catch (err) {
    logger.error('Failed to send OTP email', { error: err, to });
    throw new Error('Failed to send verification email');
  }
}

export async function sendPresentationInviteEmail(
  to: string,
  recipientName: string,
  senderName: string,
  title: string,
  message?: string,
  scheduledAt?: Date
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">مرحباً ${recipientName}!</h2>
      <p>لديك دعوة عرض تقديمي من <strong>${senderName}</strong></p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
        <h3>${title}</h3>
        ${message ? `<p>${message}</p>` : ''}
        ${scheduledAt ? `<p><strong>الموعد:</strong> ${scheduledAt.toLocaleString('ar-EG')}</p>` : ''}
      </div>
      <p>يرجى تسجيل الدخول للرد على الدعوة.</p>
    </div>
  `;

  try {
    if (config.server.isDev) {
      logger.info(`[DEV] Presentation invite email to ${to}`);
      // return; // 🛑 تم تعطيل هذا السطر لكي يتم إرسال الإيميل الفعلي حتى في وضع التطوير
    }
    
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject: `دعوة عرض تقديمي: ${title}`,
      html,
    });
  } catch (err) {
    logger.error('Failed to send presentation invite email', { error: err });
  }
}