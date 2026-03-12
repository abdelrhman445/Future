'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Box, Container, Typography, Button, CircularProgress, LinearProgress, alpha, Card } from '@mui/material';
import { CheckCircle, ErrorOutline, PlayCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { paymentsApi } from '@/lib/api';
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

export default function PaymentSuccessPage() {
  const { locale } = useParams() as { locale: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const ar = locale === 'ar';
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'activating' | 'success' | 'error'>('loading');
  const [courseId, setCourseId] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState(0);

  const verifyPayment = useCallback(async (retryCount = 0) => {
    if (!sessionId) { setStatus('error'); return; }

    try {
      setStatus(retryCount > 0 ? 'activating' : 'loading');
      setProgress(Math.min(90, (retryCount / 5) * 90));

      const res = await paymentsApi.verify(sessionId);
      const data = res.data.data;

      if (data.status === 'COMPLETED') {
        setProgress(100);
        setCourseId(data.courseId || data.course?.id || '');
        setCourseTitle(data.course?.title || '');
        setStatus('success');
        toast.success(ar ? 'تم تفعيل الكورس! 🎉' : 'Course activated! 🎉');
      } else if (retryCount < 6) {
        setAttempt(retryCount + 1);
        setTimeout(() => verifyPayment(retryCount + 1), 2000);
      } else {
        setCourseId(data.courseId || data.course?.id || '');
        setCourseTitle(data.course?.title || '');
        setStatus('success');
      }
    } catch (err: any) {
      if (retryCount < 3) {
        setTimeout(() => verifyPayment(retryCount + 1), 3000);
      } else {
        setStatus('error');
      }
    }
  }, [sessionId, ar]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    verifyPayment(0);
  }, [mounted, isAuthenticated, locale, router, verifyPayment]);

  return (
    <Box sx={{
      minHeight: '100vh', background: palette.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background Glow Effect */}
      <Box sx={{ 
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
        width: '60vw', height: '60vw', 
        background: `radial-gradient(circle, ${status === 'success' ? alpha(palette.success, 0.08) : status === 'error' ? alpha(palette.danger, 0.08) : alpha(palette.primary, 0.08)} 0%, transparent 70%)`, 
        filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none', transition: 'background 1s ease'
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
        <Card 
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
          sx={{ 
            background: `linear-gradient(180deg, rgba(8, 69, 112, 0.5) 0%, rgba(10, 10, 15, 0.95) 100%)`, 
            backdropFilter: 'blur(24px)',
            border: `1px solid ${status === 'success' ? alpha(palette.success, 0.3) : status === 'error' ? alpha(palette.danger, 0.3) : alpha(palette.border, 0.3)}`, 
            borderRadius: 6, 
            p: { xs: 4, sm: 6 }, 
            textAlign: 'center',
            boxShadow: `0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 ${status === 'success' ? alpha(palette.success, 0.2) : alpha(palette.primary, 0.1)}`
          }}
        >
          {/* ================= Loading / Activating ================= */}
          {(status === 'loading' || status === 'activating') && (
            <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 5 }}>
                <CircularProgress size={88} thickness={4} sx={{ color: alpha(palette.primary, 0.2) }} />
                <CircularProgress size={88} thickness={4} sx={{ color: palette.primary, position: 'absolute', left: 0, animationDuration: '3s' }} variant="indeterminate" disableShrink />
              </Box>
              
              {status === 'activating' && (
                <Box sx={{ mb: 5, width: '85%', mx: 'auto' }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8, borderRadius: 4, mb: 2,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      border: `1px solid rgba(255,255,255,0.05)`,
                      '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${palette.primary}, ${palette.success})`, borderRadius: 4 },
                    }}
                  />
                  <Typography sx={{ color: palette.textSec, fontSize: '0.9rem', fontWeight: 600 }}>
                    {ar ? `جاري تفعيل الكورس... (${attempt}/6)` : `Activating course... (${attempt}/6)`}
                  </Typography>
                </Box>
              )}
              
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.5, color: '#fff', letterSpacing: '-0.5px' }}>
                {status === 'loading'
                  ? (ar ? 'جاري التحقق من الدفع...' : 'Verifying payment...')
                  : (ar ? 'تم الدفع! جاري التفعيل...' : 'Payment received! Activating...')}
              </Typography>
              <Typography sx={{ color: palette.textSec, fontSize: '1rem' }}>
                {ar ? 'يرجى الانتظار للحظات، لا تقم بإغلاق هذه الصفحة.' : 'Please wait a moment, do not close this page.'}
              </Typography>
            </Box>
          )}

          {/* ================= Success ================= */}
          {status === 'success' && (
            <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: 'spring' }}>
              <Box component={motion.div} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} sx={{ mb: 4 }}>
                <Box sx={{
                  width: 110, height: 110, borderRadius: '50%', 
                  background: alpha(palette.success, 0.1), border: `3px solid ${alpha(palette.success, 0.8)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto',
                  boxShadow: `0 0 40px ${alpha(palette.success, 0.3)}, inset 0 0 20px ${alpha(palette.success, 0.1)}`
                }}>
                  <CheckCircle sx={{ fontSize: 64, color: palette.success }} />
                </Box>
              </Box>

              <Typography variant="h3" sx={{ fontWeight: 900, mb: 4, color: '#fff', letterSpacing: '-1px' }}>
                {ar ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
              </Typography>

              {courseTitle && (
                <Box sx={{
                  background: alpha(palette.success, 0.05), border: `1px solid ${alpha(palette.success, 0.2)}`,
                  borderRadius: 4, px: 4, py: 3, mb: 5, display: 'inline-block', minWidth: '85%' 
                }}>
                  <Typography sx={{ color: palette.success, fontWeight: 900, fontSize: '1.25rem', mb: 1 }}>🎉 {courseTitle}</Typography>
                  <Typography sx={{ color: palette.textSec, fontSize: '0.95rem' }}>
                    {ar ? 'تم تفعيل الكورس وإضافته لمكتبتك بنجاح' : 'Course activated and added to your library successfully'}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                {courseId && (
                  <Button
                    component={Link} href={`/${locale}/my-courses/${courseId}`}
                    variant="contained" size="large" 
                    sx={{
                      px: 5, py: 2, fontWeight: 900, fontSize: '1.1rem', color: '#000', 
                      background: `linear-gradient(135deg, ${palette.success}, #22c55e)`,
                      boxShadow: `0 10px 30px ${alpha(palette.success, 0.3)}`,
                      borderRadius: 4, transition: 'all 0.3s',
                      textTransform: 'none',
                      display: 'flex', alignItems: 'center', gap: 1.5, // 🔴 إجبار المسافة بين الأيقونة والنص
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 15px 40px ${alpha(palette.success, 0.5)}` }
                    }}>
                    {/* 🔴 الأيقونة والنص محطوطين جمب بعض بـ gap محترم */}
                    <PlayCircle sx={{ fontSize: 26 }} />
                    <Box component="span">{ar ? 'ابدأ التعلم الآن' : 'Start Learning Now'}</Box>
                  </Button>
                )}
                <Button
                  component={Link} href={`/${locale}/dashboard`}
                  variant="outlined" size="large"
                  sx={{ 
                    px: 5, py: 2, fontWeight: 800, borderRadius: 4, fontSize: '1.05rem',
                    borderColor: alpha(palette.border, 0.5), color: palette.textMain, 
                    textTransform: 'none',
                    '&:hover': { borderColor: palette.primary, background: alpha(palette.primary, 0.1) } 
                  }}>
                  {ar ? 'لوحة التحكم' : 'Dashboard'}
                </Button>
              </Box>
            </Box>
          )}

          {/* ================= Error ================= */}
          {status === 'error' && (
            <Box component={motion.div} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Box component={motion.div} animate={{ rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.5, delay: 0.2 }} sx={{ mb: 4 }}>
                <ErrorOutline sx={{ fontSize: 90, color: palette.danger, filter: `drop-shadow(0 0 30px ${alpha(palette.danger, 0.5)})` }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, color: '#fff', letterSpacing: '-0.5px' }}>
                {ar ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
              </Typography>
              <Typography sx={{ color: palette.textSec, mb: 4, fontSize: '1rem', lineHeight: 1.6, maxWidth: '90%', mx: 'auto' }}>
                {ar
                  ? 'لم نتمكن من التحقق من عملية الدفع. إذا تم خصم المبلغ من حسابك، يرجى التواصل مع الدعم الفني وإرسال رقم الجلسة التالي:'
                  : 'Could not verify payment. If you were charged, please contact support with this session ID:'}
              </Typography>
              <Box sx={{ 
                background: 'rgba(0,0,0,0.5)', border: `1px dashed ${alpha(palette.danger, 0.4)}`, 
                borderRadius: 3, p: 2.5, mb: 5, fontFamily: 'monospace', fontSize: '0.9rem', color: palette.danger, wordBreak: 'break-all' 
              }}>
                {sessionId}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button onClick={() => verifyPayment(0)} variant="contained" size="large"
                  sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 900, px: 5, py: 1.8, borderRadius: 4, textTransform: 'none' }}>
                  {ar ? 'إعادة المحاولة' : 'Try Again'}
                </Button>
                <Button component={Link} href={`/${locale}/dashboard`} variant="outlined" size="large"
                  sx={{ borderColor: alpha(palette.border, 0.3), color: palette.textSec, fontWeight: 800, px: 5, py: 1.8, borderRadius: 4, textTransform: 'none' }}>
                  {ar ? 'العودة للرئيسية' : 'Dashboard'}
                </Button>
              </Box>
            </Box>
          )}
        </Card>
      </Container>
    </Box>
  );
}