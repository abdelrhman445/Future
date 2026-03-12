# 🚀 Affiliate Courses Platform - Backend API

منصة كورسات آمنة بنظام التسويق بالعمولة - مبنية بـ Node.js + Express + TypeScript + Prisma

## ⚡ التشغيل السريع (Quick Start)

```bash
# 1. تثبيت الحزم
npm install

# 2. توليد Prisma Client
npx prisma generate

# 3. إنشاء قاعدة البيانات وتشغيل الـ Migrations
npx prisma migrate dev --name init

# 4. تعبئة البيانات التجريبية (Seed)
npx ts-node prisma/seed.ts

# 5. تشغيل السيرفر
npm run dev
```

## 🔑 بيانات الاختبار

| الدور | البريد الإلكتروني | كلمة المرور |
|-------|------------------|-------------|
| Admin | admin@platform.com | Admin@123456 |
| Manager | manager@platform.com | Manager@123456 |
| User | user@platform.com | User@123456 |
| Referred User | referred@platform.com | User@123456 |

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | تسجيل مستخدم جديد |
| POST | `/verify-otp` | التحقق من الإيميل بكود OTP |
| POST | `/resend-otp` | إعادة إرسال OTP |
| POST | `/login` | تسجيل الدخول |
| POST | `/refresh` | تجديد Access Token |
| POST | `/logout` | تسجيل الخروج |
| GET | `/me` | بيانات المستخدم الحالي |

### Courses (`/api/courses`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | - | قائمة الكورسات المنشورة |
| GET | `/:slug` | - | تفاصيل كورس |
| GET | `/:courseId/content` | ✅ (مشتري) | محتوى الكورس مع Signed URLs |
| POST | `/` | Manager | إضافة كورس |
| PATCH | `/:courseId` | Manager | تعديل كورس |
| DELETE | `/:courseId` | Admin | حذف (أرشفة) كورس |
| POST | `/:courseId/sections` | Manager | إضافة قسم |
| POST | `/sections/:id/lessons` | Manager | إضافة درس |
| POST | `/:courseId/purchase` | User | شراء كورس |

### Users (`/api/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | ✅ | لوحة تحكم المستخدم |
| GET | `/my-courses` | ✅ | كورساتي |
| PATCH | `/profile` | ✅ | تعديل الملف الشخصي |
| PATCH | `/password` | ✅ | تغيير كلمة المرور |
| GET | `/` | Manager | قائمة جميع المستخدمين |
| PATCH | `/:userId/status` | Admin | تفعيل/تعطيل حساب |
| PATCH | `/:userId/role` | Admin | تغيير الرتبة |

### Affiliate (`/api/affiliate`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | ✅ | لوحة تحكم الإحالات |
| GET | `/my-referrals` | ✅ | قائمة من أحلتهم |
| POST | `/withdraw` | ✅ | طلب سحب أرباح |
| GET | `/withdrawals` | Admin | جميع طلبات السحب |
| PATCH | `/withdrawals/:id` | Admin | معالجة طلب سحب |
| GET | `/stats` | Admin | إحصائيات الإحالات |

### Presentations (`/api/presentations`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/invite` | ✅ (مُحيل فقط) | إرسال دعوة عرض |
| GET | `/sent` | ✅ | دعواتي المرسلة |
| GET | `/received` | ✅ | دعواتي المستقبلة |
| PATCH | `/invite/:id/respond` | ✅ (مستقبل) | الرد على دعوة |
| DELETE | `/invite/:id` | ✅ (مرسل) | إلغاء دعوة |

### Media (`/api/media`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stream/:token` | - | بث الفيديو (Signed URL) |
| POST | `/generate-url` | ✅ | توليد رابط مشفر مؤقت |
| POST | `/progress` | ✅ | تحديث تقدم الكورس |

## 🔒 خصائص الأمان

- **JWT في HttpOnly Cookies** - منع XSS
- **Refresh Token Rotation** - منع Token Hijacking
- **Rate Limiting** - 5 محاولات تسجيل دخول، 3 محاولات OTP
- **Helmet** - Security Headers كاملة
- **CORS** - مقيد بالدومينات المسموحة
- **Input Sanitization** - XSS Protection على كل المدخلات
- **Signed URLs** - روابط فيديو مشفرة ومؤقتة (1 ساعة)
- **bcrypt** (cost 12) - تشفير كلمات المرور
- **Brute Force Protection** - قفل OTP بعد 5 محاولات

## 🏗️ هيكل المشروع

```
src/
├── config/           # إعدادات البيئة + Prisma Client
├── core/
│   ├── security/     # Helmet + CORS + Rate Limiting
│   ├── guards/       # JWT Auth + RBAC Guards
│   ├── middlewares/  # Sanitization + Error Handling
│   └── utils/        # JWT + Signed URLs + Email + Logger
├── modules/
│   ├── auth/         # تسجيل + OTP + Login + Refresh
│   ├── users/        # إدارة المستخدمين + Dashboard
│   ├── affiliate/    # الإحالات + الأرباح + السحب
│   ├── courses/      # CRUD + شراء + محتوى محمي
│   ├── presentations/ # دعوات العروض التقديمية
│   └── media/        # Signed URLs + Video Streaming
└── server.ts         # Entry Point
```

## 🌱 تغيير بيانات الإنتاج

1. غير **جميع** القيم في `.env`
2. استخدم PostgreSQL بدلاً من SQLite
3. اضبط SMTP حقيقي لإرسال الإيميلات
4. دمج بوابة دفع حقيقية في `courses.router.ts`
5. دمج DRM provider في `media.router.ts`
