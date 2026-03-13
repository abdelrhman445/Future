import Stripe from 'stripe';
import { config } from '../../config';
import { logger } from '../../core/utils/logger';

// Lazy init - only crash if Stripe is actually used without key
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!config.stripe.secretKey || config.stripe.secretKey.startsWith('sk_test_XXXX')) {
      throw new Error('Stripe secret key not configured. Add STRIPE_SECRET_KEY to .env');
    }
    _stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2023-10-16' });
  }
  return _stripe;
}

export interface CreateCheckoutOptions {
  courseId: string;
  courseTitle: string;
  price: number;          // in cents (e.g. 1999 = $19.99)
  currency: string;
  userId: string;
  userEmail: string;
  affiliateTrackingId?: string;
}

// ==================== CREATE CHECKOUT SESSION ====================
export async function createCheckoutSession(opts: CreateCheckoutOptions): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: opts.userEmail,
    line_items: [
      {
        price_data: {
          currency: opts.currency.toLowerCase(),
          unit_amount: Math.round(opts.price * 100), // convert to cents
          product_data: {
            name: opts.courseTitle,
            metadata: { courseId: opts.courseId },
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      courseId: opts.courseId,
      userId: opts.userId,
      affiliateTrackingId: opts.affiliateTrackingId || '',
    },
    success_url: `${config.frontend.url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontend.url}/payment/cancel?courseId=${opts.courseId}`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
  });

  logger.info('Stripe checkout session created', { sessionId: session.id, userId: opts.userId });
  return session.url!;
}

// ==================== VERIFY WEBHOOK SIGNATURE ====================
export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    config.stripe.webhookSecret
  );
}

// ==================== GET SESSION DETAILS ====================
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });
}
