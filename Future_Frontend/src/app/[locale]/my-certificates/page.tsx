'use client';
// ══════════════════════════════════════════════════════════
// الملف: src/app/[locale]/my-certificates/page.tsx
// صفحة "شهاداتي" - تصميم محسن ومسافات مريحة وخلفية فخمة
// ══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Card, CardMedia, CardContent,
  Button, Chip, CircularProgress, Grid, Stack, Divider
} from '@mui/material';
import { 
  EmojiEvents, OpenInNew, FileDownload, 
  Verified, AccessTime, CalendarMonth 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion'; 
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/auth.store';
import { certificatesApi } from '@/lib/api';
import toast from 'react-hot-toast';

// الباليت المتوافقة مع الهوية البصرية بنظافة
const palette = {
  bg: '#0a0a0f',
  cardBg: 'rgba(12, 20, 35, 0.7)', // Glassmorphism أنضف وأشيك
  border: 'rgba(37, 154, 203, 0.2)',
  primary: '#30c0f2',
  textMain: '#a8eff9',
  textSec: '#a0ddf1',
  gold: '#c8a96e',
  goldGlow: 'rgba(200, 169, 110, 0.15)',
};

interface MyCert {
  certNumber:   string;
  courseTitle:  string;
  thumbnailUrl: string | null;
  duration:     number | null;
  issuedAt:     string;
  viewUrl:      string;
}

export default function MyCertificatesPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const ar = locale === 'ar';

  const [certs, setCerts]     = useState<MyCert[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) { router.push(`/${locale}/login`); return; }

    certificatesApi.getMyCertificates()
      .then(r => setCerts(r.data.data || []))
      .catch(() => toast.error(ar ? 'خطأ في تحميل الشهادات' : 'Error loading certificates'))
      .finally(() => setLoading(false));
  }, [mounted, isAuthenticated, locale, router]);

  if (!mounted || loading) return (
    <Box sx={{ minHeight:'100vh', background:palette.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <CircularProgress size={50} sx={{ color:palette.primary }} />
    </Box>
  );

  return (
    <Box sx={{ minHeight:'100vh', background:palette.bg, pb:10, position: 'relative', overflow: 'hidden' }}>
      <Navbar />
      
      {/* 🌌 الخلفية: Glow Effects ناعمة جداً عشان متعملش زحمة */}
      <Box sx={{ 
        position: 'absolute', top: -200, right: -100, width: 600, height: 600, 
        background: `radial-gradient(circle, rgba(48,192,242,0.06) 0%, transparent 60%)`, filter: 'blur(90px)', zIndex: 0 
      }} />
      <Box sx={{ 
        position: 'absolute', bottom: -200, left: -100, width: 600, height: 600, 
        background: `radial-gradient(circle, rgba(200,169,110,0.05) 0%, transparent 60%)`, filter: 'blur(90px)', zIndex: 0 
      }} />

      <Container maxWidth="lg" sx={{ py: 8, position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          {/* 📏 وسعنا المسافة هنا بـ gap={4} */}
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={4} alignItems="center" sx={{ mb: 8, textAlign: { xs: 'center', sm: 'left' } }}>
            <Box sx={{ 
              p: 2.5, borderRadius: '24px', background: 'rgba(200, 169, 110, 0.05)',
              border: `1px solid rgba(200, 169, 110, 0.3)`, boxShadow: `0 0 30px ${palette.goldGlow}`
            }}>
              <EmojiEvents sx={{ fontSize: 56, color: palette.gold }} />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight:900, color:palette.textMain, mb: 1.5, letterSpacing: -0.5 }}>
                {ar ? 'إنجازاتك التعليمية' : 'Your Achievements'}
              </Typography>
              <Typography sx={{ color:palette.textSec, fontSize:'1.15rem', opacity: 0.8, fontWeight: 500 }}>
                {ar ? `لديك ${certs.length} شهادة موثقة في حسابك` : `You have ${certs.length} verified certificates`}
              </Typography>
            </Box>
          </Stack>
        </motion.div>

        {certs.length === 0 ? (
          <Card sx={{ 
            p: 10, textAlign:'center', background: 'rgba(255,255,255,0.02)',
            border: `1px dashed ${palette.border}`, borderRadius: 8, backdropFilter: 'blur(10px)'
          }}>
            <Typography variant="h5" sx={{ color:palette.textMain, mb:3, fontWeight: 700 }}>
              {ar ? 'ابدأ رحلة النجاح اليوم!' : 'Start your success journey today!'}
            </Typography>
            <Button 
              variant="contained" size="large" onClick={() => router.push(`/${locale}/courses`)}
              sx={{ background: palette.primary, color: '#000', fontWeight: 900, px: 6, borderRadius: 3 }}
            >
              {ar ? 'تصفح الكورسات' : 'Browse Courses'}
            </Button>
          </Card>
        ) : (
          <Grid container spacing={4}>
            <AnimatePresence>
              {certs.map((cert, index) => (
                <Grid item xs={12} sm={6} md={4} key={cert.certNumber}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card sx={{
                      background: palette.cardBg,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 6,
                      overflow: 'hidden',
                      backdropFilter: 'blur(16px)',
                      transition: 'all 0.4s ease',
                      '&:hover': { 
                        transform:'translateY(-8px)', 
                        borderColor: palette.primary,
                        boxShadow: `0 25px 50px rgba(0,0,0,0.4), 0 0 25px rgba(48,192,242,0.15)` 
                      }
                    }}>
                      <Box sx={{ position: 'relative' }}>
                        {cert.thumbnailUrl ? (
                          <CardMedia component="img" height="200" image={cert.thumbnailUrl} alt={cert.courseTitle} />
                        ) : (
                          <Box sx={{ height: 200, background: '#0a101d', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <EmojiEvents sx={{ fontSize: 80, color: 'rgba(200, 169, 110, 0.15)' }} />
                          </Box>
                        )}
                      </Box>

                      <CardContent sx={{ p: 3.5 }}>
                        {/* 🌟 نقل كلمة VERIFIED هنا بشكل شيك جداً كختم اعتماد */}
                        <Box sx={{ mb: 2, display: 'flex' }}>
                          <Chip 
                            icon={<Verified sx={{ fontSize: '16px !important', color: `${palette.gold} !important` }} />}
                            label="VERIFIED CERTIFICATE" 
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(200, 169, 110, 0.1)', color: palette.gold,
                              fontWeight: 900, fontSize: '0.7rem', border: `1px solid rgba(200, 169, 110, 0.3)`,
                              letterSpacing: 0.5, px: 0.5
                            }} 
                          />
                        </Box>

                        <Typography sx={{ 
                          color:palette.textMain, fontWeight:800, fontSize:'1.15rem',
                          mb: 3, lineHeight: 1.5, minHeight: 56,
                        }}>
                          {cert.courseTitle}
                        </Typography>

                        <Stack gap={2.5} sx={{ mb: 4 }}>
                          <Stack direction="row" alignItems="center" gap={2}>
                             <Verified sx={{ fontSize: 22, color: palette.primary }} />
                             <Typography sx={{ color: palette.primary, fontWeight: 700, fontSize: '0.95rem', pt: 0.5 }}>
                                {cert.certNumber}
                             </Typography>
                          </Stack>

                          <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                          <Stack direction="row" alignItems="center" gap={2}>
                            <CalendarMonth sx={{ fontSize: 22, color: palette.textSec, opacity: 0.7 }} />
                            <Typography sx={{ color: palette.textSec, fontSize: '0.95rem', pt: 0.5 }}>
                              {new Date(cert.issuedAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })}
                            </Typography>
                          </Stack>

                          {cert.duration && (
                            <Stack direction="row" alignItems="center" gap={2}>
                              <AccessTime sx={{ fontSize: 22, color: palette.textSec, opacity: 0.7 }} />
                              <Typography sx={{ color: palette.textSec, fontSize: '0.95rem', pt: 0.5 }}>
                                {cert.duration} {ar ? 'ساعة معتمدة' : 'Accredited Hours'}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Button
                              fullWidth variant="outlined"
                              onClick={() => router.push(`/${locale}/certificates/${cert.certNumber}`)}
                              sx={{ 
                                borderColor: 'rgba(255,255,255,0.15)', color: '#fff', 
                                fontWeight: 800, borderRadius: 3, py: 1.2,
                                display: 'flex', alignItems: 'center', gap: 2.5, // 📏 وسعنا المسافة بـ gap: 2.5 صريح
                                '&:hover': { borderColor: palette.primary, bgcolor: 'rgba(48,192,242,0.1)' }
                              }}
                            >
                              <OpenInNew fontSize="small" />
                              <span>{ar ? 'عرض' : 'View'}</span>
                            </Button>
                          </Grid>
                          <Grid item xs={6}>
                            <Button
                              fullWidth variant="contained"
                              onClick={() => window.open(`/${locale}/certificates/${cert.certNumber}?print=1`, '_blank')}
                              sx={{ 
                                background: palette.gold, color: '#000', 
                                fontWeight: 800, borderRadius: 3, py: 1.2,
                                display: 'flex', alignItems: 'center', gap: 2.5, // 📏 وسعنا المسافة بـ gap: 2.5 صريح
                                '&:hover': { background: '#e8c98e', boxShadow: `0 4px 20px ${palette.goldGlow}` }
                              }}
                            >
                              <FileDownload fontSize="small" />
                              <span>{ar ? 'تحميل' : 'Save'}</span>
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}
      </Container>
    </Box>
  );
}