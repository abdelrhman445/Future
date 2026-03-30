'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Container, Grid, Card, CardContent, CardMedia, Chip, Typography, 
  TextField, InputAdornment, Button, CircularProgress, FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import { 
  Search, PlayCircle, AccessTime, MenuBook, AutoAwesomeRounded, 
  ExpandMore, SortRounded, CategoryRounded 
} from '@mui/icons-material';
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
  animate: { transition: { staggerChildren: 0.12 } }
};

// 🔴 تم تغيير الباقات إلى مجالات لتسهيل البحث على المستخدم
const CATEGORIES = [
  { value: 'ALL', arLabel: 'الكل', enLabel: 'All' },
  { value: 'PROGRAMMING', arLabel: 'برمجة', enLabel: 'Programming' },
  { value: 'LANGUAGES', arLabel: 'لغات', enLabel: 'Languages' },
  { value: 'DESIGN', arLabel: 'تصميم', enLabel: 'Design' },
  { value: 'BUSINESS', arLabel: 'أعمال', enLabel: 'Business' },
  { value: 'RELIGION', arLabel: 'قرآن وعلوم', enLabel: 'Religion' }
];

export default function CoursesPage() {
  const { locale } = useParams() as { locale: string };
  const ar = locale === 'ar';
  
  // States
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  
  // 🔴 State المجال والترتيب
  const [category, setCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('default');
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 12;

  // جلب البيانات وإرسال المجال للسيرفر
  useEffect(() => {
    setLoading(true);
    setPage(1);
    
    // 🔴 نرسل package بدلاً من category لتوافق 100% مع أنواع الـ API في الفرونت إند
    const params: any = { limit, page: 1 };
    if (category !== 'ALL') {
      params.package = category; // السيرفر الجديد هيقرأ دي ويفلتر بذكاء
    }
    
    coursesApi.list(params)
      .then((res) => {
        const fetchedCourses = res.data.data.courses;
        setCourses(fetchedCourses);
        setHasMore(fetchedCourses.length === limit);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]); // يتم التحديث عند تغيير المجال

  const handleLoadMore = () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    
    const params: any = { limit, page: nextPage };
    if (category !== 'ALL') {
      params.package = category; // التوافق التام مع الـ API
    }
    
    coursesApi.list(params)
      .then((res) => {
        const newCourses = res.data.data.courses;
        setCourses(prev => [...prev, ...newCourses]);
        setPage(nextPage);
        setHasMore(newCourses.length === limit);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  // 🔴 تطبيق البحث النصي والترتيب (Client-Side)
  let filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.shortDescription || '').toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === 'price_asc') {
    filtered = [...filtered].sort((a, b) => (a.salePrice || a.originalPrice || 0) - (b.salePrice || b.originalPrice || 0));
  } else if (sortBy === 'price_desc') {
    filtered = [...filtered].sort((a, b) => (b.salePrice || b.originalPrice || 0) - (a.salePrice || a.originalPrice || 0));
  }

  const filterInputStyles = {
    '& .MuiOutlinedInput-root': { 
      borderRadius: '50px', 
      background: 'rgba(0,0,0,0.5)',
      color: '#fff',
      fontWeight: 700,
      fontSize: '1rem',
      height: '54px',
      transition: 'all 0.3s',
      '& fieldset': { borderColor: 'rgba(37,154,203,0.4)' }, 
      '&:hover fieldset': { borderColor: palette.primaryHover }, 
      '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2, boxShadow: `0 0 20px rgba(48,192,242,0.3)` } 
    },
    '& .MuiInputLabel-root': { color: palette.textSec, fontWeight: 600 },
    '& .MuiInputLabel-root.Mui-focused': { color: palette.primary },
    '& .MuiSvgIcon-root': { color: palette.primary }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, position: 'relative', overflow: 'hidden' }}>
      
      <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '40vw', background: `radial-gradient(circle, rgba(48,192,242,0.1) 0%, transparent 70%)`, filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
      
      <Navbar />

      <Box sx={{ 
        background: `linear-gradient(180deg, rgba(8,69,112,0.4) 0%, ${palette.bg} 100%)`, 
        borderBottom: `1px solid rgba(37,154,203,0.1)`, 
        pt: { xs: 8, md: 10 }, pb: { xs: 6, md: 8 }, 
        position: 'relative', zIndex: 1 
      }}>
        <Container maxWidth="lg" component={motion.div} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1.5 }}>
            <AutoAwesomeRounded sx={{ color: palette.primary, fontSize: 38, filter: `drop-shadow(0 0 10px ${palette.primary})` }} />
            <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff', letterSpacing: '-1px', textShadow: `0 0 30px rgba(48,192,242,0.4)` }}>
              {ar ? 'جميع الكورسات' : 'All Courses'}
            </Typography>
          </Box>
          <Typography sx={{ color: palette.textSec, mb: 6, fontSize: '1.2rem', fontWeight: 600, textAlign: 'center' }}>
            {ar ? `استكشف الكورسات المتاحة وابدأ رحلتك نحو الاحتراف` : `Explore available courses and start learning`}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? 'ابحث عن كورس (تصميم، برمجة، لغات...)' : 'Search courses...'}
              fullWidth
              sx={{ 
                maxWidth: 650,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '50px',
                  height: '65px',
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  boxShadow: `0 15px 30px rgba(0,0,0,0.5), inset 0 0 15px rgba(48,192,242,0.1)`,
                  transition: 'all 0.3s',
                  '& fieldset': { borderColor: 'rgba(37,154,203,0.4)' },
                  '&:hover fieldset': { borderColor: palette.primaryHover },
                  '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2, boxShadow: `0 0 30px rgba(48,192,242,0.5)` },
                }
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start" sx={{ ml: 2, mr: 1 }}><Search sx={{ color: palette.primary, fontSize: 32 }} /></InputAdornment>,
              }}
            />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 1 }}>
        
        {/* 🔴 المجالات */}
        <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} sx={{ mb: 6 }}>
          <Typography sx={{ color: palette.textMain, fontWeight: 900, fontSize: '1.4rem', mb: 4, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center' }}>
            <CategoryRounded sx={{ color: palette.primary, fontSize: 30 }} /> {ar ? 'اختر المجال' : 'Select Domain'}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, md: 4 }, justifyContent: 'center' }}>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                sx={{
                  borderRadius: '50px',
                  px: { xs: 4, md: 6 }, 
                  py: 1.5, 
                  fontSize: '1.1rem', 
                  fontWeight: 900,
                  whiteSpace: 'nowrap',
                  color: category === cat.value ? '#000' : palette.textSec,
                  background: category === cat.value ? palette.primary : 'rgba(8,69,112,0.3)',
                  border: `1px solid ${category === cat.value ? palette.primary : 'rgba(37,154,203,0.3)'}`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: category === cat.value ? `0 0 25px rgba(48,192,242,0.5)` : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: category === cat.value ? palette.primaryHover : 'rgba(48,192,242,0.15)',
                    transform: 'translateY(-4px)',
                    borderColor: palette.primary,
                    color: category === cat.value ? '#000' : '#fff'
                  }
                }}
              >
                {ar ? cat.arLabel : cat.enLabel}
              </Button>
            ))}
          </Box>
        </Box>

        {/* 🔴 بار الترتيب (منفصل وأنيق) */}
        <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} 
             sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 6, px: 2 }}>
            
            <FormControl sx={{ minWidth: { xs: '100%', sm: 280 }, ...filterInputStyles }}>
              <InputLabel>{ar ? "ترتيب حسب" : "Sort By"}</InputLabel>
              <Select
                value={sortBy}
                label={ar ? "ترتيب حسب" : "Sort By"}
                onChange={(e) => setSortBy(e.target.value)}
                startAdornment={<InputAdornment position="start" sx={{ pl: 1 }}><SortRounded fontSize="small" sx={{ color: palette.primary }} /></InputAdornment>}
                MenuProps={{ PaperProps: { sx: { bgcolor: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: '24px', mt: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.8)' } } }}
              >
                <MenuItem value="default" sx={{ fontWeight: 700, py: 1.5, '&:hover': { bgcolor: 'rgba(48,192,242,0.1)' } }}>{ar ? 'الافتراضي' : 'Default'}</MenuItem>
                <MenuItem value="price_asc" sx={{ fontWeight: 700, py: 1.5, '&:hover': { bgcolor: 'rgba(48,192,242,0.1)' } }}>{ar ? 'السعر: الأقل للأعلى' : 'Price: Low to High'}</MenuItem>
                <MenuItem value="price_desc" sx={{ fontWeight: 700, py: 1.5, '&:hover': { bgcolor: 'rgba(48,192,242,0.1)' } }}>{ar ? 'السعر: الأعلى للأقل' : 'Price: High to Low'}</MenuItem>
              </Select>
            </FormControl>
        </Box>

        {/* Grid */}
        <Grid container spacing={4} component={motion.div} initial="initial" animate="animate" variants={staggerContainer}>
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Box sx={{ height: 420, borderRadius: '32px', background: 'rgba(8,69,112,0.2)', border: `1px solid rgba(37,154,203,0.1)`, animation: 'pulse 1.5s infinite' }} />
              </Grid>
            ))
          ) : filtered.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id} component={motion.div} variants={fadeInUp}>
              <Card component={Link} href={`/${locale}/courses/${course.slug}`}
                sx={{ 
                  textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column', 
                  background: `linear-gradient(180deg, rgba(8, 69, 112, 0.4) 0%, rgba(10, 10, 15, 0.9) 100%)`, 
                  backdropFilter: 'blur(20px)',
                  border: `1px solid rgba(37,154,203,0.3)`, 
                  borderRadius: '32px',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                  '&:hover': { 
                    borderColor: palette.primary, 
                    transform: 'translateY(-10px)', 
                    boxShadow: `0 25px 50px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(48,192,242,0.3)` 
                  } 
                }}>
                
                <CardMedia component="div"
                  sx={{ 
                    height: 220, 
                    background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : `linear-gradient(135deg, ${palette.bg}, ${palette.cardBg})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                    borderBottom: `1px solid rgba(37,154,203,0.2)`
                  }}>
                  
                  <Box sx={{ 
                    width: 70, height: 70, borderRadius: '50%', 
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    border: `1px solid rgba(48,192,242,0.4)`, transition: '0.3s',
                    boxShadow: `0 0 20px rgba(0,0,0,0.5)`,
                    '&:hover': { background: 'rgba(48,192,242,0.2)', transform: 'scale(1.1)', boxShadow: `0 0 25px rgba(48,192,242,0.5)` }
                  }}>
                    <PlayCircle sx={{ fontSize: 44, color: palette.primary }} />
                  </Box>

                  <Chip label={course.packageType} size="small"
                    sx={{ 
                      position: 'absolute', top: 20, left: ar ? 'auto' : 20, right: ar ? 20 : 'auto', 
                      background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', 
                      fontWeight: 900, fontSize: '0.8rem', px: 1, borderRadius: '50px', boxShadow: '0 5px 15px rgba(0,0,0,0.6)'
                    }} />
                </CardMedia>

                <CardContent sx={{ flexGrow: 1, p: 3.5, display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 900, mb: 1.5, fontSize: '1.25rem', color: '#fff', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.title}
                  </Typography>
                  <Typography sx={{ color: palette.textSec, fontSize: '0.95rem', mb: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1 }}>
                    {course.shortDescription || (ar ? 'لا يوجد وصف متاح' : 'No description available')}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2.5, mb: 3, color: palette.textSec, fontSize: '0.9rem', fontWeight: 700 }}>
                    {(course.totalLessons ?? 0) > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MenuBook sx={{ fontSize: 18, color: palette.primary }} /> {course.totalLessons} {ar ? 'درس' : 'lessons'}
                      </Box>
                    )}
                    {(course.duration ?? 0) > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ fontSize: 18, color: palette.primary }} /> {Math.round(course.duration / 60)}h
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 2.5, borderTop: `1px dashed rgba(37,154,203,0.3)` }}>
                    <Box>
                      {course.salePrice ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ fontWeight: 900, color: palette.primary, fontSize: '1.6rem', textShadow: `0 0 15px rgba(48,192,242,0.4)` }}>${course.salePrice}</Typography>
                          <Typography sx={{ color: palette.textSec, fontSize: '1rem', textDecoration: 'line-through', opacity: 0.7 }}>${course.originalPrice}</Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ fontWeight: 900, color: palette.primary, fontSize: '1.6rem', textShadow: `0 0 15px rgba(48,192,242,0.4)` }}>
                          {(course.originalPrice === 0) ? (ar ? 'مجاني' : 'Free') : `$${course.originalPrice}`}
                        </Typography>
                      )}
                    </Box>
                    <Chip label={`${course.commissionRate}% ${ar ? 'عمولة' : 'comm.'}`} size="small"
                      sx={{ 
                        background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', 
                        fontSize: '0.85rem', fontWeight: 900, border: `1px solid rgba(74, 222, 128, 0.3)`, borderRadius: '50px', px: 1 
                      }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {!loading && filtered.length === 0 && (
            <Grid item xs={12} component={motion.div} variants={fadeInUp}>
              <Box sx={{ textAlign: 'center', py: 10, background: 'rgba(8,69,112,0.2)', borderRadius: '40px', border: `1px dashed rgba(37,154,203,0.4)` }}>
                <Search sx={{ fontSize: 80, color: palette.primary, mb: 2, opacity: 0.3 }} />
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900, mb: 1 }}>{ar ? 'لم يتم العثور على كورسات تطابق بحثك' : 'No courses match your criteria'}</Typography>
                <Typography sx={{ color: palette.textSec, fontSize: '1.1rem' }}>{ar ? 'جرب تغيير الفلاتر أو البحث بكلمات أخرى' : 'Try changing filters or searching with different keywords'}</Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* 🔴 زرار عرض المزيد (Load More) */}
        {!loading && hasMore && search === '' && sortBy === 'default' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              variant="outlined"
              endIcon={loadingMore ? <CircularProgress size={24} color="inherit" /> : <ExpandMore sx={{ fontSize: '24px !important' }} />}
              sx={{
                gap: 1.5,
                borderColor: 'rgba(48,192,242,0.4)', color: palette.primary,
                px: 6, py: 1.8, borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem',
                background: 'rgba(8,69,112,0.3)', backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: palette.primaryHover, color: palette.primaryHover,
                  background: 'rgba(48,192,242,0.1)',
                  transform: 'translateY(-3px)',
                  boxShadow: `0 10px 30px rgba(48,192,242,0.3)`
                }
              }}
            >
              {loadingMore ? (ar ? 'جاري التحميل...' : 'Loading...') : (ar ? 'عرض المزيد من الكورسات' : 'Load More Courses')}
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}