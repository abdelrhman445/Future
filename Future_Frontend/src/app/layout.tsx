import type { Metadata } from 'next';
import { Cairo, Sora } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/AuthProvider'; // استيراد الـ Provider

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-arabic' });
const sora = Sora({ subsets: ['latin'], variable: '--font-english' });

export const metadata: Metadata = {
  title: 'منصة فيوتشر', // 🔴 تم تعديل الاسم هنا
  description: 'تعلم واكسب مع كل إحالة',
  icons: {
    icon: '/logo.png', // 🔴 تم توجيه الأيقونة للوجو اللي في مجلد public
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning dir="rtl">
      <body className={`${cairo.variable} ${sora.variable}`} suppressHydrationWarning>
        {/* تغليف التطبيق بالـ AuthProvider عشان يحافظ على تسجيل الدخول */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}