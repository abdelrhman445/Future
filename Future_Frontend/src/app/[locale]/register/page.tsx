'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, TextField, Typography, Container, InputAdornment, Grid, Card, Checkbox, alpha } from '@mui/material';
import { Email, Lock, Person, CardGiftcard, Phone } from '@mui/icons-material'; // 🔴 إضافة أيقونة الهاتف
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { motion } from 'framer-motion';

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

// 🔴 إضافة حقل رقم الهاتف في الـ Schema
const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(), // 🔴 الحقل الجديد
  password: z.string().min(8),
  referralCode: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const ar = locale === 'ar';
  
  const [loading, setLoading] = useState(false);
  // 🔴 ستيت جديدة للتحكم في الموافقة على الشروط
  const [agreedToTerms, setAgreedToTerms] = useState(false); 
  
  const defaultRef = searchParams.get('ref') || '';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { referralCode: defaultRef },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.register(data);
      toast.success(ar ? 'تم إنشاء الحساب! تحقق من بريدك' : 'Account created! Check your email');
      router.push(`/${locale}/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'حدث خطأ' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  // ================= STYLES FOR TEXTFIELDS =================
  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 2,
      '& fieldset': { borderColor: palette.border },
      '&:hover fieldset': { borderColor: palette.primaryHover },
      '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2 },
    },
    '& .MuiInputLabel-root': { color: palette.textSec },
    '& .MuiInputLabel-root.Mui-focused': { color: palette.primary },
    '& .MuiFormHelperText-root': { color: palette.danger },
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: palette.bg, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      py: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow Effects */}
      <Box sx={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '40vw', background: `radial-gradient(circle, rgba(48,192,242,0.12) 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0 }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          
          <Card sx={{ 
            p: { xs: 3, md: 5 }, 
            background: 'rgba(8, 69, 112, 0.4)', 
            backdropFilter: 'blur(15px)', 
            border: `1px solid ${palette.border}`, 
            borderRadius: 4, 
            boxShadow: `0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(48,192,242,0.1)` 
          }}>
            
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Image src="/logo.png" alt="Future Logo" width={56} height={56} style={{ objectFit: 'contain' }} priority />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: '#fff', letterSpacing: 0.5 }}>
                {ar ? 'إنشاء حساب جديد' : 'Create Account'}
              </Typography>
              <Typography sx={{ color: palette.textSec, fontSize: '0.95rem' }}>
                {ar ? 'انضم لمنصة فيوتشر وابدأ رحلة التعلم' : 'Join Future and start your learning journey'}
              </Typography>
            </Box>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    {...register('firstName')} 
                    label={ar ? 'الاسم الأول' : 'First Name'} 
                    fullWidth 
                    error={!!errors.firstName}
                    sx={textFieldStyles}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: palette.textSec, fontSize: 20 }} /></InputAdornment> }} 
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    {...register('lastName')} 
                    label={ar ? 'الاسم الأخير' : 'Last Name'} 
                    fullWidth 
                    error={!!errors.lastName}
                    sx={textFieldStyles}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: palette.textSec, fontSize: 20 }} /></InputAdornment> }} 
                  />
                </Grid>
              </Grid>

              <TextField 
                {...register('email')} 
                label={ar ? 'البريد الإلكتروني' : 'Email'} 
                type="email" 
                fullWidth 
                error={!!errors.email}
                sx={textFieldStyles}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: palette.textSec, fontSize: 20 }} /></InputAdornment> }} 
              />

              {/* 🔴 حقل رقم الهاتف المضاف حديثًا */}
              <TextField 
                {...register('phone')} 
                label={ar ? 'رقم الهاتف' : 'Phone Number'} 
                type="tel" 
                fullWidth 
                error={!!errors.phone}
                sx={textFieldStyles}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: palette.textSec, fontSize: 20 }} /></InputAdornment> }} 
              />

              <TextField 
                {...register('password')} 
                label={ar ? 'كلمة المرور' : 'Password'} 
                type="password" 
                fullWidth 
                error={!!errors.password}
                helperText={ar ? 'على الأقل 8 أحرف' : 'At least 8 characters'}
                sx={textFieldStyles}
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: palette.textSec, fontSize: 20 }} /></InputAdornment> }} 
              />

              <TextField 
                {...register('referralCode')} 
                label={ar ? 'كود الإحالة (اختياري)' : 'Referral Code (optional)'} 
                fullWidth
                sx={textFieldStyles}
                InputProps={{ startAdornment: <InputAdornment position="start"><CardGiftcard sx={{ color: palette.textSec, fontSize: 20 }} /></InputAdornment> }} 
              />

              {/* الجزء الخاص: الموافقة على الشروط والأحكام وسياسة الخصوصية */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1 }}>
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  sx={{
                    color: alpha(palette.border, 0.7),
                    p: 0,
                    mr: ar ? 0 : 1.5,
                    ml: ar ? 1.5 : 0,
                    mt: 0.3,
                    '&.Mui-checked': { color: palette.primary },
                  }}
                />
                <Typography sx={{ color: palette.textSec, fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {ar ? 'لقد قرأت وأوافق تماماً على ' : 'I have read and fully agree to the '}
                  <Link href={`/${locale}/terms`} target="_blank" style={{ color: palette.primaryHover, textDecoration: 'underline', fontWeight: 700 }}>
                    {ar ? 'الشروط والأحكام' : 'Terms & Conditions'}
                  </Link>
                  {ar ? ' و ' : ' and '}
                  <Link href={`/${locale}/privacy`} target="_blank" style={{ color: palette.primaryHover, textDecoration: 'underline', fontWeight: 700 }}>
                    {ar ? 'سياسة الخصوصية' : 'Privacy Policy'}
                  </Link>
                  {ar ? ' الخاصة بالمنصة.' : '.'}
                </Typography>
              </Box>

              {/* الزرار اتربط بالـ State، ومش هيشتغل غير لو علم على الموافقة */}
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                size="large" 
                disabled={loading || !agreedToTerms}
                sx={{ 
                  py: 1.5, 
                  mt: 1,
                  fontSize: '1.1rem', 
                  fontWeight: 800,
                  color: '#000',
                  background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, 
                  boxShadow: `0 8px 25px rgba(48,192,242,0.3)`, 
                  borderRadius: 2,
                  '&:hover': { background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})`, transform: 'translateY(-2px)', boxShadow: `0 12px 30px rgba(48,192,242,0.4)` },
                  '&:disabled': { background: alpha(palette.border, 0.2), color: alpha('#fff', 0.4), boxShadow: 'none' },
                  transition: 'all 0.3s'
                }}>
                {loading ? (ar ? 'جاري الإنشاء ...' : 'Creating ...') : (ar ? 'إنشاء الحساب' : 'Create Account')}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography sx={{ color: palette.textSec, fontSize: '0.95rem' }}>
                  {ar ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                  <Link href={`/${locale}/login`} style={{ color: palette.primaryHover, textDecoration: 'none', fontWeight: 800 }}>
                    {ar ? 'تسجيل الدخول' : 'Login Here'}
                  </Link>
                </Typography>
              </Box>
            </Box>

          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}