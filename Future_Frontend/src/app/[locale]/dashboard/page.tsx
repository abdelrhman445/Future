'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Container, Grid, Card, CardContent, CardMedia, Typography, 
  Button, Avatar, Chip, Divider, CircularProgress, Stack, alpha, keyframes 
} from '@mui/material';
import { 
  PlayCircle, School, TrendingUp, People, ArrowForward, 
  ArrowBack, ContentCopy, AdminPanelSettings, AutoAwesomeRounded 
} from '@mui/icons-material';
import { motion } from 'framer-motion'; 
import Navbar from '@/components/layout/Navbar';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { UserCourse } from '@/types';
import toast from 'react-hot-toast';

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

// ================= ANIMATION VARIANTS =================
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const pulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
`;

export default function DashboardPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const ar = locale === 'ar';
  
  const [isMounted, setIsMounted] = useState(false);
  const [myCourses, setMyCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) { 
      router.push(`/${locale}/login`); 
      return; 
    }
    // جلب الكورسات الحقيقية من قاعدة البيانات
    coursesApi.myCourses()
      .then((res) => setMyCourses(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isMounted, isAuthenticated, locale, router]);

  const completedCourses = myCourses.filter((c) => c.status === 'COMPLETED');
  
  // جلب كود الإحالة الحقيقي للمستخدم
  const affiliateCode = user?.affiliateCode;
  const affiliateLink = affiliateCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/${locale}/register?ref=${affiliateCode}`
    : null;

  const copyLink = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      toast.success(ar ? 'تم النسخ بنجاح! 🚀' : 'Link Copied! 🚀');
    }
  };

  if (!isMounted) {
    return (
      <Box sx={{ minHeight: '100vh', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: palette.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, pb: 10, position: 'relative', overflow: 'hidden' }}>
      {/* Background Glow */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '40vw', background: `radial-gradient(circle, rgba(48,192,242,0.1) 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

      <Navbar />
      
      <Container 
        maxWidth="lg" 
        sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}
        component={motion.div}
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >

        {/* ================= Welcome Banner ================= */}
        <motion.div variants={fadeInUp}>
          <Box sx={{ 
            background: `linear-gradient(135deg, rgba(8,69,112,0.6) 0%, rgba(10,10,15,0.8) 100%)`, 
            backdropFilter: 'blur(15px)', 
            border: `1px solid ${palette.border}`, 
            borderRadius: 6, p: { xs: 3, md: 4 }, mb: 5, 
            display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', position: 'relative', overflow: 'hidden',
            boxShadow: `0 10px 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(48,192,242,0.2)`
          }}>
            <Box sx={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'rgba(48,192,242,0.2)', filter: 'blur(50px)', borderRadius: '50%' }} />

            <Avatar 
              component={motion.div}
              whileHover={{ scale: 1.1, rotate: 5 }}
              sx={{ 
                width: 80, height: 80, 
                background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, 
                color: '#000', fontSize: 32, fontWeight: 900, flexShrink: 0, 
                boxShadow: `0 8px 25px rgba(48,192,242,0.4)`, border: `3px solid ${palette.primaryHover}`
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            
            <Box sx={{ flexGrow: 1, zIndex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, color: '#fff', letterSpacing: '-0.5px' }}>
                {ar ? `أهلاً، ${user?.firstName}! 👋` : `Welcome, ${user?.firstName}! 👋`}
              </Typography>
              <Typography sx={{ color: palette.textSec, fontSize: '1rem' }}>
                {ar ? 'سعيدون برؤيتك مرة أخرى في رحلة تعلمك' : "Great to have you back on your learning journey"}
              </Typography>
            </Box>

            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <Button 
                component={Link} href={`/${locale}/admin`} variant="contained" 
                startIcon={<AdminPanelSettings sx={{ mr: 0.5 }} />}
                sx={{ 
                  background: 'rgba(255,255,255,0.05)', color: '#fff', backdropFilter: 'blur(5px)',
                  border: `1px solid ${palette.border}`, px: 3, py: 1.2, borderRadius: 3, fontWeight: 800, gap: 1,
                  transition: '0.3s', '&:hover': { background: palette.cardBg, borderColor: palette.primary, transform: 'scale(1.05)' }
                }}
              >
                {ar ? 'لوحة الإدارة' : 'Admin Panel'}
              </Button>
            )}
          </Box>
        </motion.div>

        {/* ================= Stats Grid (🔴 تم ضبط المسافات هنا) ================= */}
        <Grid container spacing={3} sx={{ mb: 6 }} component={motion.div} variants={staggerContainer}>
          {[
            { icon: <School sx={{ fontSize: 36 }} />, value: completedCourses.length, label: ar ? 'كورساتي المفعّلة' : 'Active Courses', color: palette.primary },
            { icon: <TrendingUp sx={{ fontSize: 36 }} />, value: `$${user?.totalEarnings || 0}`, label: ar ? 'إجمالي الأرباح' : 'Total Earnings', color: '#4ade80' },
            { icon: <People sx={{ fontSize: 36 }} />, value: `$${user?.pendingEarnings || 0}`, label: ar ? 'أرباح قيد الانتظار' : 'Pending Clearance', color: '#facc15' },
          ].map((stat, i) => (
            <Grid item xs={12} sm={4} key={i} component={motion.div} variants={fadeInUp}>
              <Card 
                component={motion.div}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                sx={{ 
                  p: { xs: 3, md: 4 }, // تكبير البادينج عشان الكارت يتنفس
                  background: 'rgba(8, 69, 112, 0.4)', backdropFilter: 'blur(10px)', 
                  border: `1px solid rgba(37,154,203,0.3)`, borderRadius: 5,
                  transition: 'all 0.3s', '&:hover': { borderColor: stat.color, background: alpha(stat.color, 0.05), boxShadow: `0 10px 30px rgba(0,0,0,0.5)` }
                }}
              >
                {/* تم تعديل الـ direction لـ row-reverse والـ justifyContent لضبط المسافات */}
                <Stack direction="row-reverse" alignItems="center" justifyContent="space-between" spacing={3}>
                  <Box sx={{ 
                    p: 2, // تكبير مساحة الأيقونة
                    borderRadius: 4, 
                    background: alpha(stat.color, 0.15), 
                    color: stat.color, 
                    display: 'flex', 
                    border: `1px solid ${alpha(stat.color, 0.3)}`,
                    boxShadow: `0 4px 15px ${alpha(stat.color, 0.2)}`
                  }}>
                    {stat.icon}
                  </Box>
                  <Box sx={{ textAlign: ar ? 'right' : 'left' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '2.5rem', color: '#fff', lineHeight: 1, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography sx={{ color: palette.textSec, fontSize: '0.95rem', fontWeight: 700 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ================= Affiliate Section ================= */}
        {affiliateCode && (
          <motion.div variants={fadeInUp}>
            <Box sx={{ 
              background: `linear-gradient(135deg, rgba(8,69,112,0.5), transparent)`, 
              border: `1px solid ${palette.border}`, borderRadius: 5, p: 4, mb: 6,
              boxShadow: `inset 0 0 0 1px rgba(48,192,242,0.1)` 
            }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ p: 1, borderRadius: 2, background: palette.primary, color: '#000', display: 'flex' }}><AutoAwesomeRounded /></Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>{ar ? 'برنامج التسويق بالعمولة' : 'Affiliate Program'}</Typography>
                </Stack>
                <Chip label={`${ar ? 'كودك المميز' : 'Your Code'}: ${affiliateCode}`} sx={{ background: alpha(palette.primary, 0.2), color: palette.primary, fontWeight: 900, border: `1px solid ${palette.primary}` }} />
              </Stack>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={9}>
                  <Box sx={{ background: palette.bg, border: `1px solid ${palette.cardBg}`, borderRadius: 3, px: 3, py: 2, color: palette.textMain, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {affiliateLink}
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button 
                    onClick={copyLink} 
                    component={motion.button}
                    whileTap={{ scale: 0.95 }}
                    variant="contained" fullWidth startIcon={<ContentCopy sx={{ mr: 0.5 }} />} 
                    sx={{ 
                      background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', 
                      py: 1.8, borderRadius: 3, fontWeight: 900, gap: 1,
                      '&:hover': { background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})` }
                    }}
                  >
                    {ar ? 'نسخ الرابط' : 'Copy Link'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        )}

        {/* ================= My Courses Section ================= */}
        <motion.div variants={fadeInUp}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <School sx={{ color: palette.primary }} /> {ar ? 'دوراتي التعليمية' : 'My Courses'}
            </Typography>
            <Button 
              component={Link} href={`/${locale}/courses`} 
              endIcon={ar ? <ArrowBack sx={{ ml: 1.5 }} /> : <ArrowForward sx={{ ml: 1.5 }} />}
              sx={{ 
                color: palette.primary, fontWeight: 800, gap: 1.5, '&:hover': { background: alpha(palette.primary, 0.1) },
                transition: '0.3s', '&:hover .MuiButton-endIcon': { transform: ar ? 'translateX(-5px)' : 'translateX(5px)' }
              }}
            >
              {ar ? 'اكتشف المزيد' : 'Explore More'}
            </Button>
          </Stack>
        </motion.div>

        {loading ? (
          <Grid container spacing={3}>
            {Array(3).fill(0).map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Box sx={{ height: 300, borderRadius: 5, background: 'rgba(255,255,255,0.02)' }} className="skeleton" /></Grid>)}
          </Grid>
        ) : completedCourses.length === 0 ? (
          <motion.div variants={fadeInUp}>
            <Box sx={{ textAlign: 'center', py: 10, background: 'rgba(8, 69, 112, 0.2)', borderRadius: 5, border: `1px dashed ${palette.border}` }}>
               <School sx={{ fontSize: 60, color: palette.textSec, mb: 2, opacity: 0.5 }} />
               <Typography sx={{ color: palette.textSec, fontSize: '1.2rem', fontWeight: 600 }}>
                 {ar ? 'لم تقم بتفعيل أي دورات بعد.' : "You haven't activated any courses yet."}
               </Typography>
            </Box>
          </motion.div>
        ) : (
          <Grid container spacing={4} component={motion.div} variants={staggerContainer}>
            {completedCourses.map((uc) => (
              <Grid item xs={12} sm={6} md={4} key={uc.id} component={motion.div} variants={fadeInUp}>
                <Card 
                  component={motion.div}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  sx={{ 
                    background: 'rgba(8, 69, 112, 0.4)', backdropFilter: 'blur(10px)', border: `1px solid rgba(37,154,203,0.3)`, 
                    borderRadius: 5, transition: 'all 0.4s', '&:hover': { borderColor: palette.primary, boxShadow: `0 20px 40px rgba(0,0,0,0.5)` } 
                  }}
                >
                  <CardMedia component="div" sx={{ height: 180, background: uc.course.thumbnailUrl ? `url(${uc.course.thumbnailUrl}) center/cover` : `linear-gradient(135deg, ${palette.bg}, ${palette.cardBg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {!uc.course.thumbnailUrl && <PlayCircle sx={{ fontSize: 60, color: palette.primary, opacity: 0.8 }} />}
                    
                    {/* النقطة الخضراء (مفعّل) */}
                    <Box sx={{ 
                        position: 'absolute', top: 15, right: 15, display: 'flex', alignItems: 'center', gap: 1,
                        background: 'rgba(0,0,0,0.7)', px: 1.5, py: 0.5, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)'
                    }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: `${pulse} 2s infinite ease-in-out` }} />
                        <Typography sx={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>{ar ? 'مفعّل' : 'Active'}</Typography>
                    </Box>
                  </CardMedia>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ fontWeight: 800, mb: 2, color: '#fff', fontSize: '1.1rem' }}>{uc.course.title}</Typography>
                    <Divider sx={{ borderColor: 'rgba(37,154,203,0.3)', mb: 3 }} />
                    <Button 
                      component={Link} href={`/${locale}/my-courses/${uc.courseId}`} 
                      variant="contained" fullWidth startIcon={<PlayCircle sx={{ mr: 0.5 }} />} 
                      sx={{ 
                        background: alpha(palette.primary, 0.1), color: palette.textMain, py: 1.5, borderRadius: 3, fontWeight: 800, gap: 1, border: `1px solid ${alpha(palette.border, 0.3)}`,
                        transition: '0.3s', '&:hover': { background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', borderColor: 'transparent', transform: 'scale(1.02)' } 
                      }}
                    >
                      {ar ? 'استكمال التعلم' : 'Resume Learning'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}