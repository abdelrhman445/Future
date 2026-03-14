'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Container, Typography, Grid, Card, CardContent, Button, 
  CircularProgress, alpha, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, IconButton 
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  LocalOfferRounded, ViewModuleRounded, WorkspacePremiumRounded, 
  PhoneIphoneRounded, AccountBalanceWalletRounded, ContentCopyRounded, 
  WhatsApp 
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { packagesApi } from '@/lib/api';
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
  accent: '#f59e0b', // لون ذهبي للباقات
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.15 } }
};

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

export default function PackagesPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const ar = locale === 'ar';

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------- حالات الدفع ----------
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await packagesApi.list();
      setPackages(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch packages', error);
    } finally {
      setLoading(false);
    }
  };

  // فتح نافذة الدفع
  const handleOpenPayment = (pkg: any) => {
    setSelectedPkg(pkg);
    setPaymentModalOpen(true);
  };

  // تحويل للواتساب لتأكيد الدفع
  const handleConfirmPayment = () => {
    if (!selectedPkg) return;
    
    // رقم خدمة العملاء
    const customerServiceNumber = '201155242794'; 
    
    // رسالة جاهزة مسبقاً
    const message = ar 
      ? `مرحباً، لقد قمت بتحويل مبلغ ${selectedPkg.price}$ للاشتراك في [ ${selectedPkg.name} ]. أرجو تأكيد الدفع وتفعيل الباقة لحسابي.`
      : `Hello, I have transferred $${selectedPkg.price} to subscribe to the [ ${selectedPkg.name} ] package. Please confirm my payment and activate the package.`;
    
    const whatsappUrl = `https://wa.me/${customerServiceNumber}?text=${encodeURIComponent(message)}`;
    
    // فتح الواتساب في نافذة جديدة
    window.open(whatsappUrl, '_blank');
    setPaymentModalOpen(false);
  };

  // نسخ رقم التحويل
  const copyTransferNumber = () => {
    navigator.clipboard.writeText('01021483238');
    toast.success(ar ? 'تم نسخ رقم التحويل بنجاح!' : 'Transfer number copied!');
  };

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, overflow: 'hidden' }}>
      <Navbar />

      {/* خلفية مضيئة (Glow Effect) */}
      <Box sx={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '70vw', height: '40vw', background: `radial-gradient(circle, ${alpha(palette.primary, 0.15)} 0%, transparent 70%)`, filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }} component={motion.div} initial="initial" animate="animate" variants={staggerContainer}>
        
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }} component={motion.div} variants={fadeInUp}>
          <Chip 
            icon={<WorkspacePremiumRounded sx={{ color: '#000 !important' }} />} 
            label={ar ? "خطط الأسعار والباقات" : "Pricing & Packages"} 
            sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`, color: '#000', fontWeight: 900, mb: 3, px: 1, py: 2.5, fontSize: '1rem', borderRadius: 3 }} 
          />
          <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff', mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            {ar ? 'اختر الباقة المناسبة لك' : 'Choose Your Package'}
          </Typography>
          <Typography sx={{ color: palette.textSec, fontSize: '1.2rem', maxWidth: 600, mx: 'auto' }}>
            {ar ? 'استثمر في مستقبلك مع باقاتنا المتنوعة التي تتيح لك الوصول إلى أفضل الكورسات التعليمية بأسعار تنافسية.' : 'Invest in your future with our diverse packages giving you access to the best courses at competitive prices.'}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: palette.primary }} size={60} />
          </Box>
        ) : packages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 4, border: `1px dashed ${alpha(palette.border, 0.3)}` }}>
            <LocalOfferRounded sx={{ fontSize: 60, color: palette.textSec, opacity: 0.5, mb: 2 }} />
            <Typography sx={{ color: palette.textSec, fontSize: '1.2rem' }}>
              {ar ? 'لا توجد باقات متاحة حالياً. يرجى العودة لاحقاً!' : 'No packages available right now. Please check back later!'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {packages.map((pkg) => (
              <Grid item xs={12} sm={6} md={4} key={pkg.id} component={motion.div} variants={fadeInUp}>
                <Card sx={{ 
                  background: 'linear-gradient(145deg, rgba(8,69,112,0.4) 0%, rgba(10,10,15,0.9) 100%)', 
                  border: `1px solid ${alpha(palette.border, 0.3)}`, 
                  borderRadius: 5, 
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  '&:hover': { 
                    borderColor: palette.primary, 
                    transform: 'translateY(-10px)', 
                    boxShadow: `0 20px 40px ${alpha(palette.primary, 0.2)}` 
                  }
                }}>
                  {/* صورة الباقة */}
                  <Box sx={{ 
                    height: 200, 
                    width: '100%', 
                    backgroundImage: `url(${pkg.thumbnailUrl || '/placeholder.png'})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                    borderBottom: `2px solid ${palette.primary}`
                  }} />

                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 1, textTransform: 'uppercase' }}>
                      {pkg.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 0.5, mb: 3 }}>
                      <Typography sx={{ color: palette.textSec, fontSize: '1.5rem', fontWeight: 700 }}>$</Typography>
                      <Typography sx={{ color: palette.primary, fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>
                        {pkg.price}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 4, background: 'rgba(255,255,255,0.05)', p: 1.5, borderRadius: 3 }}>
                      <ViewModuleRounded sx={{ color: palette.accent }} />
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                        {pkg.coursesCount} {ar ? 'كورسات متاحة' : 'Available Courses'}
                      </Typography>
                    </Box>

                    {/* زر الاشتراك الجديد */}
                    <Button 
                      fullWidth 
                      onClick={() => handleOpenPayment(pkg)}
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
                      {ar ? 'اشتراك الآن' : 'Subscribe Now'}
                    </Button>
                    
                    {/* رابط اختياري لمشاهدة الكورسات */}
                    <Button 
                      fullWidth 
                      onClick={() => router.push(`/${locale}/courses?package=${pkg.name.toUpperCase()}`)}
                      sx={{ mt: 1, color: palette.textSec, fontSize: '0.85rem', '&:hover': { color: palette.primary, background: 'transparent' } }}
                    >
                      {/*{ar ? 'استعراض كورسات الباقة' : 'Browse included courses'}*/}
                    </Button>

                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* ==================== نافذة الدفع المنبثقة ==================== */}
      <Dialog 
        open={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)}
        PaperProps={{ 
          sx: { background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 4, minWidth: { xs: '95%', sm: 450 }, overflow: 'hidden' } 
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 900, textAlign: 'center', borderBottom: `1px solid ${alpha(palette.border, 0.3)}`, pb: 2, pt: 3, fontSize: '1.5rem' }}>
          {ar ? 'إتمام الاشتراك والدفع' : 'Complete Subscription'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 4 }}>
          <Typography sx={{ color: palette.textSec, mb: 4, textAlign: 'center', fontSize: '1.05rem', lineHeight: 1.6 }}>
            {ar ? `للاشتراك في باقة ` : `To subscribe to `} 
            <span style={{ color: palette.accent, fontWeight: 'bold' }}>{selectedPkg?.name}</span> 
            {ar ? ` بسعر ` : ` for `} 
            <span style={{ color: palette.primary, fontWeight: 'bold' }}>${selectedPkg?.price}</span>
            {ar ? `، يرجى تحويل المبلغ عبر إحدى الطرق التالية:` : `, please transfer the amount via:`}
          </Typography>

          {/* طرق الدفع (فودافون كاش وإنستا باي) */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Box sx={{ flex: 1, p: 2, background: 'rgba(230, 47, 118, 0.1)', border: '1px solid #e62f76', borderRadius: 3, textAlign: 'center', transition: '0.3s', '&:hover': { background: 'rgba(230, 47, 118, 0.2)' } }}>
              <PhoneIphoneRounded sx={{ color: '#e62f76', fontSize: 36, mb: 1 }} />
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>{ar ? 'فودافون كاش' : 'Vodafone Cash'}</Typography>
            </Box>
            <Box sx={{ flex: 1, p: 2, background: 'rgba(168, 85, 247, 0.1)', border: '1px solid #a855f7', borderRadius: 3, textAlign: 'center', transition: '0.3s', '&:hover': { background: 'rgba(168, 85, 247, 0.2)' } }}>
              <AccountBalanceWalletRounded sx={{ color: '#a855f7', fontSize: 36, mb: 1 }} />
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>{ar ? 'إنستا باي' : 'InstaPay'}</Typography>
            </Box>
          </Box>

          {/* مربع رقم التحويل */}
          <Typography sx={{ color: palette.textSec, fontSize: '0.9rem', mb: 1, fontWeight: 700 }}>{ar ? 'الرقم المخصص للتحويل:' : 'Transfer Number:'}</Typography>
          <Box sx={{ background: 'rgba(0,0,0,0.4)', p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px dashed ${palette.primary}` }}>
            <Typography sx={{ color: palette.primary, fontWeight: 900, fontSize: '1.6rem', letterSpacing: 2 }}>
              01021483238
            </Typography>
            <IconButton onClick={copyTransferNumber} sx={{ color: '#fff', bgcolor: alpha(palette.primary, 0.2), '&:hover': { bgcolor: palette.primary, color: '#000' } }}>
              <ContentCopyRounded />
            </IconButton>
          </Box>

        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1, flexDirection: 'column', gap: 1.5 }}>
          <Button 
            fullWidth
            variant="contained"
            onClick={handleConfirmPayment}
            sx={{ 
              background: '#25D366', color: '#fff', fontWeight: 900, py: 1.5, borderRadius: 3, fontSize: '1.1rem', 
              '&:hover': { background: '#1ebd57', transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(37,211,102,0.3)' }, 
              display: 'flex', gap: 1.5, transition: 'all 0.3s'
            }}
          >
            <WhatsApp fontSize="medium" />
            {ar ? 'تأكيد الدفع عبر واتساب' : 'Confirm via WhatsApp'}
          </Button>
          <Button fullWidth onClick={() => setPaymentModalOpen(false)} sx={{ color: palette.textSec, py: 1, fontWeight: 700, '&:hover': { color: '#fff', bgcolor: 'transparent' } }}>
            {ar ? 'إلغاء والتراجع' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}