'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Button, Container, Grid, Card, CardContent, CardMedia, Chip, 
  Typography, CircularProgress, alpha, Accordion, AccordionSummary, 
  AccordionDetails, Stack, IconButton, Divider
} from '@mui/material';
import { 
  PlayCircle, School, TrendingUp, Star, Login, PersonAdd, CheckCircle, 
  RocketLaunchRounded, WorkspacePremiumRounded, LocalFireDepartmentRounded,
  ExpandMoreRounded, Facebook, Instagram
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { coursesApi, adminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// ================= THEME PALETTE =================
const palette = {
  bg: '#050508', // Darker premium background
  cardBg: '#0a111a',
  border: '#259acb',
  primary: '#30c0f2',
  primaryHover: '#83d9f7',
  textMain: '#e0f7fa',
  textSec: '#a0ddf1',
  danger: '#e62f76',
  success: '#10b981',
  warning: '#f59e0b',
};

// ================= STATIC DATA =================
const faqs = [
  { q: 'كيف أبدأ التعلم على المنصة؟', a: 'بمجرد إنشاء حساب مجاني، يمكنك تصفح الكورسات. للاستفادة الكاملة، اختر باقة الاشتراك المناسبة لك للوصول إلى المحتوى المدفوع.', qEn: 'How do I start learning?', aEn: 'Once you create a free account, you can browse courses. To get full access, choose a subscription package that fits you.' },
  { q: 'كيف يعمل نظام التسويق بالعمولة؟', a: 'تحصل على رابط إحالة خاص بك (Affiliate Link). عند تسجيل أي شخص من خلال رابطك وشرائه لباقة، تحصل فوراً على عمولة 15% تضاف لرصيدك.', qEn: 'How does the affiliate system work?', aEn: 'You get a unique affiliate link. When someone registers through it and purchases a package, you instantly get a 15% commission.' },
  { q: 'هل يمكنني استرداد أموالي أو سحب أرباحي؟', a: 'نعم، يمكنك سحب أرباحك من التسويق بمجرد وصولك للحد الأدنى للسحب عبر طرق دفع متعددة (حساب بنكي، باي بال، محافظ إلكترونية).', qEn: 'Can I withdraw my earnings?', aEn: 'Yes, you can withdraw your marketing earnings once you reach the minimum threshold via multiple payment methods.' },
  { q: 'هل الكورسات مسجلة أم مباشرة؟', a: 'جميع الكورسات مسجلة مسبقاً بجودة عالية (VOD) لتتمكن من مشاهدتها في أي وقت ومن أي مكان بالسرعة التي تناسبك.', qEn: 'Are the courses recorded or live?', aEn: 'All courses are pre-recorded in high quality (VOD) so you can watch them anytime, anywhere at your own pace.' },
];

export default function HomePage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const ar = locale === 'ar';
  
  const { isAuthenticated } = useAuthStore();
  
  const [courses, setCourses] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [statsData, setStatsData] = useState({ totalCourses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${locale}/dashboard`);
      return;
    }

    const fetchLandingData = async () => {
      try {
        // 1. بنجيب 3 كورسات بس للعرض في الصفحة
        const coursesRes = await coursesApi.list({ limit: 3 });
        
        // توحيد قراءة البيانات سواء Axios مرجعها جوه data أو لا
        const responseData = coursesRes.data?.data || coursesRes.data; 
        
        const fetchedCourses = responseData?.courses || [];
        setCourses(fetchedCourses);
        
        // 2. نجيب الباقات
        const pkgRes = await (adminApi as any).getPackages();
        setPackages(pkgRes.data?.data || pkgRes.data || []);

        // 🔴 التعديل هنا: بنقرأ الـ total الحقيقي من الباك إند
        const realTotalCourses = responseData?.total || fetchedCourses.length || 0;

        setStatsData({
          totalCourses: realTotalCourses
        });
      } catch (error) {
        console.error('Failed to load landing data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, [isAuthenticated, router, locale]);

  if (isAuthenticated) return <Box sx={{ minHeight: '100vh', bgcolor: palette.bg }} />;

  const stats = [
    { icon: <School sx={{ fontSize: 38, color: palette.primary }} />, value: `+${statsData.totalCourses}`, label: ar ? 'كورس متاح' : 'Available Courses' },
    { icon: <TrendingUp sx={{ fontSize: 38, color: palette.textMain }} />, value: '15%', label: ar ? 'عمولة إحالة' : 'Affiliate Commission' },
    { icon: <Star sx={{ fontSize: 38, color: palette.success }} />, value: '24/7', label: ar ? 'دعم فني' : 'Technical Support' },
  ];

  const getPkgColor = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('VIP') || n.includes('ALL')) return palette.danger;
    if (n.includes('GOLD')) return '#FFD700';
    if (n.includes('SILVER')) return '#C0C0C0';
    return palette.primary;
  };

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, overflowX: 'hidden' }}>
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <Box sx={{ position: 'relative', pt: { xs: 15, md: 24 }, pb: { xs: 12, md: 18 } }}>
        <Box sx={{ position: 'absolute', top: '-10%', left: '10%', width: '50vw', height: '50vw', background: `radial-gradient(circle, ${alpha(palette.border, 0.15)} 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', background: `radial-gradient(circle, ${alpha(palette.primary, 0.1)} 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0 }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <Chip 
  label={ar ? 'بوابتك نحو الاحتراف الرقمي' : 'Your Gateway to Digital Mastery'} 
  sx={{ mb: 4, background: alpha(palette.primary, 0.08), color: palette.primary, border: `1px solid ${alpha(palette.primary, 0.2)}`, fontWeight: 700, px: 1.5, py: 2.5, fontSize: '0.95rem', backdropFilter: 'blur(10px)' }} 
/>
            <Typography variant="h1" sx={{ fontSize: { xs: '2.8rem', md: '5rem' }, fontWeight: 900, lineHeight: 1.15, mb: 3, color: '#fff', letterSpacing: '-1px' }}>
              {ar ? 'تعلّم المهارات، واصنع' : 'Learn Skills, Create'} <br />
              <Box component="span" sx={{ background: `linear-gradient(135deg, #fff 0%, ${palette.primaryHover} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {ar ? 'مستقبلك المالي' : 'Your Future'}
              </Box>
            </Typography>
            <Typography sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, color: palette.textSec, mb: 6, maxWidth: 650, mx: 'auto', lineHeight: 1.8, opacity: 0.9 }}>
              {ar
                ? 'منصة فيوتشر تقدم لك محتوى تعليمي احترافي مصمم لسوق العمل. ابدأ رحلتك الآن، طوّر مهاراتك، واكسب عمولة 15% على كل دعوة ناجحة.'
                : 'Future platform offers professional educational content designed for the job market. Start your journey, develop skills, and earn 15% commission per successful invite.'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2.5, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                component={Link} href={`/${locale}/login`} 
                variant="contained" 
                size="large"
                sx={{ 
                  display: 'flex', alignItems: 'center', gap: 1.5, 
                  px: 5, py: 1.8, fontSize: '1.05rem', fontWeight: 800, color: '#000',
                  background: palette.primary, 
                  boxShadow: `0 8px 25px ${alpha(palette.primary, 0.3)}`, 
                  borderRadius: '50px',
                  '&:hover': { background: palette.primaryHover, transform: 'translateY(-3px)', boxShadow: `0 12px 35px ${alpha(palette.primary, 0.5)}` },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                {ar ? 'تسجيل الدخول' : 'Login Now'}
                <Login sx={{ fontSize: 20 }} />
              </Button>
              <Button 
                component={Link} href={`/${locale}/register`} 
                variant="outlined" 
                size="large"
                sx={{ 
                  display: 'flex', alignItems: 'center', gap: 1.5, 
                  px: 5, py: 1.8, fontSize: '1.05rem', fontWeight: 800,
                  borderColor: alpha(palette.border, 0.5), color: palette.textMain, borderWidth: 2,
                  borderRadius: '50px', backdropFilter: 'blur(10px)',
                  '&:hover': { borderColor: palette.primary, color: palette.primary, background: alpha(palette.primary, 0.05), transform: 'translateY(-3px)' },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                <PersonAdd sx={{ fontSize: 20 }} />
                {ar ? 'إنشاء حساب مجاني' : 'Create Free Account'}
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* ================= STATS SECTION ================= */}
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2, mt: { xs: -4, md: -8 } }}>
        <Grid container spacing={4} justifyContent="center">
          {stats.map((stat, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.4 }}>
                <Card sx={{ 
                  textAlign: 'center', p: 4, background: alpha(palette.cardBg, 0.6), 
                  border: `1px solid ${alpha(palette.border, 0.15)}`, backdropFilter: 'blur(20px)',
                  borderRadius: 6, transition: 'all 0.4s ease', boxShadow: `0 10px 40px -10px rgba(0,0,0,0.5)`,
                  '&:hover': { borderColor: alpha(palette.primary, 0.4), transform: 'translateY(-8px)' } 
                }}>
                  <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', background: alpha('#fff', 0.03), mb: 2, border: `1px solid ${alpha('#fff', 0.05)}` }}>
                    {stat.icon}
                  </Box>
                  <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', mb: 0.5, letterSpacing: '-1px' }}>{stat.value}</Typography>
                  <Typography sx={{ color: palette.textSec, fontSize: '1rem', fontWeight: 600, opacity: 0.8 }}>{stat.label}</Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ================= FEATURED COURSES ================= */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 15 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip label={ar ? 'الأكثر طلباً' : 'Trending'} sx={{ mb: 2, bgcolor: alpha(palette.danger, 0.1), color: palette.danger, fontWeight: 800, border: `1px solid ${alpha(palette.danger, 0.2)}` }} />
          <Typography variant="h2" sx={{ fontWeight: 900, color: palette.textMain, mb: 2, fontSize: { xs: '2rem', md: '2.8rem' } }}>
            {ar ? 'أشهر الكورسات التعليمية' : 'Top Featured Courses'}
          </Typography>
          <Typography sx={{ color: palette.textSec, fontSize: '1.1rem', maxWidth: 600, mx: 'auto', opacity: 0.8 }}>
            {ar ? 'اختر من بين أفضل الكورسات المصممة على يد خبراء لبناء مهاراتك خطوة بخطوة.' : 'Choose from the best courses designed by experts to build your skills step by step.'}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: palette.primary }} /></Box>
        ) : (
          <Grid container spacing={4}>
            {courses.length === 0 ? (
              <Grid item xs={12}><Typography textAlign="center" color={palette.textSec} fontSize="1.2rem">{ar ? 'سيتم إضافة الكورسات قريباً...' : 'Courses coming soon...'}</Typography></Grid>
            ) : (
              courses.map((course, i) => (
                <Grid item xs={12} sm={6} md={4} key={course.id}>
                  <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ delay: i * 0.1, duration: 0.6 }}>
                    <Card sx={{ 
                      textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column', 
                      background: `linear-gradient(180deg, ${alpha(palette.cardBg, 0.4)} 0%, ${alpha('#000', 0.6)} 100%)`, 
                      border: `1px solid ${alpha(palette.border, 0.15)}`, borderRadius: 6, overflow: 'hidden', backdropFilter: 'blur(10px)',
                      transition: 'all 0.4s ease', 
                      '&:hover': { borderColor: alpha(palette.primary, 0.5), transform: 'translateY(-10px)', boxShadow: `0 25px 50px -12px rgba(48,192,242,0.15)` } 
                    }}>
                      <CardMedia
                        component="div"
                        sx={{ height: 240, position: 'relative', background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : `linear-gradient(135deg, #052c4a, ${palette.cardBg})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 100%)' }} />
                        {!course.thumbnailUrl && <PlayCircle sx={{ fontSize: 60, color: palette.primary, opacity: 0.5, zIndex: 1 }} />}
                        <Chip label={course.packageType} size="small" sx={{ position: 'absolute', top: 16, right: ar ? 16 : 'auto', left: ar ? 'auto' : 16, background: alpha(palette.bg, 0.8), color: '#fff', fontWeight: 800, border: `1px solid ${alpha('#fff', 0.1)}`, backdropFilter: 'blur(5px)' }} />
                      </CardMedia>
                      <CardContent sx={{ flexGrow: 1, p: 3.5, display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: '1.25rem', color: '#fff', lineHeight: 1.4 }}>{course.title}</Typography>
                        <Typography sx={{ color: palette.textSec, fontSize: '0.95rem', mb: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', opacity: 0.8, flexGrow: 1 }}>
                          {course.shortDescription || course.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2.5, borderTop: `1px solid ${alpha('#fff', 0.05)}` }}>
                          <Typography sx={{ fontWeight: 900, color: '#fff', fontSize: '1.4rem' }}>
                            ${course.salePrice || course.originalPrice}
                          </Typography>
                          <Button component={Link} href={`/${locale}/login`} variant="contained" size="small" sx={{ bgcolor: alpha(palette.primary, 0.1), color: palette.primary, border: `1px solid ${alpha(palette.primary, 0.2)}`, fontWeight: 700, px: 2.5, py: 1, borderRadius: '20px', '&:hover': {bgcolor: palette.primary, color: '#000'} }}>
                            {ar ? 'التفاصيل' : 'Details'}
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
      <Box sx={{ background: `linear-gradient(to bottom, ${alpha(palette.cardBg, 0.3)}, ${palette.bg})`, py: { xs: 10, md: 15 }, mt: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label={ar ? 'خطط الأسعار' : 'Pricing'} sx={{ mb: 2, bgcolor: alpha(palette.warning, 0.1), color: palette.warning, fontWeight: 800, border: `1px solid ${alpha(palette.warning, 0.2)}` }} />
            <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff', mb: 2, fontSize: { xs: '2rem', md: '2.8rem' } }}>
              {ar ? 'باقات تناسب طموحك' : 'Packages for Your Ambition'}
            </Typography>
            <Typography sx={{ color: palette.textSec, fontSize: '1.1rem', opacity: 0.8 }}>
              {ar ? 'اختر الباقة المناسبة للوصول الكامل واستفد من نظام الأرباح المدمج.' : 'Choose the right package for full access and benefit from the built-in reward system.'}
            </Typography>
          </Box>
          <Grid container spacing={4} justifyContent="center" alignItems="stretch">
            {packages.map((pkg, i) => {
              const pColor = getPkgColor(pkg.name);
              const isVIP = pkg.name.toUpperCase().includes('VIP') || pkg.name.toUpperCase().includes('ALL');
              return (
                <Grid item xs={12} sm={6} md={4} key={pkg.id}>
                  <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }} style={{ height: '100%' }}>
                    <Card sx={{ 
                      p: { xs: 4, md: 5 }, textAlign: 'center', borderRadius: 6, height: '100%', display: 'flex', flexDirection: 'column',
                      background: isVIP ? `linear-gradient(180deg, ${alpha(palette.cardBg, 0.8)} 0%, ${alpha(palette.danger, 0.05)} 100%)` : alpha(palette.cardBg, 0.4), 
                      border: `1px solid ${isVIP ? alpha(palette.danger, 0.4) : alpha(palette.border, 0.15)}`, 
                      position: 'relative', overflow: 'hidden', transition: 'all 0.4s ease', 
                      backdropFilter: 'blur(20px)',
                      '&:hover': { transform: 'translateY(-12px)', borderColor: isVIP ? palette.danger : alpha(palette.primary, 0.5), boxShadow: `0 20px 40px ${alpha(pColor, 0.15)}` }
                    }}>
                      {isVIP && <Box sx={{ position: 'absolute', top: 25, right: -35, background: palette.danger, color: '#fff', px: 5, py: 0.5, transform: 'rotate(45deg)', fontSize: '0.8rem', fontWeight: 900, letterSpacing: 2, boxShadow: `0 2px 10px ${alpha(palette.danger, 0.5)}` }}>{ar ? 'الأفضل' : 'BEST'}</Box>}
                      <Typography sx={{ color: pColor, fontWeight: 900, fontSize: '1.4rem', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>{pkg.name}</Typography>
                      <Box sx={{ my: 4 }}>
                        <Typography component="span" sx={{ color: palette.textSec, fontSize: '1.5rem', fontWeight: 700, verticalAlign: 'top' }}>$</Typography>
                        <Typography component="span" sx={{ color: '#fff', fontSize: '4rem', fontWeight: 900, letterSpacing: '-2px' }}>{pkg.price}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 5, color: palette.textSec, flexGrow: 1 }}>
                        <CheckCircle sx={{ color: pColor, fontSize: 22 }} />
                        <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#fff' }}>
                          {isVIP ? (ar ? 'وصول مفتوح لجميع الكورسات' : 'Unlimited Access to All') : `${pkg.coursesCount} ${ar ? 'كورسات مخصصة' : 'Selected Courses'}`}
                        </Typography>
                      </Box>
                      <Button component={Link} href={`/${locale}/register`} fullWidth variant="contained" sx={{ 
                        bgcolor: isVIP ? palette.danger : palette.primary, color: isVIP ? '#fff' : '#000', 
                        fontWeight: 800, py: 1.8, fontSize: '1.05rem', borderRadius: '50px', 
                        boxShadow: `0 8px 20px ${alpha(isVIP ? palette.danger : palette.primary, 0.3)}`,
                        '&:hover': { bgcolor: pColor, color: '#000', transform: 'scale(1.02)' } 
                      }}>
                        {ar ? 'اشترك الآن' : 'Subscribe Now'}
                      </Button>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* ================= FAQ SECTION ================= */}
      <Container id="faq" maxWidth="md" sx={{ py: { xs: 10, md: 15 }, scrollMarginTop: '100px' }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff', mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' }, letterSpacing: '-0.5px' }}>
            {ar ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </Typography>
          <Typography sx={{ color: palette.textSec, fontSize: '1.1rem', opacity: 0.8 }}>
            {ar ? 'كل ما تحتاج معرفته عن المنصة ونظام الأرباح' : 'Everything you need to know about the platform and earnings'}
          </Typography>
        </Box>
        <Box>
          {faqs.map((faq, i) => (
            <Accordion key={i} sx={{ 
              bgcolor: alpha(palette.cardBg, 0.4), border: `1px solid ${alpha(palette.border, 0.1)}`, 
              mb: 2.5, borderRadius: '16px !important', '&:before': { display: 'none' },
              backdropFilter: 'blur(10px)', transition: 'all 0.3s ease',
              '&:hover': { borderColor: alpha(palette.primary, 0.3), bgcolor: alpha(palette.cardBg, 0.6) },
              '&.Mui-expanded': { borderColor: alpha(palette.primary, 0.5), boxShadow: `0 10px 30px ${alpha(palette.primary, 0.1)}` }
            }}>
              <AccordionSummary expandIcon={<ExpandMoreRounded sx={{ color: palette.primary, fontSize: '1.8rem' }} />} sx={{ py: 1.5, px: 3 }}>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>{ar ? faq.q : faq.qEn}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ borderTop: `1px solid ${alpha('#fff', 0.05)}`, pt: 3, pb: 4, px: 3 }}>
                <Typography sx={{ color: palette.textSec, lineHeight: 1.8, fontSize: '1.05rem', opacity: 0.9 }}>{ar ? faq.a : faq.aEn}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>

      {/* ================= MEGA FOOTER ================= */}
      <Box sx={{ borderTop: `1px solid ${alpha(palette.border, 0.15)}`, pt: 12, pb: 4, background: `linear-gradient(to bottom, ${palette.bg}, ${palette.cardBg})` }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} sx={{ mb: 10 }}>
            
            {/* العمود الأول: اللوجو والسوشيال ميديا */}
            <Grid item xs={12} md={4}>
              <Typography sx={{ fontWeight: 900, fontSize: '2rem', color: '#fff', mb: 3, letterSpacing: '-1px' }}>
                {ar ? 'منصة ' : 'Future '}
                <Box component="span" sx={{ color: palette.primary }}>
                  {ar ? 'فيوتشر' : 'Platform'}
                </Box>
              </Typography>
              <Typography sx={{ color: palette.textSec, mb: 6, lineHeight: 1.8, opacity: 0.8, maxWidth: 320, fontSize: '1.05rem' }}>
                {ar ? 'منصتك الشاملة لتعلم المهارات الرقمية الحديثة وبناء مصدر دخل مستقل من خلال نظام التسويق المدمج.' : 'Your comprehensive platform for learning modern digital skills and building an independent income stream.'}
              </Typography>
              
              {/* 🔴 تم توسيع المسافات بقوة باستخدام الـ gap */}
              <Stack direction="row" sx={{ gap: { xs: 4, sm: 6 } }}>
                <IconButton component="a" href="https://facebook.com" target="_blank" sx={{ 
                  width: 56, height: 56, color: palette.textSec, bgcolor: alpha('#fff', 0.03), border: `1px solid ${alpha('#fff', 0.1)}`,
                  '&:hover': { color: '#000', bgcolor: palette.primary, borderColor: palette.primary, transform: 'translateY(-5px)', boxShadow: `0 10px 20px ${alpha(palette.primary, 0.3)}` }, 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}>
                  <Facebook sx={{ fontSize: 28 }} />
                </IconButton>
                <IconButton component="a" href="https://instagram.com" target="_blank" sx={{ 
                  width: 56, height: 56, color: palette.textSec, bgcolor: alpha('#fff', 0.03), border: `1px solid ${alpha('#fff', 0.1)}`,
                  '&:hover': { color: '#000', bgcolor: palette.primary, borderColor: palette.primary, transform: 'translateY(-5px)', boxShadow: `0 10px 20px ${alpha(palette.primary, 0.3)}` }, 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}>
                  <Instagram sx={{ fontSize: 28 }} />
                </IconButton>
              </Stack>
            </Grid>

            {/* العمود الثاني: اشتراك وتسجيل دخول */}
            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ fontWeight: 800, color: '#fff', mb: 4, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {ar ? 'ابدأ رحلتك الآن' : 'Start Your Journey'}
              </Typography>
              <Stack spacing={3} sx={{ mb: 6 }}>
                <Typography component={Link} href={`/${locale}/register`} sx={{ color: palette.textSec, textDecoration: 'none', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)', textShadow: `0 0 10px ${alpha(palette.primary, 0.5)}` } }}>
                  {ar ? 'إنشاء حساب جديد' : 'Create New Account'}
                </Typography>
                <Typography component={Link} href={`/${locale}/courses`} sx={{ color: palette.textSec, textDecoration: 'none', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)', textShadow: `0 0 10px ${alpha(palette.primary, 0.5)}` } }}>
                  {ar ? 'تصفح الكورسات' : 'Browse Courses'}
                </Typography>
              </Stack>

              <Typography sx={{ fontWeight: 800, color: '#fff', mb: 4, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {ar ? 'لديك حساب بالفعل؟' : 'Already Registered?'}
              </Typography>
              <Stack spacing={3}>
                <Typography component={Link} href={`/${locale}/login`} sx={{ color: palette.textSec, textDecoration: 'none', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)', textShadow: `0 0 10px ${alpha(palette.primary, 0.5)}` } }}>
                  {ar ? 'تسجيل الدخول' : 'Login Here'}
                </Typography>
              </Stack>
            </Grid>

            {/* العمود الثالث: الدعم القانوني والتواصل */}
            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ fontWeight: 800, color: '#fff', mb: 4, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {ar ? 'الدعم والمساعدة' : 'Legal & Support'}
              </Typography>
              <Stack spacing={3}>
                <Typography component={Link} href={`/${locale}/terms`} sx={{ color: palette.textSec, textDecoration: 'none', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)', textShadow: `0 0 10px ${alpha(palette.primary, 0.5)}` } }}>
                  {ar ? 'الشروط والأحكام' : 'Terms & Conditions'}
                </Typography>
                <Typography component={Link} href={`/${locale}/privacy`} sx={{ color: palette.textSec, textDecoration: 'none', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)', textShadow: `0 0 10px ${alpha(palette.primary, 0.5)}` } }}>
                  {ar ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </Typography>
                <Typography component="a" href="#faq" sx={{ color: palette.textSec, textDecoration: 'none', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)', textShadow: `0 0 10px ${alpha(palette.primary, 0.5)}` } }}>
                  {ar ? 'الأسئلة الشائعة' : 'FAQs'}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography 
                    component="a" 
                    href="https://wa.me/201000000000" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    sx={{ 
                      display: 'inline-flex', alignItems: 'center', gap: 1.5,
                      background: alpha(palette.success, 0.1), color: palette.success,
                      border: `1px solid ${alpha(palette.success, 0.3)}`,
                      px: 3, py: 1.2, borderRadius: '50px', fontWeight: 800, fontSize: '0.95rem',
                      transition: 'all 0.3s', textDecoration: 'none',
                      '&:hover': { background: palette.success, color: '#fff', transform: 'translateY(-3px)', boxShadow: `0 8px 20px ${alpha(palette.success, 0.3)}` }
                    }}
                  >
                    <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor', boxShadow: `0 0 10px currentColor` }} />
                    {ar ? 'تواصل معنا' : 'Contact Us'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
          
          <Divider sx={{ borderColor: alpha('#fff', 0.05), mb: 4 }} />
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: palette.textSec, fontSize: '0.95rem', fontWeight: 600, opacity: 0.7 }}>
              © {new Date().getFullYear()} {ar ? 'منصة فيوتشر' : 'Future Platform'} — {ar ? 'جميع الحقوق محفوظة.' : 'All Rights Reserved.'}
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}