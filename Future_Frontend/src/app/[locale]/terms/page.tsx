'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Box, Container, Grid, Typography, alpha, Stack, IconButton, Divider, Card
} from '@mui/material';
import { 
  GavelRounded, SecurityRounded, CopyrightRounded, PaymentsRounded, 
  HandshakeRounded, UpdateRounded, Facebook, Instagram, ArticleRounded,
  ArrowForwardIosRounded, ArrowBackIosRounded
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';

// ================= THEME PALETTE =================
const palette = {
  bg: '#050508', 
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

// ================= STATIC DATA (TERMS) =================
const termsData = [
  {
    id: 'introduction',
    icon: <ArticleRounded />,
    title: 'المقدمة وقبول الشروط',
    titleEn: 'Introduction & Acceptance',
    content: 'مرحباً بك في منصة فيوتشر. باستخدامك لمنصتنا أو التسجيل فيها، فإنك توافق بكامل أهليتك القانونية على الالتزام بجميع الشروط والأحكام المذكورة في هذه الصفحة. إذا كنت لا توافق على أي من هذه الشروط، يُرجى التوقف عن استخدام المنصة فوراً.',
    contentEn: 'Welcome to Future Platform. By using or registering on our platform, you legally agree to be bound by all the terms and conditions stated on this page. If you do not agree with any of these terms, please stop using the platform immediately.'
  },
  {
    id: 'accounts',
    icon: <SecurityRounded />,
    title: 'حسابات المستخدمين والتسجيل',
    titleEn: 'User Accounts & Registration',
    content: 'أنت مسؤول مسؤولية كاملة عن الحفاظ على سرية بيانات حسابك وكلمة المرور. المنصة غير مسؤولة عن أي اختراق ينتج عن إهمالك لبياناتك. يُحظر تماماً مشاركة حسابك مع أشخاص آخرين أو بيع الحساب، وفي حال اكتشاف ذلك سيتم حظر الحساب نهائياً دون استرداد أي مبالغ.',
    contentEn: 'You are entirely responsible for maintaining the confidentiality of your account credentials and password. The platform is not liable for any breach resulting from your negligence. Sharing your account with others or selling it is strictly prohibited, and if discovered, the account will be permanently banned without any refunds.'
  },
  {
    id: 'intellectual-property',
    icon: <CopyrightRounded />,
    title: 'حقوق الملكية الفكرية',
    titleEn: 'Intellectual Property Rights',
    content: 'جميع الكورسات، الفيديوهات، النصوص، والتصاميم الموجودة على منصة فيوتشر هي ملكية حصرية للمنصة ومسجلة بموجب قوانين حماية الملكية الفكرية. يُمنع منعاً باتاً تحميل، إعادة نشر، أو بيع أي محتوى خاص بالمنصة، والمخالف يعرض نفسه للمساءلة القانونية المباشرة.',
    contentEn: 'All courses, videos, texts, and designs on Future Platform are the exclusive property of the platform and are registered under intellectual property laws. Downloading, republishing, or selling any platform content is strictly prohibited, and violators will face direct legal action.'
  },
  {
    id: 'affiliate',
    icon: <HandshakeRounded />,
    title: 'نظام التسويق بالعمولة',
    titleEn: 'Affiliate Marketing System',
    content: 'توفر المنصة نظام تسويق بالعمولة (Affiliate) يتيح للمشتركين كسب العوائد المالية بناءً على الإحالات الناجحة. يُحظر استخدام طرق ترويجية مضللة أو إرسال رسائل مزعجة (Spam) لجلب الإحالات. تحتفظ المنصة بالحق في تعليق أو إلغاء أرباح أي مسوق يثبت تلاعبه أو استخدامه لطرق غير مشروعة.',
    contentEn: 'The platform provides an affiliate system allowing subscribers to earn financial returns based on successful referrals. Using misleading promotional methods or spamming to get referrals is strictly prohibited. The platform reserves the right to suspend or cancel the earnings of any marketer proven to be manipulating or using illegal methods.'
  },
  {
    id: 'payments',
    icon: <PaymentsRounded />,
    title: 'المدفوعات واسترداد الأموال',
    titleEn: 'Payments & Refunds',
    content: 'تتم جميع المعاملات المالية عبر بوابات دفع آمنة ومشفرة. نظراً لطبيعة المنتجات الرقمية (الكورسات)، لا توجد سياسة لاسترداد الأموال (No Refund) بمجرد إتمام عملية الشراء وتفعيل الاشتراك، إلا في حالة وجود خلل تقني من طرف المنصة يمنع المستخدم من الوصول للمحتوى.',
    contentEn: 'All financial transactions are processed through secure and encrypted payment gateways. Due to the nature of digital products (courses), there is a strict No Refund policy once the purchase is completed and the subscription is activated, except in cases where a technical fault on the platform prevents the user from accessing the content.'
  },
  {
    id: 'modifications',
    icon: <UpdateRounded />,
    title: 'التعديلات على الشروط',
    titleEn: 'Modifications to Terms',
    content: 'تحتفظ منصة فيوتشر بالحق في تعديل، تغيير، أو تحديث هذه الشروط في أي وقت دون إشعار مسبق. يُعتبر استمرارك في استخدام المنصة بعد أي تعديل بمثابة موافقة صريحة منك على الشروط الجديدة. يُنصح بمراجعة هذه الصفحة بشكل دوري.',
    contentEn: 'Future Platform reserves the right to modify, change, or update these terms at any time without prior notice. Your continued use of the platform following any modification constitutes your explicit acceptance of the new terms. It is advised to review this page periodically.'
  },
];

export default function TermsPage() {
  const { locale } = useParams() as { locale: string };
  const ar = locale === 'ar';
  
  const [activeSection, setActiveSection] = useState(termsData[0].id);

  // تحديث القسم النشط أثناء التمرير (ScrollSpy)
  useEffect(() => {
    const handleScroll = () => {
      const sectionOffsets = termsData.map(term => {
        const element = document.getElementById(term.id);
        return { id: term.id, offsetTop: element?.offsetTop || 0 };
      });

      const scrollPosition = window.scrollY + 200; // مسافة تعويضية للهيدر

      for (let i = sectionOffsets.length - 1; i >= 0; i--) {
        if (scrollPosition >= sectionOffsets[i].offsetTop) {
          setActiveSection(sectionOffsets[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 120, // تعويض مسافة الهيدر
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, overflowX: 'hidden' }}>
      <Navbar />

      {/* ================= HEADER SECTION ================= */}
      <Box sx={{ position: 'relative', pt: { xs: 18, md: 24 }, pb: { xs: 8, md: 10 }, borderBottom: `1px solid ${alpha(palette.border, 0.15)}`, background: `linear-gradient(to bottom, ${palette.bg}, ${alpha(palette.cardBg, 0.5)})` }}>
        {/* Glow Effects */}
        <Box sx={{ position: 'absolute', top: 0, left: '20%', width: '40vw', height: '40vw', background: `radial-gradient(circle, ${alpha(palette.primary, 0.05)} 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0 }} />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Typography sx={{ color: palette.primary, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', mb: 2, fontSize: '0.9rem' }}>
              {ar ? 'المستندات القانونية' : 'Legal Documents'}
            </Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '4rem' }, fontWeight: 900, color: '#fff', mb: 3, letterSpacing: '-1px' }}>
              {ar ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </Typography>
            <Typography sx={{ fontSize: '1.1rem', color: palette.textSec, maxWidth: 600, lineHeight: 1.8, opacity: 0.8 }}>
              {ar 
                ? 'تُنظم هذه الشروط والأحكام استخدامك لمنصة فيوتشر والخدمات المقدمة من خلالها. يُرجى قراءتها بعناية قبل البدء في استخدام المنصة.' 
                : 'These terms and conditions govern your use of the Future Platform and its services. Please read them carefully before using the platform.'}
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: palette.textSec, mt: 4, opacity: 0.5, fontWeight: 600 }}>
              {ar ? 'آخر تحديث: 1 أكتوبر 2026' : 'Last Updated: October 1, 2026'}
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* ================= CONTENT SECTION ================= */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={8}>
          
          {/* SIDEBAR (Table of Contents) - Sticky on Desktop */}
          <Grid item xs={12} md={4} lg={3}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 120 } }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, mb: 4, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {ar ? 'محتويات الصفحة' : 'Table of Contents'}
              </Typography>
              <Stack spacing={1}>
                {termsData.map((term) => {
                  const isActive = activeSection === term.id;
                  return (
                    <Box 
                      key={term.id}
                      onClick={() => scrollToSection(term.id)}
                      sx={{ 
                        display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                        cursor: 'pointer', borderRadius: 2, transition: 'all 0.3s',
                        background: isActive ? alpha(palette.primary, 0.1) : 'transparent',
                        borderLeft: ar ? 'none' : `3px solid ${isActive ? palette.primary : 'transparent'}`,
                        borderRight: ar ? `3px solid ${isActive ? palette.primary : 'transparent'}` : 'none',
                        '&:hover': { background: alpha(palette.primary, 0.05) }
                      }}
                    >
                      <Box sx={{ color: isActive ? palette.primary : palette.textSec, display: 'flex', transition: '0.3s' }}>
                        {ar ? <ArrowBackIosRounded sx={{ fontSize: 14 }} /> : <ArrowForwardIosRounded sx={{ fontSize: 14 }} />}
                      </Box>
                      <Typography sx={{ color: isActive ? '#fff' : palette.textSec, fontWeight: isActive ? 800 : 500, fontSize: '0.95rem', transition: '0.3s' }}>
                        {ar ? term.title : term.titleEn}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Grid>

          {/* MAIN CONTENT AREA */}
          <Grid item xs={12} md={8} lg={9}>
            <Stack spacing={8}>
              {termsData.map((term, i) => (
                <motion.div key={term.id} id={term.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, width: 56, height: 56, borderRadius: 3, background: alpha(palette.cardBg, 0.8), border: `1px solid ${alpha(palette.border, 0.2)}`, alignItems: 'center', justifyContent: 'center', color: palette.primary, flexShrink: 0 }}>
                      {term.icon}
                    </Box>
                    <Box>
                      <Typography variant="h2" sx={{ color: '#fff', fontWeight: 900, fontSize: { xs: '1.5rem', md: '1.8rem' }, mb: 3 }}>
                        {ar ? term.title : term.titleEn}
                      </Typography>
                      <Typography sx={{ color: palette.textSec, fontSize: '1.05rem', lineHeight: 2, opacity: 0.9 }}>
                        {ar ? term.content : term.contentEn}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* فاصل خفيف بين الأقسام ما عدا الأخير */}
                  {i !== termsData.length - 1 && (
                    <Divider sx={{ borderColor: alpha('#fff', 0.05), mt: 8 }} />
                  )}
                </motion.div>
              ))}
            </Stack>

            {/* Contact Support Card inside content */}
            <Card sx={{ mt: 10, p: { xs: 4, md: 5 }, background: alpha(palette.primary, 0.05), border: `1px solid ${alpha(palette.primary, 0.2)}`, borderRadius: 4, textAlign: 'center', backdropFilter: 'blur(10px)' }}>
              <GavelRounded sx={{ fontSize: 40, color: palette.primary, mb: 2 }} />
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', mb: 2 }}>
                {ar ? 'هل لديك استفسار قانوني؟' : 'Have a legal inquiry?'}
              </Typography>
              <Typography sx={{ color: palette.textSec, fontSize: '1rem', mb: 4, maxWidth: 500, mx: 'auto' }}>
                {ar ? 'إذا كان لديك أي أسئلة بخصوص الشروط والأحكام، فريق الدعم القانوني متاح للرد على جميع استفساراتك.' : 'If you have any questions regarding the terms and conditions, our legal support team is available to answer your inquiries.'}
              </Typography>
              <Box component="a" href="https://wa.me/201000000000" target="_blank" sx={{ display: 'inline-block', background: palette.primary, color: '#000', px: 4, py: 1.5, borderRadius: '50px', fontWeight: 800, textDecoration: 'none', transition: '0.3s', '&:hover': { background: palette.primaryHover, transform: 'translateY(-3px)', boxShadow: `0 10px 20px ${alpha(palette.primary, 0.3)}` } }}>
                {ar ? 'تواصل مع الدعم' : 'Contact Support'}
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* ================= MEGA FOOTER (Match HomePage exactly) ================= */}
      <Box sx={{ borderTop: `1px solid ${alpha(palette.border, 0.15)}`, pt: 12, pb: 4, background: `linear-gradient(to bottom, ${palette.bg}, ${palette.cardBg})` }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} sx={{ mb: 10 }}>
            
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
              
              <Stack direction="row" sx={{ gap: { xs: 4, sm: 6 } }}>
                <IconButton component="a" href="https://facebook.com" target="_blank" sx={{ width: 56, height: 56, color: palette.textSec, bgcolor: alpha('#fff', 0.03), border: `1px solid ${alpha('#fff', 0.1)}`, '&:hover': { color: '#000', bgcolor: palette.primary, borderColor: palette.primary, transform: 'translateY(-5px)', boxShadow: `0 10px 20px ${alpha(palette.primary, 0.3)}` }, transition: 'all 0.3s' }}>
                  <Facebook sx={{ fontSize: 28 }} />
                </IconButton>
                <IconButton component="a" href="https://instagram.com" target="_blank" sx={{ width: 56, height: 56, color: palette.textSec, bgcolor: alpha('#fff', 0.03), border: `1px solid ${alpha('#fff', 0.1)}`, '&:hover': { color: '#000', bgcolor: palette.primary, borderColor: palette.primary, transform: 'translateY(-5px)', boxShadow: `0 10px 20px ${alpha(palette.primary, 0.3)}` }, transition: 'all 0.3s' }}>
                  <Instagram sx={{ fontSize: 28 }} />
                </IconButton>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ fontWeight: 800, color: '#fff', mb: 4, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {ar ? 'ابدأ رحلتك الآن' : 'Start Your Journey'}
              </Typography>
              <Stack spacing={3} sx={{ mb: 6 }}>
                <Typography component={Link} href={`/${locale}/register`} sx={{ color: palette.textSec, textDecoration: 'none', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)' } }}>
                  {ar ? 'إنشاء حساب جديد' : 'Create New Account'}
                </Typography>
                <Typography component={Link} href={`/${locale}/courses`} sx={{ color: palette.textSec, textDecoration: 'none', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)' } }}>
                  {ar ? 'تصفح الكورسات' : 'Browse Courses'}
                </Typography>
              </Stack>

              <Typography sx={{ fontWeight: 800, color: '#fff', mb: 4, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {ar ? 'لديك حساب بالفعل؟' : 'Already Registered?'}
              </Typography>
              <Stack spacing={3}>
                <Typography component={Link} href={`/${locale}/login`} sx={{ color: palette.textSec, textDecoration: 'none', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)' } }}>
                  {ar ? 'تسجيل الدخول' : 'Login Here'}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ fontWeight: 800, color: '#fff', mb: 4, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {ar ? 'الدعم والمساعدة' : 'Legal & Support'}
              </Typography>
              <Stack spacing={3}>
                <Typography component={Link} href={`/${locale}/terms`} sx={{ color: palette.textSec, textDecoration: 'none', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)' } }}>
                  {ar ? 'الشروط والأحكام' : 'Terms & Conditions'}
                </Typography>
                <Typography component={Link} href={`/${locale}/privacy`} sx={{ color: palette.textSec, textDecoration: 'none', transition: 'all 0.3s', fontWeight: 600, '&:hover': { color: palette.primary, transform: ar ? 'translateX(-6px)' : 'translateX(6px)' } }}>
                  {ar ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography component="a" href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, background: alpha(palette.success, 0.1), color: palette.success, border: `1px solid ${alpha(palette.success, 0.3)}`, px: 3, py: 1.2, borderRadius: '50px', fontWeight: 800, fontSize: '0.95rem', transition: 'all 0.3s', textDecoration: 'none', '&:hover': { background: palette.success, color: '#fff', transform: 'translateY(-3px)', boxShadow: `0 8px 20px ${alpha(palette.success, 0.3)}` } }}>
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