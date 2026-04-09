'use client';
import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Typography, Container, alpha, Card } from '@mui/material';
import { MarkEmailReadRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
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
};

export default function VerifyOtpPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, isAuthenticated } = useAuthStore();
  const ar = locale === 'ar';
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) router.replace(`/${locale}/dashboard`);
  }, [isAuthenticated, locale, router]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (val && i === 5) {
      const code = [...newOtp.slice(0, 5), val.slice(-1)].join('');
      if (code.length === 6) handleVerify(code);
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleVerify = async (code?: string) => {
    const finalCode = code || otp.join('');
    if (finalCode.length !== 6) {
      toast.error(ar ? 'أدخل الكود كاملاً (6 أرقام)' : 'Enter full 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, finalCode);
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      toast.success(ar ? 'تم التحقق بنجاح! 🎉' : 'Verified! 🎉');
      router.replace(`/${locale}/dashboard`);
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('already verified')) {
        toast.error(ar ? 'تم التحقق مسبقاً، سجّل دخولك' : 'Already verified, please login');
        router.replace(`/${locale}/login`);
      } else {
        toast.error(ar ? 'كود خاطئ، حاول مرة أخرى' : 'Invalid code, try again');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputs.current[0]?.focus(), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.resendOtp(email);
      toast.success(ar ? 'تم إرسال كود جديد' : 'New code sent');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'حدث خطأ' : 'Error'));
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', background: palette.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background Glow Effect - Expanded and softer */}
      <Box sx={{ 
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
        width: '60vw', height: '60vw', 
        background: `radial-gradient(circle, ${alpha(palette.primary, 0.05)} 0%, transparent 60%)`, 
        filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' 
      }} />

      {/* Changed maxWidth to 'sm' for better breathing room */}
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
        <Card 
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
          sx={{
            background: `linear-gradient(180deg, rgba(8, 69, 112, 0.5) 0%, rgba(10, 10, 15, 0.95) 100%)`,
            backdropFilter: 'blur(24px)',
            border: `1px solid ${alpha(palette.border, 0.2)}`,
            borderRadius: 6, 
            p: { xs: 4, sm: 6 }, // Generous padding for professional look
            textAlign: 'center',
            boxShadow: `0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 ${alpha(palette.primary, 0.2)}`,
            maxWidth: 480,
            mx: 'auto'
          }}
        >
          {/* Floating Icon Container */}
          <Box sx={{ 
            width: 88, height: 88, borderRadius: '50%', mx: 'auto', mb: 4,
            background: `linear-gradient(135deg, ${alpha(palette.primary, 0.1)}, ${alpha(palette.bg, 0.5)})`,
            border: `1px solid ${alpha(palette.primary, 0.3)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px ${alpha(palette.primary, 0.2)}, inset 0 0 20px ${alpha(palette.primary, 0.1)}`
          }}>
            <MarkEmailReadRounded sx={{ fontSize: 44, color: palette.primary }} />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.5, color: '#fff', letterSpacing: '-0.5px' }}>
            {ar ? 'تحقق من بريدك الإلكتروني' : 'Check Your Email'}
          </Typography>
          
          <Typography sx={{ color: palette.textSec, mb: 1, fontSize: '1rem', lineHeight: 1.6 }}>
            {ar ? 'لقد أرسلنا كود التحقق المكون من 6 أرقام إلى:' : 'We sent a 6-digit verification code to:'}
          </Typography>
          
          <Box sx={{ 
            display: 'inline-block', background: 'rgba(0,0,0,0.3)', 
            border: `1px solid ${alpha(palette.border, 0.2)}`,
            py: 1, px: 2.5, borderRadius: 3, mb: 5 
          }}>
            <Typography sx={{ color: palette.primary, fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.5px' }}>
              {email}
            </Typography>
          </Box>

          {/* OTP Inputs - Completely Redesigned */}
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, justifyContent: 'center', mb: 5, direction: 'ltr' }}>
            {otp.map((digit, i) => (
              <Box key={i} component={motion.input}
                whileFocus={{ y: -3 }} // Slight lift on focus
                ref={(el: HTMLInputElement | null) => { inputs.current[i] = el; }}
                value={digit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(i, e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(i, e)}
                onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                  if (pasted.length === 6) {
                    setOtp(pasted.split(''));
                    inputs.current[5]?.focus();
                    handleVerify(pasted);
                  }
                }}
                maxLength={1}
                inputMode="numeric"
                sx={{
                  width: { xs: 45, sm: 56 }, 
                  height: { xs: 55, sm: 64 }, 
                  borderRadius: '14px', // Squarish look instead of full circles
                  border: `1.5px solid ${digit ? palette.primary : alpha(palette.border, 0.2)}`,
                  background: digit ? alpha(palette.primary, 0.05) : 'rgba(0,0,0,0.4)', 
                  color: '#fff',
                  fontSize: '1.75rem', 
                  fontWeight: 800,
                  fontFamily: 'monospace', // Monospace makes numbers look sharper
                  textAlign: 'center', 
                  outline: 'none', 
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: digit ? `0 4px 15px ${alpha(palette.primary, 0.15)}` : 'none',
                  '&:focus': { 
                    borderColor: palette.primaryHover, 
                    background: alpha(palette.primary, 0.1),
                    boxShadow: `0 0 0 4px ${alpha(palette.primary, 0.2)}, 0 10px 20px ${alpha(palette.primary, 0.3)}`,
                  },
                }}
              />
            ))}
          </Box>

          <Button 
            onClick={() => handleVerify()} 
            variant="contained" fullWidth size="large"
            disabled={loading || otp.join('').length !== 6}
            sx={{ 
              py: 2, mb: 3, fontSize: '1.1rem', fontWeight: 900, color: '#000', borderRadius: 4,
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`,
              boxShadow: `0 10px 30px ${alpha(palette.primary, 0.4)}`, 
              transition: 'all 0.3s ease',
              textTransform: 'none',
              letterSpacing: '0.5px',
              '&:hover': { 
                background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})`, 
                transform: 'translateY(-2px)',
                boxShadow: `0 15px 40px ${alpha(palette.primary, 0.5)}`
              },
              '&:disabled': { 
                opacity: 0.6, 
                background: alpha(palette.border, 0.1), 
                color: palette.textSec, 
                boxShadow: 'none',
                border: `1px solid ${alpha(palette.border, 0.2)}`
              } 
            }}
          >
            {loading ? (ar ? 'جاري التحقق ...' : 'Verifying ...') : (ar ? 'تأكيد الحساب' : 'Verify Account')}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography sx={{ color: palette.textSec, fontSize: '0.95rem' }}>
              {ar ? 'لم تستلم الكود؟' : "Didn't receive the code?"}
            </Typography>
            <Button 
              onClick={handleResend} 
              variant="text"
              sx={{ 
                color: palette.primary, fontWeight: 800, fontSize: '0.95rem', p: 0.5, minWidth: 'auto',
                textTransform: 'none',
                '&:hover': { background: 'transparent', color: palette.primaryHover, textDecoration: 'underline' } 
              }}
            >
              {ar ? 'أعد الإرسال' : "Resend"}
            </Button>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}