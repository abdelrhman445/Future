'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Grid, Card, List, ListItemButton, ListItemText,
  CircularProgress, alpha, Chip, Button, IconButton, Slider
} from '@mui/material';
import { 
  LockRounded, PlayCircleOutlineRounded, MenuBookRounded, ShieldRounded,
  ShoppingCartRounded, PauseRounded, PlayArrowRounded, VolumeUpRounded, 
  VolumeOffRounded, FullscreenRounded
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// 🔴 استدعاء المشغل الاحترافي
import ReactPlayer from 'react-player/youtube';

import Navbar from '@/components/layout/Navbar';
import { coursesApi, mediaApi } from '@/lib/api';
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
  locked: '#3f3f46' // لون رمادي غامق جداً للأقفال
};

// ================= دالة تنسيق الوقت =================
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '00:00';
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  if (hh) return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
  return `${mm}:${ss}`;
};

// ================= ANIMATION VARIANTS =================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

export default function PreviewPlayerPage() {
  const { locale, courseId } = useParams() as { locale: string, courseId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialLessonId = searchParams.get('lessonId');
  const ar = locale === 'ar';
  const { user } = useAuthStore(); 

  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });
  const [isClient, setIsClient] = useState(false);

  // ================= STATES للتحكم في الفيديو =================
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const studentIdentifier = user ? `${user.firstName} ${user.lastName} - ${user.email}` : "Free Preview - Guest";

  // 1. الحماية من الكليك يمين واختصارات الكيبورد
  useEffect(() => {
    setIsClient(true);
    loadCourse();

    const moveWatermark = setInterval(() => {
      const top = Math.floor(Math.random() * 75) + 10;
      const left = Math.floor(Math.random() * 70) + 10;
      setWatermarkPos({ top: `${top}%`, left: `${left}%` });
    }, 4000);

    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); return false; };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'i', 'C', 'c', 'J', 'j'].includes(e.key)) || (e.ctrlKey && ['U', 'u', 'S', 's', 'P', 'p'].includes(e.key))) {
        e.preventDefault(); e.stopPropagation(); return false;
      }
    };
    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); e.stopPropagation(); return false; };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('copy', handleCopy, { capture: true });

    return () => {
      clearInterval(moveWatermark);
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('copy', handleCopy, { capture: true });
    };
  }, []);

  const loadCourse = async () => {
    try {
      const res = await coursesApi.getContent(courseId);
      const data = res.data?.data || res.data;
      setCourse(data.course);
      setSections(data.sections || []);
      
      let targetLesson = null;
      if (initialLessonId) {
        for (const sec of (data.sections || [])) {
          const found = sec.lessons.find((l: any) => l.id === initialLessonId);
          if (found && found.isFreePreview) targetLesson = found;
        }
      }
      
      if (!targetLesson) {
        for (const sec of (data.sections || [])) {
          const freeLesson = sec.lessons.find((l: any) => l.isFreePreview);
          if (freeLesson) { targetLesson = freeLesson; break; }
        }
      }

      if (targetLesson) {
        selectLesson(targetLesson);
      } else {
        toast.error(ar ? 'لا توجد دروس مجانية للمعاينة في هذا الكورس' : 'No free preview lessons available');
      }
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  const selectLesson = async (lesson: any) => {
    if (!lesson.isFreePreview) {
      toast.error(ar ? '🔒 هذا الدرس متاح للمشتركين فقط. قم بشراء الكورس للمشاهدة.' : '🔒 This lesson is for subscribers only. Buy the course to watch.');
      return;
    }

    setActiveLesson(lesson);
    setVideoUrl(''); 
    setPlaying(false);
    setPlayed(0);
    
    try {
      const res = await mediaApi.getStreamUrl(lesson.id);
      const embedUrl = res.data?.data?.streamUrl || res.data?.data?.embedUrl || res.data?.embedUrl || res.data?.streamUrl;
      
      // تحويل الرابط ليناسب ReactPlayer
      let finalUrl = embedUrl;
      if (embedUrl && embedUrl.includes('youtube.com/embed/')) {
        const videoId = embedUrl.split('youtube.com/embed/')[1].split('?')[0];
        finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
      setVideoUrl(finalUrl);
    } catch (err) { console.log(err); }
  };

  // ================= دوال التحكم في الفيديو =================
  const handlePlayPause = () => setPlaying(!playing);
  
  const handleProgress = (state: any) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleSeekChange = (_e: any, newValue: number | number[]) => {
    setSeeking(true); 
    setPlayed((newValue as number) / 100); 
  };

  const handleSeekMouseUp = (_e: any, newValue: number | number[]) => {
    const fraction = (newValue as number) / 100;
    if (playerRef.current) {
      playerRef.current.seekTo(fraction, 'fraction');
    }
    setTimeout(() => {
      setSeeking(false);
    }, 300);
  };

  const handleToggleMute = () => setMuted(!muted);
  
  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', background: palette.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: palette.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, userSelect: 'none', WebkitUserSelect: 'none', position: 'relative', overflow: 'hidden' }} onDragStart={(e) => e.preventDefault()}>
      {/* Background Glow Effect */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '60vw', background: `radial-gradient(circle, ${alpha(palette.primary, 0.08)} 0%, transparent 60%)`, filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
      
      <Navbar />

      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 5 }, position: 'relative', zIndex: 1 }}>
        <Box component={motion.div} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ p: 2, borderRadius: 4, background: `linear-gradient(135deg, ${alpha(palette.primary, 0.15)}, ${alpha(palette.border, 0.05)})`, border: `1px solid ${alpha(palette.primary, 0.3)}`, boxShadow: `0 0 20px ${alpha(palette.primary, 0.1)}` }}>
              <MenuBookRounded sx={{ color: palette.primary, fontSize: 36 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{ar ? 'معاينة مجانية:' : 'Free Preview:'} <span style={{ color: palette.primary }}>{course?.title}</span></Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8 }}>
                <ShieldRounded sx={{ color: palette.success, fontSize: 18 }} />
                <Typography sx={{ color: palette.textSec, fontSize: '0.9rem', fontWeight: 700 }}>Protected Preview Environment</Typography>
              </Box>
            </Box>
          </Box>

          <Button 
            onClick={() => router.push(`/${locale}/courses/${course?.slug}`)}
            variant="contained" startIcon={<ShoppingCartRounded />}
            component={motion.button} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            sx={{ 
              background: `linear-gradient(135deg, ${palette.success}, #16a34a)`, color: '#000', 
              fontWeight: 900, py: 1.5, px: 4, borderRadius: 4, fontSize: '1.05rem',
              boxShadow: `0 10px 30px ${alpha(palette.success, 0.4)}`,
              '&:hover': { background: `linear-gradient(135deg, #16a34a, #15803d)` } 
            }}
          >
            {ar ? 'فتح الكورس بالكامل' : 'Unlock Full Course'}
          </Button>
        </Box>

        <Grid container spacing={4} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
          {/* ================= VIDEO AREA ================= */}
          <Grid item xs={12} lg={8} component={motion.div} variants={itemVariants}>
            <Card sx={{ background: `linear-gradient(180deg, rgba(8, 69, 112, 0.4) 0%, rgba(10, 10, 15, 0.9) 100%)`, backdropFilter: 'blur(20px)', border: `1px solid ${alpha(palette.border, 0.3)}`, borderRadius: 6, overflow: 'hidden', boxShadow: `0 30px 60px rgba(0,0,0,0.6)` }}>
              
              {/* 🛡️ حاوية الفيديو المؤمّن */}
              <Box 
                ref={playerContainerRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                sx={{ aspectRatio: '16/9', background: '#000', position: 'relative', overflow: 'hidden' }}
              >
                {isClient && videoUrl ? (
                  <>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                      <ReactPlayer
                        ref={playerRef}
                        key={videoUrl}
                        url={videoUrl}
                        width="100%"
                        height="100%"
                        playing={playing}
                        volume={volume}
                        muted={muted}
                        onProgress={handleProgress}
                        onDuration={(d) => setDuration(d)}
                        controls={false} 
                        config={{
                          youtube: {
                            playerVars: { modestbranding: 1, rel: 0, showinfo: 0, disablekb: 1, iv_load_policy: 3 }
                          }
                        }}
                      />
                    </Box>
                    
                    {/* Click Overlay */}
                    <Box 
                      onClick={handlePlayPause}
                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
                      sx={{ position: 'absolute', top: '10%', bottom: '15%', left: 0, right: 0, zIndex: 30, cursor: 'pointer' }} 
                    />

                    {/* DYNAMIC WATERMARK */}
                    <Box
                      sx={{
                        position: 'absolute', top: watermarkPos.top, left: watermarkPos.left,
                        color: 'rgba(255, 255, 255, 0.25)', fontSize: 'clamp(10px, 1.2vw, 16px)', fontWeight: 900,
                        pointerEvents: 'none', transition: 'top 1s ease-in-out, left 1s ease-in-out',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)', zIndex: 20, backgroundColor: 'rgba(0,0,0,0.2)',
                        padding: '4px 12px', borderRadius: 2, backdropFilter: 'blur(2px)'
                      }}
                    >
                      {studentIdentifier}
                    </Box>

                    {/* Top Shield to hide YouTube title/logo on hover */}
                    <Box onContextMenu={(e) => { e.preventDefault(); return false; }} sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', background: 'transparent', zIndex: 40 }} />

                    {/* 🔴 Custom Controls 🔴 */}
                    <Box
                      sx={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)',
                        padding: { xs: '10px 15px 5px', md: '20px 20px 10px' }, zIndex: 50,
                        opacity: isHovering || !playing || seeking ? 1 : 0, 
                        transition: 'opacity 0.3s ease-in-out',
                        display: 'flex', flexDirection: 'column', gap: { xs: 0.5, md: 1 }
                      }}
                    >
                      <Slider
                        value={played * 100}
                        onChange={handleSeekChange}
                        onChangeCommitted={handleSeekMouseUp}
                        sx={{
                          color: palette.primary, height: 4, padding: '10px 0',
                          '& .MuiSlider-thumb': { width: 12, height: 12, transition: '0.2s', '&:hover, &.Mui-focusVisible': { boxShadow: `0px 0px 0px 8px ${alpha(palette.primary, 0.16)}` } },
                          '& .MuiSlider-rail': { opacity: 0.3, backgroundColor: '#fff' }
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                          <IconButton onClick={handlePlayPause} sx={{ color: '#fff', p: { xs: 0.5, md: 1 }, '&:hover': { color: palette.primary } }}>
                            {playing ? <PauseRounded sx={{ fontSize: { xs: 28, md: 32 } }} /> : <PlayArrowRounded sx={{ fontSize: { xs: 28, md: 32 } }} />}
                          </IconButton>
                          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, width: { sm: 80, md: 100 } }}>
                            <IconButton onClick={handleToggleMute} sx={{ color: '#fff', p: 0.5, '&:hover': { color: palette.primary } }}>
                              {muted || volume === 0 ? <VolumeOffRounded /> : <VolumeUpRounded />}
                            </IconButton>
                            <Slider
                              size="small" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                              onChange={(_e, val) => { setVolume(val as number); setMuted(false); }}
                              sx={{ color: '#fff', '& .MuiSlider-thumb': { width: 8, height: 8 } }}
                            />
                          </Box>
                          <Typography sx={{ color: '#fff', fontSize: { xs: '0.7rem', md: '0.85rem' }, fontWeight: 600, ml: { xs: 0.5, md: 2 }, fontFamily: 'monospace' }}>
                            {formatTime(played * duration)} / {formatTime(duration)}
                          </Typography>
                        </Box>
                        <IconButton onClick={handleToggleFullScreen} sx={{ color: '#fff', '&:hover': { color: palette.primary } }}>
                          <FullscreenRounded fontSize="medium" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box component={motion.div} key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 3, background: 'rgba(8,69,112,0.1)' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}>
                      <PlayCircleOutlineRounded sx={{ fontSize: 80, color: alpha(palette.primary, 0.3) }} />
                    </motion.div>
                    <Typography color={palette.textSec} sx={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: 1 }}>
                      {ar ? 'جاري تحضير الدرس المجاني...' : 'Preparing free preview...'}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Chip label={ar ? 'معاينة مجانية' : 'Free Preview'} size="small" icon={<PlayCircleOutlineRounded fontSize="small" />} sx={{ mb: 2.5, background: alpha(palette.success, 0.15), color: palette.success, fontWeight: 900, border: `1px solid ${alpha(palette.success, 0.3)}`, px: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.5, color: '#fff', letterSpacing: '-0.5px' }}>{activeLesson?.title || "..."}</Typography>
                <Typography sx={{ color: palette.textSec, lineHeight: 1.8, fontSize: '1.05rem' }}>{activeLesson?.description || (ar ? "استمتع بمشاهدة هذا الدرس المجاني من الكورس." : "Enjoy watching this free preview lesson from the course.")}</Typography>
              </Box>
            </Card>
          </Grid>

          {/* ================= COURSE CONTENT (PLAYLIST) ================= */}
          <Grid item xs={12} lg={4} component={motion.div} variants={itemVariants}>
            <Card sx={{ background: `linear-gradient(180deg, rgba(8, 69, 112, 0.3) 0%, rgba(10, 10, 15, 0.9) 100%)`, backdropFilter: 'blur(15px)', border: `1px solid ${alpha(palette.border, 0.3)}`, borderRadius: 6, height: { xs: 'auto', lg: '85vh' }, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: `0 20px 40px rgba(0,0,0,0.5)` }}>
              
              <Box sx={{ p: 3.5, borderBottom: `1px solid ${alpha(palette.border, 0.2)}`, background: 'rgba(255,255,255,0.02)' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MenuBookRounded sx={{ color: palette.primary }} /> {ar ? 'محتوى الكورس' : 'Course Content'}
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { background: alpha(palette.primary, 0.3), borderRadius: '10px' }, '&::-webkit-scrollbar-thumb:hover': { background: palette.primary } }}>
                {sections.map((section: any, sIndex: number) => (
                  <Box key={section.id}>
                    <Box sx={{ px: 3, py: 2.5, background: 'rgba(0,0,0,0.4)', borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
                      <Typography sx={{ fontWeight: 900, color: palette.textMain, fontSize: '1rem' }}>{sIndex + 1}. {section.title}</Typography>
                    </Box>

                    <List disablePadding>
                      {section.lessons.map((lesson: any, lIndex: number) => {
                        const isSelected = activeLesson?.id === lesson.id;
                        const isFree = lesson.isFreePreview;

                        return (
                          <ListItemButton
                            key={lesson.id} 
                            onClick={() => isFree ? selectLesson(lesson) : toast.error(ar ? 'الدرس ده للمشتركين بس، اشتري الكورس لفتحه 🔒' : 'This lesson is locked. Purchase the course to unlock! 🔒')} 
                            selected={isSelected}
                            sx={{
                              py: 2.5, px: 3, borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'all 0.3s ease',
                              opacity: isFree ? 1 : 0.45, 
                              cursor: isFree ? 'pointer' : 'not-allowed',
                              '&.Mui-selected': { background: `linear-gradient(90deg, ${alpha(palette.primary, 0.15)} 0%, transparent 100%)`, borderLeft: `4px solid ${palette.primary}` },
                              '&:hover': { background: isFree ? 'rgba(48,192,242,0.05)' : 'transparent', pl: isFree ? 4 : 3 } 
                            }}
                          >
                            <Box sx={{ mr: 2.5, display: 'flex', alignItems: 'center' }}>
                              {isFree ? (
                                <PlayCircleOutlineRounded sx={{ color: isSelected ? palette.primary : palette.textSec, fontSize: 28 }} />
                              ) : (
                                <LockRounded sx={{ color: palette.locked, fontSize: 24 }} />
                              )}
                            </Box>

                            <ListItemText
                              primary={`${lIndex + 1}. ${lesson.title}`}
                              primaryTypographyProps={{ fontSize: '1rem', fontWeight: isSelected ? 900 : 700, color: isSelected ? '#fff' : palette.textSec, sx: { transition: 'color 0.3s' } }}
                            />
                            
                            {isSelected && (
                              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                                <Typography component={motion.p} animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} sx={{ fontSize: '0.8rem', color: palette.primary, fontWeight: 900, ml: 2 }}>
                                  {ar ? 'شغال الآن' : 'Playing'}
                                </Typography>
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