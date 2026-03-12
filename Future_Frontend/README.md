# Affiliate Courses Frontend

Next.js 14 frontend for Arabic affiliate courses platform.

## Tech Stack
- **Next.js 14** (App Router)
- **MUI v5** + **Tailwind CSS**
- **Zustand** (state management)
- **React Hook Form** + **Zod** (validation)
- **Axios** (API calls)
- **react-hot-toast** (notifications)

## Pages
| Route | Description |
|-------|-------------|
| `/ar` or `/en` | Landing Page |
| `/ar/courses` | All courses |
| `/ar/courses/[slug]` | Course detail + buy |
| `/ar/login` | Login |
| `/ar/register` | Register (with referral code) |
| `/ar/verify-otp` | OTP verification |
| `/ar/dashboard` | User dashboard |
| `/ar/my-courses/[courseId]` | Video player (DRM) |
| `/ar/affiliate` | Affiliate dashboard |
| `/ar/admin` | Admin dashboard |
| `/ar/payment/success` | Payment success |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Edit .env.local and set your API URL + Stripe key

# 3. Run dev server
npm run dev
```

## Environment Variables (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_BUNNY_LIBRARY_ID=612573
NEXT_PUBLIC_BUNNY_CDN_HOSTNAME=vz-62b0280e-2ba.b-cdn.net
```

## Stripe Checkout Flow
1. User clicks "Buy Now" on course detail page
2. Backend creates Stripe checkout session → returns URL
3. Frontend redirects to Stripe
4. Stripe redirects to `/payment/success?session_id=...`
5. Frontend verifies with backend → shows success

## DRM Video Flow
1. User clicks lesson in watch page
2. Frontend calls `GET /api/media/video/:lessonId/stream`
3. Backend verifies purchase → returns signed Bunny embed URL (1hr expiry)
4. Frontend loads URL in sandboxed iframe
