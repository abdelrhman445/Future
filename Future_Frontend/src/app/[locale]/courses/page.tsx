'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Box, Container, Grid, Card, CardContent, CardMedia, Chip, Typography, TextField, InputAdornment, ToggleButton, ToggleButtonGroup, alpha } from '@mui/material';
import { Search, PlayCircle, AccessTime, MenuBook, AutoAwesomeRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { coursesApi } from '@/lib/api';
import { Course } from '@/types';

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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const PACKAGES = ['ALL', 'BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE'];

export default function CoursesPage() {
  const { locale } = useParams() as { locale: string };
  const ar = locale === 'ar';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pkg, setPkg] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    const params = pkg !== 'ALL' ? { package: pkg } : {};
    coursesApi.list(params)
      .then((res) => setCourses(res.data.data.courses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pkg]);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.shortDescription || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, position: 'relative', overflow: 'hidden' }}>
      {/* Background Glow Effect */}
      <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '40vw', background: `radial-gradient(circle, rgba(48,192,242,0.08) 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
      
      <Navbar />

      {/* Header Section */}
      <Box sx={{ 
        background: `linear-gradient(180deg, rgba(8,69,112,0.3) 0%, ${palette.bg} 100%)`, 
        borderBottom: `1px solid rgba(37,154,203,0.2)`, 
        py: { xs: 6, md: 8 }, 
        position: 'relative', zIndex: 1 
      }}>
        <Container maxWidth="lg" component={motion.div} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <AutoAwesomeRounded sx={{ color: palette.primary, fontSize: 32 }} />
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
              {ar ? 'جميع الكورسات' : 'All Courses'}
            </Typography>
          </Box>
          <Typography sx={{ color: palette.textSec, mb: 4, fontSize: '1.1rem', fontWeight: 600, ml: 6 }}>
            {ar ? `استكشف ${courses.length} كورس متاح وابدأ رحلتك` : `Explore ${courses.length} available courses and start learning`}
          </Typography>

          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ar ? 'ابحث عن كورس...' : 'Search courses...'}
            fullWidth
            sx={{ 
              maxWidth: 500,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                backgroundColor: 'rgba(8,69,112,0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                '& fieldset': { borderColor: palette.border },
                '&:hover fieldset': { borderColor: palette.primaryHover },
                '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2 },
              }
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: palette.textSec }} /></InputAdornment>,
            }}
          />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5, position: 'relative', zIndex: 1 }}>
        {/* Filter */}
        <Box sx={{ mb: 5, overflowX: 'auto', pb: 1 }} component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <ToggleButtonGroup value={pkg} exclusive onChange={(_, v) => v && setPkg(v)} sx={{ gap: 1.5 }}>
            {PACKAGES.map((p) => (
              <ToggleButton key={p} value={p}
                sx={{ 
                  border: `1px solid rgba(37,154,203,0.3) !important`, 
                  borderRadius: '10px !important', 
                  color: palette.textSec, 
                  px: 3, py: 1, fontSize: '0.9rem', fontWeight: 600,
                  transition: 'all 0.3s',
                  '&:hover': { background: 'rgba(8,69,112,0.4)' },
                  '&.Mui-selected': { 
                    background: `linear-gradient(135deg, rgba(48,192,242,0.15), rgba(8,69,112,0.4)) !important`, 
                    color: `${palette.primary} !important`, 
                    borderColor: `${palette.primary} !important`,
                    boxShadow: `0 0 15px rgba(48,192,242,0.2)`
                  } 
                }}>
                {p === 'ALL' ? (ar ? 'الكل' : 'All') : p}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Grid */}
        <Grid container spacing={4} component={motion.div} initial="initial" animate="animate" variants={staggerContainer}>
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Box sx={{ height: 380, borderRadius: 4, background: 'rgba(8,69,112,0.2)', border: `1px solid rgba(37,154,203,0.1)` }} className="skeleton" />
              </Grid>
            ))
          ) : filtered.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id} component={motion.div} variants={fadeInUp}>
              <Card component={Link} href={`/${locale}/courses/${course.slug}`}
                sx={{ 
                  textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column', 
                  background: `linear-gradient(180deg, rgba(8, 69, 112, 0.5) 0%, rgba(10, 10, 15, 0.9) 100%)`, 
                  backdropFilter: 'blur(12px)',
                  border: `1px solid rgba(37,154,203,0.3)`, borderRadius: 4,
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                  '&:hover': { 
                    borderColor: palette.primary, 
                    transform: 'translateY(-8px)', 
                    boxShadow: `0 20px 40px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(48,192,242,0.2)` 
                  } 
                }}>
                
                {/* 🔴 الجزء الخاص بصورة الكورس والبادج وزرار التشغيل 🔴 */}
                <CardMedia component="div"
                  sx={{ 
                    height: 200, 
                    background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : `linear-gradient(135deg, ${palette.bg}, ${palette.cardBg})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                    borderBottom: `1px solid rgba(37,154,203,0.2)`
                  }}>
                  
                  {/* زرار الـ Play متغلف بطبقة زجاجية عشان يبرز */}
                  <Box sx={{ 
                    width: 64, height: 64, borderRadius: '50%', 
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    border: `1px solid rgba(48,192,242,0.3)`, transition: '0.3s',
                    '&:hover': { background: 'rgba(48,192,242,0.2)', transform: 'scale(1.1)' }
                  }}>
                    <PlayCircle sx={{ fontSize: 40, color: palette.primary }} />
                  </Box>

                  {/* بادج الباقة (تم تنزيله وإضافة ظل) */}
                  <Chip label={course.packageType} size="small"
                    sx={{ 
                      position: 'absolute', top: 20, left: ar ? 'auto' : 20, right: ar ? 20 : 'auto', 
                      background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', 
                      fontWeight: 900, fontSize: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                    }} />
                </CardMedia>

                <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 900, mb: 1.5, fontSize: '1.15rem', color: '#fff', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.title}
                  </Typography>
                  <Typography sx={{ color: palette.textSec, fontSize: '0.9rem', mb: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1 }}>
                    {course.shortDescription || (ar ? 'لا يوجد وصف متاح' : 'No description available')}
                  </Typography>

                  {/* 🔴 التعديل هنا لحل مشكلة الصفر (0) اللي كان بيظهر فجأة 🔴 */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 3, color: palette.textSec, fontSize: '0.85rem', fontWeight: 600 }}>
                    {(course.totalLessons ?? 0) > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <MenuBook sx={{ fontSize: 16, color: palette.primary }} /> {course.totalLessons} {ar ? 'درس' : 'lessons'}
                      </Box>
                    )}
                    {(course.duration ?? 0) > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <AccessTime sx={{ fontSize: 16, color: palette.primary }} /> {Math.round(course.duration / 60)}h
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 2, borderTop: `1px dashed rgba(37,154,203,0.3)` }}>
                    <Box>
                      {course.salePrice ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ fontWeight: 900, color: palette.primary, fontSize: '1.4rem' }}>${course.salePrice}</Typography>
                          <Typography sx={{ color: palette.textSec, fontSize: '0.9rem', textDecoration: 'line-through', opacity: 0.7 }}>${course.originalPrice}</Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ fontWeight: 900, color: palette.primary, fontSize: '1.4rem' }}>${course.originalPrice}</Typography>
                      )}
                    </Box>
                    <Chip label={`${course.commissionRate}% ${ar ? 'عمولة' : 'comm.'}`} size="small"
                      sx={{ 
                        background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', 
                        fontSize: '0.75rem', fontWeight: 800, border: `1px solid rgba(74, 222, 128, 0.3)` 
                      }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {!loading && filtered.length === 0 && (
            <Grid item xs={12} component={motion.div} variants={fadeInUp}>
              <Box sx={{ textAlign: 'center', py: 10, background: 'rgba(8,69,112,0.2)', borderRadius: 5, border: `1px dashed rgba(37,154,203,0.3)` }}>
                <Search sx={{ fontSize: 60, color: palette.textSec, mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>{ar ? 'لم يتم العثور على كورسات' : 'No courses found'}</Typography>
                <Typography sx={{ color: palette.textSec, mt: 1 }}>{ar ? 'حاول البحث بكلمات أخرى' : 'Try searching with different keywords'}</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}