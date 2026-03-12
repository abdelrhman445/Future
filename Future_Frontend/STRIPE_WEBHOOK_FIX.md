# إصلاح Stripe Webhook

## المشكلة
Stripe بيبعت الـ webhook لـ `localhost:3000` بس الباك على `localhost:3001`

## الحل
شغّل الـ stripe CLI على البورت الصح:

```bash
stripe listen --forward-to localhost:3001/api/payments/webhook/stripe
```

وفي `.env` بتاع الباك:
```
FRONTEND_URL=http://localhost:3000
PORT=3001
```

## رابط الـ success_url
الباك بيستخدم `config.frontend.url` لتوليد رابط Stripe success.
تأكد إن `FRONTEND_URL=http://localhost:3000` في `.env` الباك.

Stripe هيرجع على:
`http://localhost:3000/ar/payment/success?session_id=cs_test_...`
