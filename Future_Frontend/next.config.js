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
  
  // ==========================================
  // فخاخ الهاكرز والبوتات 🪤😂 (التكدير الرسمي)
  // أي حد هيحاول يفتح مسارات حساسة هيتحدف على فيديو
  // ==========================================
  async redirects() {
    return [
      {
        source: '/wp-admin',
        destination: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 
        permanent: false,
      },
      {
        source: '/wp-login.php',
        destination: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        permanent: false,
      },
      {
        source: '/.env',
        destination: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        permanent: false,
      },
      {
        source: '/backup.zip',
        destination: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        permanent: false,
      },
      {
        source: '/api/database-dump.sql',
        destination: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        permanent: false,
      },
      {
        source: '/admin-panel-mesh-hena-ya-zaky',
        destination: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        permanent: false,
      }
    ];
  },
};

module.exports = nextConfig;