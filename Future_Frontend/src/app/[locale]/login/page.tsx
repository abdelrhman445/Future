'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, TextField, Typography, Container, InputAdornment, IconButton, Divider, Card } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
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

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const ar = locale === 'ar';
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data.email, data.password);
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      toast.success(ar ? 'تم تسجيل الدخول بنجاح' : 'Login successful!');
      const redirect = searchParams.get('redirect') || `/${locale}/dashboard`;
      router.push(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'حدث خطأ' : 'Login failed'));
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
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow Effects */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '40vw', background: `radial-gradient(circle, rgba(48,192,242,0.15) 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0 }} />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card sx={{ 
            p: { xs: 3, md: 4 }, 
            background: 'rgba(8, 69, 112, 0.4)', 
            backdropFilter: 'blur(15px)', 
            border: `1px solid ${palette.border}`, 
            borderRadius: 4, 
            boxShadow: `0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(48,192,242,0.1)` 
          }}>
            
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                {/* استخدام اللوجو هنا بيعطي طابع احترافي */}
                <Image src="/logo.png" alt="Future Logo" width={56} height={56} style={{ objectFit: 'contain' }} priority />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: '#fff', letterSpacing: 0.5 }}>
                {ar ? 'تسجيل الدخول' : 'Welcome Back'}
              </Typography>
              <Typography sx={{ color: palette.textSec, fontSize: '0.95rem' }}>
                {ar ? 'أهلاً بعودتك إلى منصة فيوتشر' : 'Login to continue learning on Future'}
              </Typography>
            </Box>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                {...register('email')}
                label={ar ? 'البريد الإلكتروني' : 'Email'}
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={textFieldStyles}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email sx={{ color: palette.textSec, fontSize: 20 }} /></InputAdornment>,
                }}
              />

              <TextField
                {...register('password')}
                label={ar ? 'كلمة المرور' : 'Password'}
                type={showPass ? 'text' : 'password'}
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={textFieldStyles}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock sx={{ color: palette.textSec, fontSize: 20 }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(!showPass)} edge="end" sx={{ color: palette.textSec, '&:hover': { color: palette.primaryHover } }}>
                        {showPass ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* 🔴 زر نسيت كلمة المرور تم إضافته هنا */}
              <Box sx={{ width: '100%', textAlign: ar ? 'left' : 'right', mt: -1.5 }}>
                <Typography 
                  component={Link} 
                  href={`/${locale}/forgot-password`} 
                  sx={{ 
                    color: palette.textSec, 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    textDecoration: 'none', 
                    transition: 'all 0.2s',
                    '&:hover': { color: palette.primaryHover } 
                  }}
                >
                  {ar ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </Typography>
              </Box>

              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
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
                  transition: 'all 0.3s'
                }}>
                {loading ? (ar ? 'جار ي الدخول ...' : 'Logging in ...') : (ar ? 'دخول' : 'Login')}
              </Button>

              <Divider sx={{ borderColor: 'rgba(37,154,203,0.3)', my: 2 }}>
                <Typography sx={{ color: palette.textSec, fontSize: '0.85rem', px: 1, fontWeight: 600 }}>
                  {ar ? 'أو' : 'or'}
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: palette.textSec, fontSize: '0.95rem' }}>
                  {ar ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
                  <Link href={`/${locale}/register`} style={{ color: palette.primaryHover, textDecoration: 'none', fontWeight: 800 }}>
                    {ar ? 'إنشاء حساب جديد' : 'Register Now'}
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