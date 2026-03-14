'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Container, Typography, Grid, Card, CardContent, Button, CircularProgress, alpha, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { LocalOfferRounded, ViewModuleRounded, WorkspacePremiumRounded, PlayCircleOutlineRounded } from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { packagesApi, coursesApi } from '@/lib/api';
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
  accent: '#f59e0b',
  success: '#4ade80'
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.15 } }
};

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

export default function MyPackagesPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const ar = locale === 'ar';

  const [isMounted, setIsMounted] = useState(false); // 🔴 تم الإضافة لمنع الخروج العشوائي
  const [myPackages, setMyPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔴 منع الخروج أثناء التحميل الأولي للصفحة
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return; // 🔴 استنى لحد ما المتصفح يقرأ بيانات المستخدم
    
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    fetchMyPackages();
  }, [isMounted, isAuthenticated, locale, router]);

  const fetchMyPackages = async () => {
    try {
      // 1. نجيب كل الكورسات اللي المستخدم مشترك فيها والباقات المتاحة
      const [myCoursesRes, allPackagesRes] = await Promise.all([
        coursesApi.myCourses(),
        packagesApi.list()
      ]);

      const myCourses = myCoursesRes.data?.data || myCoursesRes.data || [];
      const allPackages = allPackagesRes.data?.data || allPackagesRes.data || [];

      // 2. نستخرج أنواع الكورسات اللي المستخدم يملكها (BASIC, PREMIUM, الخ)
      const myPackageTypes = new Set(
        myCourses
          .map((uc: any) => uc.course?.packageType?.toUpperCase())
          .filter(Boolean)
      );

      // 3. 🔴 المترجم الذكي للفرونت إند: نربط الباقات العربي بالكورسات الإنجليزي
      const ownedPackages = allPackages.filter((pkg: any) => {
        let packageTypeEnum: string | null = null;
        const nameStr = pkg.name.toLowerCase();

        if (nameStr.includes('basic') || nameStr.includes('بيزك')) packageTypeEnum = 'BASIC';
        else if (nameStr.includes('standard') || nameStr.includes('ستاندر')) packageTypeEnum = 'STANDARD';
        else if (nameStr.includes('premium') || nameStr.includes('بريميوم') || nameStr.includes('بريميم')) packageTypeEnum = 'PREMIUM';
        else if (nameStr.includes('enterprise') || nameStr.includes('انتربرايز')) packageTypeEnum = 'ENTERPRISE';
        else {
          const exactMatch = ['BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE'].find(e => e === pkg.name.toUpperCase());
          if (exactMatch) packageTypeEnum = exactMatch;
        }

        // لو المستخدم يملك كورسات من نفس نوع الباقة دي، اعرضهاله
        return packageTypeEnum && myPackageTypes.has(packageTypeEnum);
      });

      setMyPackages(ownedPackages);
    } catch (error) {
      console.error('Failed to fetch my packages', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔴 شاشة تحميل شيك تمنع أي شاشة بيضاء أو طرد أثناء قراءة التوكن
  if (!isMounted) {
    return (
      <Box sx={{ minHeight: '100vh', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: palette.primary }} size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, overflow: 'hidden' }}>
      <Navbar />

      {/* خلفية مضيئة */}
      <Box sx={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '70vw', height: '40vw', background: `radial-gradient(circle, ${alpha(palette.primary, 0.15)} 0%, transparent 70%)`, filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }} component={motion.div} initial="initial" animate="animate" variants={staggerContainer}>
        
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }} component={motion.div} variants={fadeInUp}>
          <Chip 
            icon={<WorkspacePremiumRounded sx={{ color: '#000 !important' }} />} 
            label={ar ? "اشتراكاتي" : "My Subscriptions"} 
            sx={{ background: `linear-gradient(135deg, ${palette.success}, #16a34a)`, color: '#000', fontWeight: 900, mb: 3, px: 1, py: 2.5, fontSize: '1rem', borderRadius: 3 }} 
          />
          <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff', mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            {ar ? 'باقاتي التعليمية' : 'My Packages'}
          </Typography>
          <Typography sx={{ color: palette.textSec, fontSize: '1.2rem', maxWidth: 600, mx: 'auto' }}>
            {ar ? 'هنا تجد جميع الباقات التي قمت بالاشتراك بها. يمكنك تصفح محتوى كل باقة والبدء في التعلم فوراً.' : 'Here you will find all the packages you have subscribed to. Browse the content and start learning.'}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: palette.primary }} size={60} />
          </Box>
        ) : myPackages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 4, border: `1px dashed ${alpha(palette.border, 0.3)}` }}>
            <LocalOfferRounded sx={{ fontSize: 60, color: palette.textSec, opacity: 0.5, mb: 2 }} />
            <Typography sx={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, mb: 1 }}>
              {ar ? 'لا تملك أي باقات حالياً' : 'You don\'t own any packages yet'}
            </Typography>
            <Typography sx={{ color: palette.textSec, fontSize: '1.1rem', mb: 4 }}>
              {ar ? 'تصفح باقاتنا واختر ما يناسب طموحك للبدء!' : 'Browse our packages and choose what suits your ambition!'}
            </Typography>
            <Button 
              onClick={() => router.push(`/${locale}/packages`)}
              variant="contained"
              sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 800, px: 4, py: 1.5, borderRadius: 3 }}
            >
              {ar ? 'استكشاف الباقات' : 'Explore Packages'}
            </Button>
          </Box>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {myPackages.map((pkg) => (
              <Grid item xs={12} sm={6} md={4} key={pkg.id} component={motion.div} variants={fadeInUp}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, rgba(8,69,112,0.4) 0%, rgba(10,10,15,0.9) 100%)', 
                  border: `1px solid ${palette.primary}`, 
                  borderRadius: 5, 
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  boxShadow: `0 10px 30px ${alpha(palette.primary, 0.15)}`,
                  '&:hover': { transform: 'translateY(-10px)', boxShadow: `0 20px 40px ${alpha(palette.primary, 0.3)}` }
                }}>
                  
                  {/* شريط تم الاشتراك */}
                  <Box sx={{ position: 'absolute', top: 15, right: -30, background: palette.success, color: '#000', fontWeight: 900, px: 4, py: 0.5, transform: 'rotate(45deg)', zIndex: 2, fontSize: '0.8rem', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {ar ? 'تم الاشتراك' : 'SUBSCRIBED'}
                  </Box>

                  {/* صورة الباقة */}
                  <Box sx={{ height: 200, width: '100%', backgroundImage: `url(${pkg.thumbnailUrl || '/placeholder.png'})`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: `2px solid ${palette.primary}` }} />

                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 3, textTransform: 'uppercase' }}>
                      {pkg.name}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 4, background: 'rgba(255,255,255,0.05)', p: 1.5, borderRadius: 3 }}>
                      <ViewModuleRounded sx={{ color: palette.accent }} />
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                        {pkg.coursesCount} {ar ? 'كورسات متاحة' : 'Available Courses'}
                      </Typography>
                    </Box>

                    {/* زر الذهاب لكورساتي */}
                    <Button 
                      fullWidth 
                      onClick={() => router.push(`/${locale}/my-courses`)} // بيحوله لصفحة كورساته يقدر يذاكر منها
                      startIcon={<PlayCircleOutlineRounded />}
                      sx={{ 
                        background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, 
                        color: '#000', 
                        borderRadius: 3, 
                        py: 1.5, 
                        fontWeight: 900, 
                        fontSize: '1.1rem',
                        transition: 'all 0.3s',
                        '&:hover': { background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})`, transform: 'scale(1.02)' }
                      }}
                    >
                      {ar ? 'بدء التعلم' : 'Start Learning'}
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