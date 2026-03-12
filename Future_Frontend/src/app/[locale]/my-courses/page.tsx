'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Box, Container, Grid, Card, CardContent, Typography, Button, CardMedia,
  CircularProgress, LinearProgress, Stack, alpha
} from '@mui/material';
import { 
  PlayArrowRounded, MenuBookRounded, ArrowForwardIosRounded, AutoAwesomeRounded
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import Navbar from '@/components/layout/Navbar';
import { coursesApi } from '@/lib/api';

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

// ================= ANIMATION VARIANTS =================
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.15 } }
};

export default function MyCoursesPage() {
  const { locale } = useParams() as { locale: string };
  const ar = locale === 'ar';

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await coursesApi.myCourses();
      const data = res.data?.data || res.data;

      let rawData = [];
      if (Array.isArray(data)) rawData = data;
      else if (data.courses && Array.isArray(data.courses)) rawData = data.courses;
      else if (data.purchases && Array.isArray(data.purchases)) rawData = data.purchases;

      const extractedCourses = rawData.map((item: any) => {
        const courseData = item.course ? item.course : item;
        return { ...courseData, progressPercent: item.progressPercent || 0 };
      });
      
      setCourses(extractedCourses);
    } catch (err) {
      console.log("Error loading my courses:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, pb: 10, overflow: 'hidden', position: 'relative' }}>
      {/* Background Glow Effect */}
      <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '40vw', background: `radial-gradient(circle, rgba(48,192,242,0.08) 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

      <Navbar />

      {/* ================= Hero Section ================= */}
      <Box component={motion.div} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} sx={{ position: 'relative', pt: { xs: 8, md: 10 }, pb: 4, textAlign: 'center', zIndex: 1 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2.5, py: 0.8, borderRadius: 10, background: alpha(palette.primary, 0.1), border: `1px solid ${alpha(palette.primary, 0.3)}`, mb: 3 }}>
            <AutoAwesomeRounded sx={{ fontSize: 18, color: palette.primary }} />
            <Typography sx={{ color: palette.primary, fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
              {ar ? 'مرحباً بك مجدداً' : 'Welcome Back'}
            </Typography>
          </Box>
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, color: '#fff', fontSize: { xs: '2.5rem', md: '3.5rem' }, letterSpacing: '-1px' }}>
            {ar ? 'متابعة التعلم' : 'Continue Learning'}
          </Typography>
        </Container>
      </Box>

      {/* ================= Courses Grid ================= */}
      <Container maxWidth="lg" sx={{ pt: 2, position: 'relative', zIndex: 1 }} component={motion.div} initial="initial" animate="animate" variants={staggerContainer}> 
        <Grid container spacing={4}>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Box sx={{ height: 380, borderRadius: 5, background: 'rgba(8,69,112,0.2)', border: `1px solid rgba(37,154,203,0.1)` }} className="skeleton" />
              </Grid>
            ))
          ) : courses.length > 0 ? (
            courses.map((course: any) => (
              <Grid item xs={12} sm={6} md={4} key={course.id} component={motion.div} variants={fadeInUp}>
                <Card
                  sx={{
                    background: `linear-gradient(180deg, rgba(8, 69, 112, 0.5) 0%, rgba(10, 10, 15, 0.9) 100%)`,
                    backdropFilter: 'blur(12px)',
                    border: `1px solid rgba(37,154,203,0.3)`,
                    borderRadius: 5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      borderColor: palette.primary,
                      boxShadow: `0 20px 40px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(48,192,242,0.2)`,
                      '& .course-image': { transform: 'scale(1.08)' },
                      '& .action-btn': { 
                        background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})`, 
                        color: '#000',
                        boxShadow: `0 10px 25px rgba(48,192,242,0.4)`,
                        transform: 'scale(1.02)'
                      },
                      '& .arrow-icon': { transform: ar ? 'translateX(-5px)' : 'translateX(5px)' }
                    }
                  }}
                >
                  {/* Image Holder */}
                  <Box sx={{ position: 'relative', overflow: 'hidden', height: 190 }}>
                    <CardMedia 
                      className="course-image"
                      component="div"
                      sx={{ 
                        height: '100%', 
                        transition: 'transform 0.8s ease',
                        background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : `linear-gradient(135deg, ${palette.bg}, ${palette.cardBg})`,
                      }}
                    />
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 100%)' }} />
                    
                    {/* Progress Indicator */}
                    <Box sx={{ position: 'absolute', bottom: 15, left: 20, right: 20 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                        <Typography sx={{ fontSize: '0.8rem', color: palette.textMain, fontWeight: 900 }}>{Math.round(course.progressPercent || 0)}%</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: palette.textSec, fontWeight: 600 }}>{ar ? 'مكتمل' : 'Completed'}</Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={course.progressPercent || 0} 
                        sx={{ 
                          height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': { background: palette.primary, borderRadius: 2 }
                        }} 
                      />
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#fff', mb: 1.5, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.title}
                    </Typography>
                    
                    <Typography sx={{ color: palette.textSec, fontSize: '0.9rem', mb: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.shortDescription || (ar ? 'لا يوجد وصف متاح' : 'No description available')}
                    </Typography>

                    {/* Action Button */}
                    <Button
                      className="action-btn"
                      fullWidth
                      component={Link}
                      href={`/${locale}/my-courses/${course.id}`}
                      sx={{
                        mt: 'auto', py: 1.8, borderRadius: 3, fontWeight: 900, fontSize: '1rem',
                        textTransform: 'none', background: alpha(palette.primary, 0.1), color: palette.primary,
                        border: `1px solid ${alpha(palette.primary, 0.3)}`,
                        transition: 'all 0.3s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5
                      }}
                    >
                      <PlayArrowRounded sx={{ fontSize: 24 }} />
                      {ar ? 'متابعة التعلم' : 'Resume Learning'}
                      <ArrowForwardIosRounded className="arrow-icon" sx={{ fontSize: 14, transition: 'transform 0.3s' }} />
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12} component={motion.div} variants={fadeInUp}>
              <Box sx={{ 
                textAlign: 'center', py: 10, borderRadius: 5, 
                border: `2px dashed rgba(37,154,203,0.3)`, background: 'rgba(8,69,112,0.2)' 
              }}>
                <MenuBookRounded sx={{ fontSize: 70, color: palette.textSec, mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" sx={{ color: '#fff', mb: 1.5, fontWeight: 900 }}>
                  {ar ? 'مكتبتك فارغة حالياً' : 'Your library is empty'}
                </Typography>
                <Typography sx={{ color: palette.textSec, mb: 4 }}>
                  {ar ? 'قم بتصفح الكورسات المتاحة وابدأ رحلتك التعليمية' : 'Explore available courses and start your learning journey'}
                </Typography>
                <Button 
                  component={Link} href={`/${locale}/courses`}
                  variant="contained" 
                  sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', px: 5, py: 1.8, fontWeight: 900, borderRadius: 3, '&:hover': { background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})` } }}
                >
                  {ar ? 'تصفح الكورسات' : 'Explore Courses'}
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}