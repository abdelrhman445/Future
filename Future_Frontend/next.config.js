/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'vz-62b0280e-2ba.b-cdn.net',
      'via.placeholder.com',
    ],
  },
  eslint: {
    // تجاهل تحذيرات ESLint وقت الرفع
    ignoreDuringBuilds: true,
  },
  typescript: {
    // تجاهل أخطاء التايب سكريبت وقت الرفع
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;