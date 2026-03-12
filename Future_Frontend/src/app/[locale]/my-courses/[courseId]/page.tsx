'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Container, Typography, Grid, Card, List, ListItemButton, ListItemText,
  Divider, CircularProgress, IconButton, alpha, Tooltip, Chip 
} from '@mui/material';
import { 
  CheckCircleRounded, RadioButtonUncheckedRounded, 
  PlayCircleOutlineRounded, MenuBookRounded, ShieldRounded
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import Navbar from '@/components/layout/Navbar';
import { coursesApi, mediaApi } from '@/lib/api';
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
  success: '#4ade80',
};

export default function CoursePlayerPage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuthStore(); 

  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });
  
  const studentIdentifier = user ? `${user.firstName} ${user.lastName} - ${user.email}` : "Protected Mode - Future Platform";

  useEffect(() => {
    if (courseId) {
      const savedProgress = localStorage.getItem(`completed_lessons_${courseId}`);
      if (savedProgress) {
        setCompletedLessons(JSON.parse(savedProgress));
      }
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();

    const moveWatermark = setInterval(() => {
      const top = Math.floor(Math.random() * 75) + 10;
      const left = Math.floor(Math.random() * 70) + 10;
      setWatermarkPos({ top: `${top}%`, left: `${left}%` });
    }, 4000);

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's' || e.key === 'P' || e.key === 'p'))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(moveWatermark);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadCourse = async () => {
    try {
      const res = await coursesApi.getContent(courseId);
      const data = res.data?.data || res.data;

      setCourse(data.course);
      setSections(data.sections || []);

      if (data.sections?.length && data.sections[0].lessons?.length) {
        selectLesson(data.sections[0].lessons[0]);
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const selectLesson = async (lesson: any) => {
    setActiveLesson(lesson);
    setVideoUrl(''); 

    try {
      const res = await mediaApi.getStreamUrl(lesson.id);
      const embedUrl =
        res.data?.data?.streamUrl ||
        res.data?.data?.embedUrl ||
        res.data?.embedUrl || 
        res.data?.streamUrl;

      setVideoUrl(embedUrl);
    } catch (err) {
      console.log(err);
    }
  };

  const toggleLessonCompletion = (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation(); 
    setCompletedLessons(prev => {
      const newState = prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId) 
        : [...prev, lessonId];
      
      localStorage.setItem(`completed_lessons_${courseId}`, JSON.stringify(newState));
      return newState;
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', background: palette.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress sx={{ color: palette.primary }} />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ minHeight: '100vh', background: palette.bg, userSelect: 'none', WebkitUserSelect: 'none' }}
      onDragStart={(e) => e.preventDefault()} 
    >
      <Navbar />

      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 } }}>
        
        {/* Header Title */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1.5, borderRadius: 3, background: alpha(palette.primary, 0.1), border: `1px solid ${alpha(palette.primary, 0.3)}` }}>
            <MenuBookRounded sx={{ color: palette.primary, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
              {course?.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <ShieldRounded sx={{ color: palette.primary, fontSize: 16 }} />
              <Typography sx={{ color: palette.textSec, fontSize: '0.85rem', fontWeight: 600 }}>
                Protected Environment
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* ================= VIDEO AREA ================= */}
          <Grid item xs={12} md={8}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              sx={{
                background: `linear-gradient(180deg, rgba(8, 69, 112, 0.4) 0%, rgba(10, 10, 15, 0.8) 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid rgba(37,154,203,0.3)`,
                borderRadius: 5,
                overflow: 'hidden',
                boxShadow: `0 20px 50px rgba(0,0,0,0.5)`
              }}
            >
              {/* 🛡️ PROTECTED YOUTUBE VIDEO CONTAINER */}
              <Box sx={{ aspectRatio: '16/9', background: '#000', position: 'relative', overflow: 'hidden' }}>
                {videoUrl ? (
                  <>
                    <iframe
                      src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}rel=0&modestbranding=1&showinfo=0`}
                      className="w-full h-full"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    
                    {/* 🛡️ DYNAMIC WATERMARK */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: watermarkPos.top,
                        left: watermarkPos.left,
                        color: 'rgba(255, 255, 255, 0.25)', 
                        fontSize: 'clamp(12px, 1.5vw, 18px)',
                        fontWeight: 900,
                        pointerEvents: 'none', 
                        transition: 'top 1s ease-in-out, left 1s ease-in-out',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        zIndex: 10,
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        padding: '4px 12px',
                        borderRadius: 2,
                        backdropFilter: 'blur(2px)'
                      }}
                    >
                      {studentIdentifier}
                    </Box>

                    {/* 🔴 🛡️ SMART OVERLAYS (الحل السحري لمشكلة الكليك يمين) 🔴 */}
                    
                    {/* 1. الطبقة الرئيسية: تغطي 85% من مساحة الفيديو من أعلى لمنع الكليك يمين تماماً */}
                    <Box 
                      onContextMenu={(e) => e.preventDefault()}
                      sx={{ 
                        position: 'absolute', 
                        top: 0, left: 0, right: 0, bottom: '55px', // يترك 55 بيكسل بالأسفل فقط لشريط التحكم
                        background: 'transparent', 
                        zIndex: 5 
                      }} 
                    />

                    {/* 2. طبقة حجب زرار يوتيوب السفلي (اللوجو): لمنع فتحه في تاب جديد */}
                    <Box 
                      onContextMenu={(e) => e.preventDefault()}
                      sx={{ 
                        position: 'absolute', 
                        bottom: 0, right: 0, width: '60px', height: '55px', 
                        background: 'transparent', 
                        zIndex: 6 
                      }} 
                    />
                  </>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                    <PlayCircleOutlineRounded sx={{ fontSize: 60, color: alpha(palette.primary, 0.5) }} />
                    <Typography color={palette.textSec} sx={{ fontWeight: 600 }}>
                      جاري تحميل الدرس...
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* LESSON DETAILS */}
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Chip label="الدرس الحالي" size="small" sx={{ mb: 2, background: alpha(palette.primary, 0.15), color: palette.primary, fontWeight: 800, border: `1px solid ${alpha(palette.primary, 0.3)}` }} />
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1.5, color: '#fff' }}>
                  {activeLesson?.title || "اختر درساً للبدء"}
                </Typography>
                <Typography sx={{ color: palette.textSec, lineHeight: 1.8 }}>
                  {activeLesson?.description || "لا يوجد وصف لهذا الدرس."}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* ================= COURSE CONTENT (PLAYLIST) ================= */}
          <Grid item xs={12} md={4}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              sx={{
                background: `linear-gradient(180deg, rgba(8, 69, 112, 0.3) 0%, rgba(10, 10, 15, 0.9) 100%)`,
                backdropFilter: 'blur(15px)',
                border: `1px solid rgba(37,154,203,0.3)`,
                borderRadius: 5,
                height: { xs: 'auto', md: '80vh' },
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ p: 3, borderBottom: `1px solid rgba(37,154,203,0.2)`, background: 'rgba(255,255,255,0.02)' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MenuBookRounded sx={{ color: palette.primary }} /> محتوى الكورس
                </Typography>
              </Box>

              <Box sx={{ 
                flexGrow: 1, overflowY: 'auto', 
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(37,154,203,0.3)', borderRadius: '10px' },
                '&::-webkit-scrollbar-thumb:hover': { background: palette.primary }
              }}>
                {sections.map((section: any, sIndex: number) => (
                  <Box key={section.id}>
                    <Box sx={{ px: 3, py: 2, background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
                      <Typography sx={{ fontWeight: 800, color: palette.textMain, fontSize: '0.95rem' }}>
                        {sIndex + 1}. {section.title}
                      </Typography>
                    </Box>

                    <List disablePadding>
                      {section.lessons.map((lesson: any, lIndex: number) => {
                        const isSelected = activeLesson?.id === lesson.id;
                        const isCompleted = completedLessons.includes(lesson.id);

                        return (
                          <ListItemButton
                            key={lesson.id}
                            onClick={() => selectLesson(lesson)}
                            selected={isSelected}
                            sx={{
                              py: 2, px: 3,
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              transition: 'all 0.3s',
                              '&.Mui-selected': {
                                background: `linear-gradient(90deg, ${alpha(palette.primary, 0.15)} 0%, transparent 100%)`,
                                borderLeft: `4px solid ${palette.primary}`
                              },
                              '&:hover': { background: 'rgba(255,255,255,0.05)' }
                            }}
                          >
                            <Tooltip title={isCompleted ? "مكتمل" : "تحديد كمكتمل"} placement="top">
                              <IconButton 
                                onClick={(e) => toggleLessonCompletion(e, lesson.id)}
                                sx={{ p: 0.5, mr: 2, color: isCompleted ? palette.success : 'rgba(255,255,255,0.2)', transition: '0.3s', '&:hover': { color: isCompleted ? palette.success : palette.primary } }}
                              >
                                {isCompleted ? <CheckCircleRounded /> : <RadioButtonUncheckedRounded />}
                              </IconButton>
                            </Tooltip>

                            <ListItemText
                              primary={`${lIndex + 1}. ${lesson.title}`}
                              primaryTypographyProps={{
                                fontSize: '0.95rem',
                                fontWeight: isSelected ? 800 : 600,
                                color: isSelected ? '#fff' : palette.textSec,
                                sx: { transition: 'color 0.3s' }
                              }}
                            />
                            
                            {isSelected && (
                              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
                                <PlayCircleOutlineRounded sx={{ color: palette.primary, fontSize: 20 }} />
                              </motion.div>
                            )}
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}