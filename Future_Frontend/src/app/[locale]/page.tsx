'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Box, Button, Container, Grid, Card, CardContent, CardMedia, Chip, Typography, CircularProgress } from '@mui/material';
import { PlayCircle, School, TrendingUp, Star, Login, PersonAdd, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// ================= THEME PALETTE =================
const palette = {
  bg: '#0a0a0f',
  cardBg: '#084570',
  border: '#259acb',
  primary: '#30c0f2',
  primaryHover: '#83d9f7',
  textMain: '#a8eff9',
  textSec: '#a0ddf1',
  danger: '#e62f76',
};

export default function HomePage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const ar = locale === 'ar';
  
  const { isAuthenticated } = useAuthStore();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [statsData, setStatsData] = useState({ totalCourses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التوجيه التلقائي لو مسجل دخول
    if (isAuthenticated) {
      router.push(`/${locale}/dashboard`);
      return;
    }

    const fetchLandingData = async () => {
      try {
        // جلب أحدث/أشهر 3 كورسات
        const coursesRes = await coursesApi.list({ limit: 3 });
        const fetchedCourses = coursesRes.data?.data?.courses || coursesRes.data?.courses || [];
        setCourses(fetchedCourses);

        setStatsData({
          totalCourses: coursesRes.data?.data?.meta?.total || fetchedCourses.length || 50
        });
      } catch (error) {
        console.error('Failed to load landing data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, [isAuthenticated, router, locale]);

  // إذا كان مسجل دخول، لا نعرض الصفحة أثناء التوجيه
  if (isAuthenticated) return <Box sx={{ minHeight: '100vh', bgcolor: palette.bg }} />;

  // 🔴 تم إزالة كارت الطلاب وبقوا 3 فقط
  const stats = [
    { icon: <School sx={{ fontSize: 38, color: palette.primary }} />, value: `+${statsData.totalCourses}`, label: ar ? 'كورس متاح' : 'Available Courses' },
    { icon: <TrendingUp sx={{ fontSize: 38, color: palette.textMain }} />, value: '15%', label: ar ? 'عمولة إحالة' : 'Affiliate Commission' },
    { icon: <Star sx={{ fontSize: 38, color: palette.danger }} />, value: '24/7', label: ar ? 'دعم فني' : 'Technical Support' },
  ];

  const packages = [
    { id: 'silver', title: 'Silver', coursesCount: 15, price: 49, color: '#C0C0C0' },
    { id: 'gold', title: 'Gold', coursesCount: 28, price: 89, color: '#FFD700' },
    { id: 'platinum', title: 'Platinum', coursesCount: 35, price: 129, color: '#E5E4E2' },
    { id: 'diamond', title: 'Diamond', coursesCount: 60, price: 199, color: palette.textMain },
    { id: 'vip', title: 'VIP', coursesCount: ar ? 'جميع الكورسات' : 'All Courses', price: 299, color: palette.danger },
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, overflowX: 'hidden' }}>
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <Box sx={{ position: 'relative', pt: { xs: 12, md: 20 }, pb: { xs: 12, md: 16 } }}>
        {/* Glow Effects */}
        <Box sx={{ position: 'absolute', top: '-10%', left: '10%', width: '50vw', height: '50vw', background: `radial-gradient(circle, ${palette.cardBg} 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0, opacity: 0.6 }} />
        <Box sx={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', background: `radial-gradient(circle, rgba(48,192,242,0.15) 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0 }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Chip 
              label={ar ? '🚀 مرحباً بك في فيوتشر' : '🚀 Welcome to Future'} 
              sx={{ mb: 3, background: 'rgba(48,192,242,0.1)', color: palette.primary, border: `1px solid ${palette.border}`, fontWeight: 800, px: 1, py: 2.5, fontSize: '1rem' }} 
            />
            <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '5rem' }, fontWeight: 900, lineHeight: 1.1, mb: 3, color: '#fff' }}>
              {ar ? 'تعلّم واصنع' : 'Learn & Create'} <br />
              <Box component="span" sx={{ background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {ar ? 'مستقبلك ✦' : 'Your Future ✦'}
              </Box>
            </Typography>
            <Typography sx={{ fontSize: { xs: '1.1rem', md: '1.3rem' }, color: palette.textSec, mb: 6, maxWidth: 700, mx: 'auto', lineHeight: 1.8 }}>
              {ar
                ? 'منصة فيوتشر هي دليلك الأقوى للتعلم الرقمي. انضم الآن، ابدأ رحلتك التعليمية، واكسب عمولة 15% على كل شخص تدعوه للنجاح معك!'
                : 'Future platform is your ultimate guide to digital learning. Join now, start learning, and earn 15% commission for everyone you invite!'}
            </Typography>

            {/* 🔴 تم التعديل هنا: إضافة display flex و gap لإعطاء براح للأيقونات */}
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                component={Link} href={`/${locale}/login`} 
                variant="contained" 
                size="large"
                sx={{ 
                  display: 'flex', alignItems: 'center', gap: 1.5, // 🔴 البراح هنا
                  px: 5, py: 1.8, fontSize: '1.1rem', fontWeight: 800, color: '#000',
                  background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryHover})`, 
                  boxShadow: `0 10px 30px rgba(48,192,242,0.4)`, 
                  borderRadius: 3,
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 15px 40px rgba(48,192,242,0.6)` },
                  transition: 'all 0.3s'
                }}>
                <Login />
                {ar ? 'تسجيل الدخول' : 'Login Now'}
              </Button>
              <Button 
                component={Link} href={`/${locale}/register`} 
                variant="outlined" 
                size="large"
                sx={{ 
                  display: 'flex', alignItems: 'center', gap: 1.5, // 🔴 البراح هنا
                  px: 5, py: 1.8, fontSize: '1.1rem', fontWeight: 800,
                  borderColor: palette.border, color: palette.textMain, borderWidth: 2,
                  borderRadius: 3,
                  '&:hover': { borderColor: palette.primary, color: palette.primary, background: 'rgba(48,192,242,0.05)', transform: 'translateY(-3px)' },
                  transition: 'all 0.3s'
                }}>
                <PersonAdd />
                {ar ? 'إنشاء حساب جديد' : 'Create Account'}
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* ================= STATS SECTION ================= */}
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2, mt: -8 }}>
        <Grid container spacing={4} justifyContent="center">
          {stats.map((stat, i) => (
            <Grid item xs={12} sm={4} key={i}> {/* 🔴 تعديل المقاس ليكونوا 3 فقط ماليين الشاشة */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.3 }}>
                <Card sx={{ 
                  textAlign: 'center', p: 4, background: palette.cardBg, border: `1px solid ${palette.border}`, 
                  borderRadius: 4, transition: 'all 0.3s', boxShadow: `0 10px 30px rgba(0,0,0,0.5)`,
                  '&:hover': { borderColor: palette.primary, transform: 'translateY(-5px)', boxShadow: `0 15px 35px rgba(48,192,242,0.2)` } 
                }}>
                  <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', background: 'rgba(0,0,0,0.2)', mb: 2 }}>
                    {stat.icon}
                  </Box>
                  <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', mb: 0.5 }}>{stat.value}</Typography>
                  <Typography sx={{ color: palette.textSec, fontSize: '1.1rem', fontWeight: 600 }}>{stat.label}</Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ================= FEATURED COURSES (Top 3) ================= */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 900, color: palette.textMain, mb: 2 }}>
            {ar ? '🔥 أشهر الكورسات' : '🔥 Top Featured Courses'}
          </Typography>
          <Typography sx={{ color: palette.textSec, fontSize: '1.1rem' }}>
            {ar ? 'ابدأ بتعلم المهارات الأكثر طلباً في سوق العمل' : 'Start learning the most in-demand skills'}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: palette.primary }} /></Box>
        ) : (
          <Grid container spacing={4}>
            {courses.length === 0 ? (
              <Grid item xs={12}><Typography textAlign="center" color={palette.textSec} fontSize="1.2rem">{ar ? 'قريباً...' : 'Coming Soon...'}</Typography></Grid>
            ) : (
              courses.map((course, i) => (
                <Grid item xs={12} sm={6} md={4} key={course.id}>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <Card sx={{ 
                      textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column', 
                      background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 4, overflow: 'hidden',
                      transition: 'all 0.3s', '&:hover': { borderColor: palette.primary, transform: 'translateY(-8px)', boxShadow: `0 20px 40px rgba(48,192,242,0.2)` } 
                    }}>
                      <CardMedia
                        component="div"
                        sx={{ height: 240, background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : `linear-gradient(135deg, #052c4a, ${palette.cardBg})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {!course.thumbnailUrl && <PlayCircle sx={{ fontSize: 60, color: palette.primary, opacity: 0.5 }} />}
                      </CardMedia>
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Chip label={course.packageType} size="small" sx={{ mb: 2, background: 'rgba(48,192,242,0.15)', color: palette.primary, fontWeight: 800 }} />
                        <Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: '1.25rem', color: '#fff', lineHeight: 1.4 }}>{course.title}</Typography>
                        <Typography sx={{ color: palette.textSec, fontSize: '0.95rem', mb: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {course.shortDescription || course.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: `1px solid rgba(255,255,255,0.05)` }}>
                          <Typography sx={{ fontWeight: 900, color: palette.primaryHover, fontSize: '1.5rem' }}>
                            ${course.salePrice || course.originalPrice}
                          </Typography>
                          <Button component={Link} href={`/${locale}/login`} variant="contained" size="small" sx={{ bgcolor: palette.primary, color: '#000', fontWeight: 'bold', px: 2, py: 1, '&:hover': {bgcolor: palette.primaryHover} }}>
                            {ar ? 'سجل للمشاهدة' : 'Login to View'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Container>

      {/* ================= PACKAGES SECTION ================= */}
      <Box sx={{ background: `linear-gradient(to bottom, ${palette.bg}, ${palette.cardBg})`, py: 12 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', mb: 2 }}>
              {ar ? '💎 باقات الاشتراك' : '💎 Subscription Packages'}
            </Typography>
            <Typography sx={{ color: palette.textSec, fontSize: '1.2rem' }}>
              {ar ? 'اختر الباقة التي تناسب طموحك وابدأ فوراً' : 'Choose the package that fits your ambition'}
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {/* 🔴 تم التعديل: الباقات الآن تأخذ مساحة أكبر (تُعرض 3 في الصف الأول و 2 في الصف الثاني) وتم تكبير حجم الخطوط بداخلها */}
            {packages.map((pkg, i) => (
              <Grid item xs={12} sm={6} md={4} key={pkg.id}>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Card sx={{ 
                    p: { xs: 4, md: 5 }, // تكبير الـ Padding الداخلي
                    textAlign: 'center', borderRadius: 4, height: '100%',
                    background: pkg.id === 'vip' ? `linear-gradient(135deg, ${palette.cardBg}, rgba(230, 47, 118, 0.2))` : palette.bg, 
                    border: `2px solid ${pkg.id === 'vip' ? palette.danger : palette.border}`, 
                    position: 'relative', overflow: 'hidden',
                    transition: 'all 0.3s', '&:hover': { transform: 'translateY(-10px)', boxShadow: `0 15px 40px ${pkg.color}40` }
                  }}>
                    {pkg.id === 'vip' && (
                      <Box sx={{ position: 'absolute', top: 20, right: -35, background: palette.danger, color: '#fff', px: 5, py: 0.5, transform: 'rotate(45deg)', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: 1 }}>
                        {ar ? 'الأفضل' : 'BEST'}
                      </Box>
                    )}
                    <Typography sx={{ color: pkg.color, fontWeight: 900, fontSize: '1.8rem', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {pkg.title}
                    </Typography>
                    <Typography sx={{ color: '#fff', fontSize: '3.5rem', fontWeight: 900, my: 3 }}>
                      ${pkg.price}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 4, color: palette.textSec }}>
                      <CheckCircle sx={{ color: pkg.color, fontSize: 24 }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>{pkg.coursesCount} {ar ? 'كورس' : 'Courses'}</Typography>
                    </Box>
                    <Button component={Link} href={`/${locale}/register`} fullWidth variant="contained" 
                      sx={{ 
                        bgcolor: pkg.id === 'vip' ? palette.danger : palette.primary, 
                        color: pkg.id === 'vip' ? '#fff' : '#000', 
                        fontWeight: 800, py: 1.8, fontSize: '1.1rem', borderRadius: 2,
                        '&:hover': { bgcolor: pkg.color, color: '#000' }
                      }}>
                      {ar ? 'اشترك الآن' : 'Subscribe'}
                    </Button>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ================= FOOTER ================= */}
      <Box sx={{ borderTop: `1px solid ${palette.cardBg}`, py: 4, textAlign: 'center', background: palette.bg }}>
        <Typography sx={{ color: palette.textSec, fontSize: '1rem', fontWeight: 600 }}>
          © 2026 {ar ? 'منصة فيوتشر' : 'Future Platform'} — {ar ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}
        </Typography>
      </Box>
    </Box>
  );
}