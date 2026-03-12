import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateAffiliateCode(prefix: string): string {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `AFF-${prefix.toUpperCase()}-${random}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ==================== ADMIN USER ====================
  const adminCode = generateAffiliateCode('ADMIN');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@platform.com' },
    update: {},
    create: {
      email: 'admin@platform.com',
      passwordHash: await bcrypt.hash('Admin@123456', 12),
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      isEmailVerified: true,
      affiliateCode: adminCode,
      affiliateLink: `http://localhost:5173/register?ref=${adminCode}`,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ==================== MANAGER USER ====================
  const managerCode = generateAffiliateCode('MGR');
  const manager = await prisma.user.upsert({
    where: { email: 'manager@platform.com' },
    update: {},
    create: {
      email: 'manager@platform.com',
      passwordHash: await bcrypt.hash('Manager@123456', 12),
      firstName: 'Ahmed',
      lastName: 'Manager',
      role: 'MANAGER',
      isEmailVerified: true,
      affiliateCode: managerCode,
      affiliateLink: `http://localhost:5173/register?ref=${managerCode}`,
    },
  });
  console.log('✅ Manager created:', manager.email);

  // ==================== TEST USER ====================
  const userCode = generateAffiliateCode('USR1');
  const user = await prisma.user.upsert({
    where: { email: 'user@platform.com' },
    update: {},
    create: {
      email: 'user@platform.com',
      passwordHash: await bcrypt.hash('User@123456', 12),
      firstName: 'Mohamed',
      lastName: 'User',
      role: 'USER',
      isEmailVerified: true,
      affiliateCode: userCode,
      affiliateLink: `http://localhost:5173/register?ref=${userCode}`,
    },
  });
  console.log('✅ User created:', user.email);

  // ==================== REFERRED USER ====================
  const referredCode = generateAffiliateCode('USR2');
  const referredUser = await prisma.user.upsert({
    where: { email: 'referred@platform.com' },
    update: {},
    create: {
      email: 'referred@platform.com',
      passwordHash: await bcrypt.hash('User@123456', 12),
      firstName: 'Sara',
      lastName: 'Referred',
      role: 'USER',
      isEmailVerified: true,
      affiliateCode: referredCode,
      affiliateLink: `http://localhost:5173/register?ref=${referredCode}`,
    },
  });

  // Create affiliate tracking (user referred referredUser)
  await prisma.affiliateTracking.upsert({
    where: {
  referrerId: user.id,
},
    update: {},
    create: {
      referrerId: user.id,
      referredUserId: referredUser.id,
    },
  });
  console.log('✅ Referred user created with tracking');

  // ==================== SAMPLE COURSES ====================
  const course1 = await prisma.course.upsert({
    where: { slug: 'complete-web-development-bootcamp' },
    update: {},
    create: {
      title: 'كورس تطوير الويب الشامل',
      slug: 'complete-web-development-bootcamp',
      description: 'كورس شامل لتعلم تطوير الويب من الصفر حتى الاحتراف. ستتعلم HTML, CSS, JavaScript, React, Node.js, وقواعد البيانات.',
      shortDescription: 'تعلم تطوير الويب الكامل من الصفر',
      packageType: 'PREMIUM',
      originalPrice: 299,
      salePrice: 199,
      commissionRate: 25,
      status: 'PUBLISHED',
      duration: 1800,
      totalLessons: 120,
      language: 'ar',
      level: 'beginner',
      tags: JSON.stringify(['web', 'javascript', 'react', 'nodejs']),
    },
  });

  // Add sections and lessons to course 1
  const section1 = await prisma.courseSection.create({
    data: {
      courseId: course1.id,
      title: 'المقدمة وأساسيات HTML',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sectionId: section1.id,
        title: 'مرحباً بك في الكورس',
        description: 'نظرة عامة على ما ستتعلمه',
        videoDuration: 300,
        order: 1,
        isFreePreview: true,
      },
      {
        sectionId: section1.id,
        title: 'ما هو HTML؟',
        description: 'مقدمة في HTML',
        videoUrl: 'encrypted://video-id-001',
        videoDuration: 900,
        order: 2,
        isFreePreview: false,
      },
      {
        sectionId: section1.id,
        title: 'تثبيت البيئة البرمجية',
        videoUrl: 'encrypted://video-id-002',
        videoDuration: 600,
        order: 3,
        isFreePreview: false,
      },
    ],
  });

  const section2 = await prisma.courseSection.create({
    data: {
      courseId: course1.id,
      title: 'أساسيات CSS والتصميم',
      order: 2,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        sectionId: section2.id,
        title: 'مقدمة في CSS',
        videoUrl: 'encrypted://video-id-003',
        videoDuration: 800,
        order: 1,
        isFreePreview: false,
      },
    ],
  });

  const course2 = await prisma.course.upsert({
    where: { slug: 'digital-marketing-masterclass' },
    update: {},
    create: {
      title: 'ماستر كلاس التسويق الرقمي',
      slug: 'digital-marketing-masterclass',
      description: 'تعلم التسويق الرقمي الحديث: SEO, Social Media Marketing, Email Marketing, PPC, وتحليل البيانات.',
      shortDescription: 'احترف التسويق الرقمي بشكل كامل',
      packageType: 'STANDARD',
      originalPrice: 199,
      salePrice: 149,
      commissionRate: 20,
      status: 'PUBLISHED',
      duration: 900,
      totalLessons: 60,
      language: 'ar',
      level: 'intermediate',
      tags: JSON.stringify(['marketing', 'seo', 'social-media']),
    },
  });

  const course3 = await prisma.course.upsert({
    where: { slug: 'python-data-science' },
    update: {},
    create: {
      title: 'Python وعلم البيانات',
      slug: 'python-data-science',
      description: 'تعلم Python وعلم البيانات والذكاء الاصطناعي من الصفر.',
      shortDescription: 'Python وعلم البيانات للمبتدئين',
      packageType: 'ENTERPRISE',
      originalPrice: 499,
      salePrice: 349,
      commissionRate: 30,
      status: 'PUBLISHED',
      duration: 2400,
      totalLessons: 150,
      language: 'ar',
      level: 'beginner',
      tags: JSON.stringify(['python', 'data-science', 'ai', 'ml']),
    },
  });

  // ==================== SAMPLE PURCHASE ====================
  // Give test user access to course 1
  await prisma.userCourse.upsert({
    where: { userId_courseId: { userId: user.id, courseId: course1.id } },
    update: {},
    create: {
      userId: user.id,
      courseId: course1.id,
      status: 'COMPLETED',
      amountPaid: 199,
      paymentRef: `PAY-SEED-${Date.now()}`,
      progressPercent: 35,
    },
  });

  console.log('✅ Sample courses created:', [course1.slug, course2.slug, course3.slug].join(', '));
  console.log('✅ Sample purchase created for user');

  console.log('\n🎉 Seeding complete!\n');
  console.log('📋 Test Credentials:');
  console.log('  Admin:   admin@platform.com    / Admin@123456');
  console.log('  Manager: manager@platform.com  / Manager@123456');
  console.log('  User:    user@platform.com     / User@123456');
  console.log('  User2:   referred@platform.com / User@123456');
  console.log('\n🔗 Affiliate:');
  console.log(`  User affiliate code: ${userCode}`);
  console.log(`  User affiliate link: http://localhost:5173/register?ref=${userCode}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
