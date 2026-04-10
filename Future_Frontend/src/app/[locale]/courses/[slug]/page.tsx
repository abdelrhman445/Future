'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Container, Grid, Button, Chip, Typography, Accordion, AccordionSummary, 
  AccordionDetails, List, ListItem, ListItemIcon, ListItemText, Divider, alpha, 
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, ListItemButton
} from '@mui/material';
import { 
  ExpandMore, PlayCircle, Lock, AccessTime, MenuBook, Language, BarChart, 
  LocalOffer, AutoAwesomeRounded, CreditCardRounded, PhoneAndroidRounded, 
  AccountBalanceWalletRounded, WhatsApp, ContentCopyRounded, CloseRounded 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { coursesApi, paymentsApi } from '@/lib/api';
import { Course } from '@/types';
import { useAuthStore } from '@/store/auth.store';
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
  success: '#4ade80',
  danger: '#e62f76',
};

// ================= ANIMATION VARIANTS =================
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.15 } }
};

export default function CourseDetailPage() {
  const { locale, slug } = useParams() as { locale: string; slug: string };
  const router = useRouter();
  const ar = locale === 'ar';
  const { isAuthenticated } = useAuthStore();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  // 🔴 حالات نافذة الدفع المتعدد (تم جعل الافتراضي فودافون مؤقتاً)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'vodafone' | 'instapay'>('vodafone');

  // بيانات حسابات الدفع (تقدر تعدلها براحتك)
  const VODAFONE_NUMBER = "01021483238";
  const INSTAPAY_USER = "01021483238";
  const WHATSAPP_NUMBER = "+201155242795"; // رقم الواتساب بالصيغة الدولية بدون أصفار في البداية

  useEffect(() => {
    coursesApi.getBySlug(slug)
      .then((res) => setCourse(res.data.data))
      .catch(() => router.push(`/${locale}/courses`))
      .finally(() => setLoading(false));
  }, [slug, locale, router]);

  // 🔴 1. فتح نافذة الدفع
  const handleOpenPaymentModal = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login?redirect=/${locale}/courses/${slug}`);
      return;
    }
    setPaymentModalOpen(true);
  };

  // 🔴 2. الدفع عبر البطاقة البنكية
  const handleStripeCheckout = async () => {
    setBuying(true);
    try {
      const res = await paymentsApi.checkout(course!.id);
      window.location.href = res.data.data.checkoutUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'حدث خطأ' : 'Error'));
    } finally { 
      setBuying(false); 
    }
  };

  // 🔴 3. التحويل للواتساب وتأكيد الدفع اليدوي
  const handleWhatsAppConfirm = () => {
    const methodAr = paymentMethod === 'vodafone' ? 'فودافون كاش' : 'انستا باي';
    const amount = course?.salePrice || course?.originalPrice;
    const message = ar 
      ? `مرحباً، أريد تأكيد شراء كورس: *${course?.title}*\nطريقة الدفع المختارة: *${methodAr}*\nالمبلغ المطلوب: *$${amount}*\n\n(مرفق إيصال / سكرين شوت التحويل لتفعيل الكورس)`
      : `Hello, I want to confirm purchasing the course: *${course?.title}*\nPayment Method: *${paymentMethod}*\nAmount: *$${amount}*\n\n(Attached is the transfer receipt to activate my course)`;
    
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    setPaymentModalOpen(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(ar ? 'تم النسخ بنجاح!' : 'Copied successfully!');
  };

  // 🔴 4. دالة الضغط على الدرس (للذهاب لصفحة المعاينة المحمية)
  const handleLessonClick = (lesson: any) => {
    if (lesson.isFreePreview) {
      router.push(`/${locale}/preview/${course?.id}?lessonId=${lesson.id}`);
    } else {
      toast.error(ar ? '🔒 هذا الدرس متاح للمشتركين فقط. قم بشراء الكورس أولاً.' : '🔒 This lesson is for subscribers only. Please buy the course.');
    }
  };

  if (loading) return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, position: 'relative' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ height: 400, borderRadius: 5, background: 'rgba(8,69,112,0.2)', border: `1px solid rgba(37,154,203,0.1)` }} className="skeleton" />
      </Container>
    </Box>
  );

  if (!course) return null;

  const totalLessons = course.sections?.reduce((a, s) => a + s.lessons.length, 0) || 0;

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '40vw', background: `radial-gradient(circle, rgba(48,192,242,0.1) 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
      
      <Navbar />

      {/* ================= Hero Section ================= */}
      <Box sx={{ background: `linear-gradient(180deg, rgba(8,69,112,0.4) 0%, ${palette.bg} 100%)`, borderBottom: `1px solid rgba(37,154,203,0.2)`, py: { xs: 6, md: 10 }, position: 'relative', zIndex: 1 }}>
        <Container maxWidth="lg" component={motion.div} initial="initial" animate="animate" variants={staggerContainer}>
          <Grid container spacing={6} alignItems="flex-start">
            
            {/* Course Info */}
            <Grid item xs={12} md={7} component={motion.div} variants={fadeInUp}>
              <Chip label={course.packageType} sx={{ mb: 3, background: alpha(palette.primary, 0.15), color: palette.primary, fontWeight: 900, border: `1px solid ${alpha(palette.primary, 0.3)}` }} />
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 2.5, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.5px' }}>
                {course.title}
              </Typography>
              <Typography sx={{ color: palette.textSec, mb: 4, fontSize: '1.1rem', lineHeight: 1.8 }}>
                {course.shortDescription}
              </Typography>

              {/* Stats Bar */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', color: palette.textSec, fontSize: '0.95rem', fontWeight: 600 }}>
                {totalLessons > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><MenuBook sx={{ fontSize: 20, color: palette.primary }} /> {totalLessons} {ar ? 'درس' : 'lessons'}</Box>}
                {course.duration && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AccessTime sx={{ fontSize: 20, color: palette.primary }} /> {course.duration}</Box>}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Language sx={{ fontSize: 20, color: palette.primary }} /> {course.language === 'ar' ? 'العربية' : course.language}</Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BarChart sx={{ fontSize: 20, color: palette.primary }} /> {course.level}</Box>
              </Box>
            </Grid>

            {/* ================= Sticky Buy Card ================= */}
            <Grid item xs={12} md={5} component={motion.div} variants={fadeInUp}>
              <Box sx={{ 
                background: `linear-gradient(180deg, rgba(8, 69, 112, 0.5) 0%, rgba(10, 10, 15, 0.9) 100%)`, backdropFilter: 'blur(15px)',
                border: `1px solid rgba(37,154,203,0.3)`, borderRadius: 5, p: { xs: 3, md: 4 }, position: 'sticky', top: 100,
                boxShadow: `0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(48,192,242,0.1)`
              }}>
                <Box sx={{ 
                  height: 220, borderRadius: 4, mb: 4, background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : `linear-gradient(135deg, ${palette.bg}, ${palette.cardBg})`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid rgba(37,154,203,0.2)`, position: 'relative', overflow: 'hidden'
                }}>
                  {!course.thumbnailUrl && <PlayCircle sx={{ fontSize: 70, color: palette.primary, opacity: 0.8 }} />}
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 100%)' }} />
                </Box>

                <Box sx={{ mb: 4 }}>
                  {course.salePrice ? (
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: '2.8rem', fontWeight: 900, color: palette.primary, lineHeight: 1 }}>${course.salePrice}</Typography>
                      <Typography sx={{ color: palette.textSec, textDecoration: 'line-through', fontSize: '1.2rem', opacity: 0.7 }}>${course.originalPrice}</Typography>
                      <Chip label={`${Math.round((1 - course.salePrice / course.originalPrice) * 100)}% OFF`} size="small" sx={{ background: alpha('#4ade80', 0.15), color: '#4ade80', fontWeight: 900, border: `1px solid ${alpha('#4ade80', 0.3)}` }} />
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: '2.8rem', fontWeight: 900, color: palette.primary, lineHeight: 1 }}>${course.originalPrice}</Typography>
                  )}
                </Box>

                {/* 🔴 زر الشراء يفتح النافذة الآن */}
                <Button 
                  onClick={handleOpenPaymentModal} 
                  component={motion.button} whileTap={{ scale: 0.95 }}
                  variant="contained" fullWidth size="large" disabled={buying}
                  sx={{ 
                    py: 1.8, mb: 3, fontSize: '1.1rem', fontWeight: 900, color: '#000',
                    background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, 
                    boxShadow: `0 8px 25px rgba(48,192,242,0.3)`, borderRadius: 3,
                    '&:hover': { background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})`, transform: 'translateY(-2px)' },
                    transition: 'all 0.3s'
                  }}>
                  {ar ? 'اشتري الكورس الآن' : 'Buy Course Now'}
                </Button>

                <Chip icon={<LocalOffer sx={{ fontSize: '16px !important', color: palette.success }} />} label={`${ar ? 'عمولة التسويق (Affiliate)' : 'Affiliate commission'}: 15%`}
                  sx={{ width: '100%', background: 'rgba(74, 222, 128, 0.05)', color: palette.success, border: '1px dashed rgba(74, 222, 128, 0.3)', py: 2.5, fontWeight: 700, borderRadius: 3 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ================= Content Section ================= */}
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={7}>
            
            {/* Description */}
            {course.description && (
              <Box component={motion.div} initial="initial" whileInView="animate" viewport={{ once: true }} variants={fadeInUp} sx={{ mb: 7 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3, color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AutoAwesomeRounded sx={{ color: palette.primary }} /> {ar ? 'عن هذا الكورس' : 'About this Course'}
                </Typography>
                <Typography sx={{ color: palette.textSec, lineHeight: 2, fontSize: '1.05rem', whiteSpace: 'pre-line' }}>{course.description}</Typography>
              </Box>
            )}

            {/* Curriculum */}
            {course.sections && course.sections.length > 0 && (
              <Box component={motion.div} initial="initial" whileInView="animate" viewport={{ once: true }} variants={fadeInUp}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 4, color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MenuBook sx={{ color: palette.primary }} /> {ar ? 'المنهج الدراسي' : 'Curriculum'} 
                  <Typography component="span" sx={{ color: palette.textSec, fontWeight: 600, fontSize: '1.2rem', ml: 1 }}>({totalLessons} {ar ? 'درس' : 'lessons'})</Typography>
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {course.sections.map((section) => (
                    <Accordion key={section.id} defaultExpanded 
                      sx={{ background: 'rgba(8, 69, 112, 0.3)', backdropFilter: 'blur(10px)', border: `1px solid rgba(37,154,203,0.3)`, '&:before': { display: 'none' }, borderRadius: '16px !important', overflow: 'hidden', boxShadow: 'none' }}>
                      <AccordionSummary expandIcon={<ExpandMore sx={{ color: palette.primary }} />} sx={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid rgba(37,154,203,0.1)`, py: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2, alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{section.title}</Typography>
                          <Chip label={`${section.lessons.length} ${ar ? 'درس' : 'lessons'}`} size="small" sx={{ background: alpha(palette.primary, 0.1), color: palette.primary, fontWeight: 700 }} />
                        </Box>
                      </AccordionSummary>
                      
                      <AccordionDetails sx={{ pt: 2, pb: 2, px: { xs: 1, sm: 3 } }}>
                        <List dense disablePadding>
                          {section.lessons.map((lesson, idx) => (
                            <Box key={lesson.id}>
                              <ListItemButton 
                                onClick={() => handleLessonClick(lesson)}
                                sx={{ py: 1.5, px: 2, borderRadius: 2, '&:hover': { background: lesson.isFreePreview ? alpha(palette.primary, 0.1) : 'rgba(255,255,255,0.02)' }, transition: '0.2s' }}
                              >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                  {lesson.isFreePreview ? <PlayCircle sx={{ fontSize: 24, color: palette.primary }} /> : <Lock sx={{ fontSize: 22, color: 'rgba(255,255,255,0.2)' }} />}
                                </ListItemIcon>
                                <ListItemText
                                  primary={lesson.title}
                                  secondary={lesson.isFreePreview ? (ar ? 'معاينة مجانية' : 'Free Preview') : ''}
                                  primaryTypographyProps={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}
                                  secondaryTypographyProps={{ color: palette.primaryHover, fontSize: '0.8rem', fontWeight: 700, mt: 0.5 }}
                                />
                                {lesson.videoDuration && (
                                  <Typography sx={{ color: palette.textSec, fontSize: '0.85rem', fontWeight: 600, background: 'rgba(0,0,0,0.3)', px: 1.5, py: 0.5, borderRadius: 2 }}>
                                    {Math.floor(lesson.videoDuration / 60)}:{String(lesson.videoDuration % 60).padStart(2, '0')}
                                  </Typography>
                                )}
                              </ListItemButton>
                              {idx < section.lessons.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', my: 0.5 }} />}
                            </Box>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* ================= PAYMENT MODAL (نافذة طرق الدفع) ================= */}
      <Dialog 
        open={paymentModalOpen} 
        onClose={() => !buying && setPaymentModalOpen(false)}
        PaperProps={{ 
          sx: { 
            background: `linear-gradient(180deg, ${palette.cardBg}, #000)`, backdropFilter: 'blur(20px)', 
            border: `1px solid ${alpha(palette.border, 0.4)}`, borderRadius: 5, 
            minWidth: { xs: '95%', sm: 550 }, p: 1, boxShadow: `0 30px 60px rgba(0,0,0,0.8)` 
          } 
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 900, textAlign: 'center', pb: 1, fontSize: '1.4rem' }}>
          {ar ? 'اختر طريقة الدفع' : 'Select Payment Method'}
          <IconButton 
            onClick={() => setPaymentModalOpen(false)} disabled={buying} 
            sx={{ position: 'absolute', right: 15, top: 15, color: palette.textSec, background: 'rgba(255,255,255,0.05)', '&:hover': { background: alpha(palette.danger, 0.2), color: palette.danger } }}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              // 🔴 تم إيقاف سترايب مؤقتاً بالكومنت
              // { id: 'stripe', title: ar ? 'بطاقة بنكية' : 'Bank Card', icon: <CreditCardRounded fontSize="large" /> },
              { id: 'vodafone', title: ar ? 'فودافون كاش' : 'Vodafone Cash', icon: <PhoneAndroidRounded fontSize="large" /> },
              { id: 'instapay', title: ar ? 'انستا باي' : 'InstaPay', icon: <AccountBalanceWalletRounded fontSize="large" /> },
            ].map((method) => (
              <Grid item xs={6} key={method.id}>
                <Box 
                  onClick={() => setPaymentMethod(method.id as any)}
                  sx={{ 
                    background: paymentMethod === method.id ? alpha(palette.primary, 0.15) : 'rgba(0,0,0,0.3)',
                    border: `2px solid ${paymentMethod === method.id ? palette.primary : alpha(palette.border, 0.2)}`,
                    borderRadius: 4, p: 2, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s',
                    color: paymentMethod === method.id ? palette.primary : palette.textSec,
                    boxShadow: paymentMethod === method.id ? `0 0 20px ${alpha(palette.primary, 0.3)}` : 'none',
                    '&:hover': { borderColor: palette.primaryHover, color: '#fff', background: 'rgba(255,255,255,0.05)' }
                  }}
                >
                  {method.icon}
                  <Typography sx={{ fontWeight: 800, mt: 1, fontSize: {xs: '0.8rem', sm: '0.9rem'} }}>{method.title}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <AnimatePresence mode="wait">
            <Box component={motion.div} key={paymentMethod} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              
              {/* 🔴 محتوى سترايب معموله كومنت */}
              {/* paymentMethod === 'stripe' && (
                <Box sx={{ textAlign: 'center', p: 3, background: 'rgba(0,0,0,0.2)', borderRadius: 4, border: `1px dashed ${alpha(palette.border, 0.3)}` }}>
                  <Typography sx={{ color: palette.textSec, fontSize: '1rem', lineHeight: 1.8, fontWeight: 600 }}>
                    {ar ? 'سيتم تحويلك إلى بوابة الدفع الآمنة لإتمام عملية الشراء بواسطة بطاقتك البنكية، وسيتم تفعيل الكورس تلقائياً.' : 'You will be redirected to the secure gateway to complete your purchase using your bank card, and the course will be activated automatically.'}
                  </Typography>
                </Box>
              ) */}

              {(paymentMethod === 'vodafone' || paymentMethod === 'instapay') && (
                <Box sx={{ background: 'rgba(0,0,0,0.3)', borderRadius: 4, p: 3, border: `1px solid ${alpha(palette.border, 0.3)}` }}>
                  <Typography sx={{ color: '#fff', fontWeight: 800, mb: 2, fontSize: '1.1rem' }}>
                    {ar ? 'خطوات الدفع اليدوي:' : 'Manual Payment Steps:'}
                  </Typography>
                  <List dense sx={{ color: palette.textSec, mb: 2, '& li': { alignItems: 'flex-start', px: 0 } }}>
                    <ListItem><Typography>1. قم بتحويل مبلغ <b style={{color: palette.primary}}>${course.salePrice || course.originalPrice}</b> إلى الحساب التالي.</Typography></ListItem>
                    <ListItem><Typography>2. خذ لقطة شاشة (Screenshot) تؤكد نجاح التحويل.</Typography></ListItem>
                    <ListItem><Typography>3. اضغط على الزر بالأسفل لإرسال الإيصال عبر الواتساب لتفعيل الكورس.</Typography></ListItem>
                  </List>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#000', p: 2, borderRadius: 3, border: `1px dashed ${palette.primary}` }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.8rem', color: palette.textSec, mb: 0.5 }}>
                        {paymentMethod === 'vodafone' ? (ar ? 'رقم المحفظة المعتمد:' : 'Wallet Number:') : (ar ? 'عنوان انستا باي:' : 'InstaPay Address:')}
                      </Typography>
                      <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: palette.primary, fontFamily: 'monospace', letterSpacing: 1 }}>
                        {paymentMethod === 'vodafone' ? VODAFONE_NUMBER : INSTAPAY_USER}
                      </Typography>
                    </Box>
                    <IconButton onClick={() => handleCopy(paymentMethod === 'vodafone' ? VODAFONE_NUMBER : INSTAPAY_USER)} sx={{ color: '#000', background: palette.primary, '&:hover': { background: palette.primaryHover, transform: 'scale(1.1)' }, transition: 'all 0.2s' }}>
                      <ContentCopyRounded fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </Box>
          </AnimatePresence>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'center' }}>
          {paymentMethod === 'stripe' ? (
            <>{/* 🔴 زرار سترايب معموله كومنت */}
            {/* <Button 
              onClick={handleStripeCheckout} disabled={buying} variant="contained" fullWidth size="large"
              sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 900, py: 1.8, borderRadius: 3, fontSize: '1.1rem' }}
            >
              {buying ? (ar ? 'جاري التحويل...' : 'Redirecting...') : (ar ? 'متابعة الدفع الآمن' : 'Proceed to Secure Checkout')}
            </Button> */}</>
          ) : (
            /* 🔴 تم التعديل هنا لضبط مسافة أيقونة الواتساب */
            <Button 
              onClick={handleWhatsAppConfirm} 
              variant="contained" 
              fullWidth 
              size="large" 
              sx={{ 
                background: `linear-gradient(135deg, ${palette.success}, #16a34a)`, 
                color: '#fff', 
                fontWeight: 900, 
                py: 1.8, 
                borderRadius: 3, 
                fontSize: '1.1rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, // 🔴 المسافة السحرية
                textTransform: 'none',
                '&:hover': { transform: 'scale(1.02)', boxShadow: `0 10px 25px ${alpha(palette.success, 0.4)}` } 
              }}
            >
              <WhatsApp sx={{ fontSize: 26 }} />
              <Box component="span">{ar ? 'تأكيد التحويل عبر واتساب' : 'Confirm via WhatsApp'}</Box>
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}