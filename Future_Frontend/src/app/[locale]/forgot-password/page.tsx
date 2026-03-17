'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Container, Card, Typography, TextField, Button, CircularProgress, InputAdornment, IconButton, Stack } from '@mui/material';
import { EmailOutlined, ArrowBack, LockReset, Security, Visibility, VisibilityOff } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

// ================= THEME PALETTE =================
const palette = {
  bg: '#0a0a0f', cardBg: '#084570', cardFill: '#062d49', border: '#259acb',
  borderDark: 'rgba(37,154,203,0.3)', primary: '#30c0f2', primaryHover: '#83d9f7',
  textMain: '#a8eff9', textSec: '#a0ddf1', glow: 'rgba(48,192,242,0.15)', danger: '#e62f76'
};

const inputStyle = (ar: boolean, isCenter = false) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: palette.cardFill, borderRadius: 2, color: '#fff',
    '& fieldset': { borderColor: palette.borderDark },
    '&:hover fieldset': { borderColor: palette.primary },
    '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2 },
    '& .MuiInputBase-input': { 
      px: 2, 
      py: 1.5, 
      textAlign: isCenter ? 'center' : (ar ? 'right' : 'left'),
      letterSpacing: isCenter ? 8 : 'normal',
      fontSize: isCenter ? '1.2rem' : '1rem',
      fontWeight: isCenter ? 'bold' : 'normal'
    } 
  },
});

export default function ForgotPasswordFlow() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const ar = locale === 'ar';
  
  // --- States ---
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP, 3: Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ================= HANDLERS =================
  
  // الخطوة 1: إرسال الإيميل
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error(ar ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success(ar ? 'تم إرسال كود التحقق بنجاح 📩' : 'OTP sent successfully 📩');
      setStep(2); // النقل لخطوة הـ OTP
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  // 🔴 الخطوة 2: التحقق الحقيقي من הـ OTP مع السيرفر
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return toast.error(ar ? 'يرجى إدخال كود صحيح' : 'Please enter a valid OTP');
    setLoading(true);
    try {
      // تم تفعيل الاتصال الحقيقي بالباك إند هنا 👇
      await authApi.verifyResetOtp(email, otp); 
      
      toast.success(ar ? 'كود التحقق صحيح ✅' : 'OTP verified ✅');
      setStep(3); // النقل لخطوة الباسورد فقط لو الباك إند وافق
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'كود التحقق غير صحيح' : 'Invalid OTP'));
    } finally {
      setLoading(false);
    }
  };

  // الخطوة 3: تعيين الباسورد الجديد
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.newPassword || !passwords.confirmPassword) return toast.error(ar ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error(ar ? 'كلمة المرور غير متطابقة' : 'Passwords do not match');
    if (passwords.newPassword.length < 8) return toast.error(ar ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 chars');
    
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword: passwords.newPassword });
      toast.success(ar ? 'تم تغيير كلمة المرور بنجاح 🔓' : 'Password reset successfully 🔓');
      router.push(`/${locale}/login`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Failed to reset password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vw', background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0 }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Card sx={{ background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 4, p: { xs: 4, md: 5 }, boxShadow: `0 20px 50px rgba(0,0,0,0.5)`, backdropFilter: 'blur(10px)' }} dir={ar ? 'rtl' : 'ltr'}>
            
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', background: 'rgba(48,192,242,0.1)', border: `1px solid ${palette.borderDark}`, mb: 2 }}>
                {step === 1 ? <EmailOutlined sx={{ fontSize: 40, color: palette.primary }} /> : <LockReset sx={{ fontSize: 40, color: palette.primary }} />}
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff', mb: 1 }}>
                {step === 1 && (ar ? 'هل نسيت كلمة المرور؟' : 'Forgot Password?')}
                {step === 2 && (ar ? 'أدخل كود التحقق' : 'Enter OTP Code')}
                {step === 3 && (ar ? 'تعيين كلمة مرور جديدة' : 'Create New Password')}
              </Typography>
              <Typography sx={{ color: palette.textSec, fontSize: '0.95rem' }}>
                {step === 1 && (ar ? 'أدخل بريدك الإلكتروني وسنرسل لك رمزاً للتحقق.' : 'Enter your email to receive an OTP.')}
                {step === 2 && (ar ? `أدخل الرمز المكون من 6 أرقام المرسل إلى: ${email}` : `Enter the 6-digit code sent to: ${email}`)}
                {step === 3 && (ar ? 'قم بتعيين كلمة مرور قوية لحماية حسابك.' : 'Set a strong password to secure your account.')}
              </Typography>
            </Box>

            <AnimatePresence mode="wait">
              {/* ================= STEP 1: EMAIL ================= */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <form onSubmit={handleSendEmail}>
                    <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left', fontSize: '0.95rem' }}>{ar ? 'البريد الإلكتروني' : 'Email Address'}</Typography>
                    <TextField fullWidth placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ ...inputStyle(ar), mb: 4 }} />
                    <Button type="submit" fullWidth disabled={loading} variant="contained" sx={{ bgcolor: palette.primary, color: '#000', fontWeight: 900, py: 1.5, fontSize: '1.1rem', borderRadius: 2.5, '&:hover': { bgcolor: palette.primaryHover }, boxShadow: `0 8px 25px rgba(48,192,242,0.3)` }}>
                      {loading ? <CircularProgress size={26} sx={{color:'#000'}}/> : (ar ? 'إرسال الرمز' : 'Send OTP')}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ================= STEP 2: OTP ================= */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <form onSubmit={handleVerifyOtp}>
                    <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: 'center', fontSize: '0.95rem' }}>{ar ? 'رمز التحقق (OTP)' : 'OTP Code'}</Typography>
                    <TextField fullWidth placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} sx={{ ...inputStyle(ar, true), mb: 4 }} inputProps={{ maxLength: 6 }} />
                    <Button type="submit" fullWidth disabled={loading || otp.length < 6} variant="contained" sx={{ bgcolor: palette.primary, color: '#000', fontWeight: 900, py: 1.5, fontSize: '1.1rem', borderRadius: 2.5, '&:hover': { bgcolor: palette.primaryHover }, boxShadow: `0 8px 25px rgba(48,192,242,0.3)` }}>
                      {loading ? <CircularProgress size={26} sx={{color:'#000'}}/> : (ar ? 'تحقق ومتابعة' : 'Verify & Continue')}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* ================= STEP 3: RESET PASSWORD ================= */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <form onSubmit={handleResetPassword}>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left', fontSize: '0.95rem' }}>{ar ? 'كلمة المرور الجديدة' : 'New Password'}</Typography>
                        <TextField fullWidth type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} sx={inputStyle(ar)} 
                          InputProps={{ 
                            startAdornment: <InputAdornment position="start"><Security sx={{color: palette.borderDark, ml: ar ? 1 : 0, mr: ar ? 0 : 1}} /></InputAdornment>,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{color: palette.textSec}}>
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }} />
                      </Box>
                      <Box>
                        <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left', fontSize: '0.95rem' }}>{ar ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Typography>
                        <TextField fullWidth type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} sx={inputStyle(ar)} 
                          InputProps={{ startAdornment: <InputAdornment position="start"><Security sx={{color: palette.borderDark, ml: ar ? 1 : 0, mr: ar ? 0 : 1}} /></InputAdornment> }} />
                      </Box>
                      <Button type="submit" fullWidth disabled={loading} variant="contained" sx={{ bgcolor: palette.primary, color: '#000', fontWeight: 900, py: 1.5, mt: 2, fontSize: '1.1rem', borderRadius: 2.5, '&:hover': { bgcolor: palette.primaryHover }, boxShadow: `0 8px 25px rgba(48,192,242,0.3)` }}>
                        {loading ? <CircularProgress size={26} sx={{color:'#000'}}/> : (ar ? 'حفظ وتسجيل الدخول' : 'Save & Login')}
                      </Button>
                    </Stack>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* زر العودة (يظهر فقط في الخطوة الأولى لتجنب تشتيت المستخدم) */}
            {step === 1 && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button component={Link} href={`/${locale}/login`} sx={{ color: palette.textSec, textTransform: 'none', fontWeight: 'bold', '&:hover': { color: palette.primary } }}>
                  <ArrowBack sx={{ fontSize: 18, mr: ar ? 0 : 1, ml: ar ? 1 : 0, transform: ar ? 'rotate(180deg)' : 'none' }} />
                  {ar ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Button>
              </Box>
            )}

          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}