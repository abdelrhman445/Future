'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Grid, Card, List, ListItemButton, ListItemText,
  CircularProgress, IconButton, alpha, Tooltip, Chip, Slider, Button
} from '@mui/material';
import { 
  CheckCircleRounded, RadioButtonUncheckedRounded, 
  PlayCircleOutlineRounded, MenuBookRounded, ShieldRounded,
  PauseRounded, PlayArrowRounded, VolumeUpRounded, VolumeOffRounded, FullscreenRounded,
  WorkspacePremiumRounded
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// 🔴 التعديل هنا: استدعاء مباشر عشان نحافظ على الـ Ref اللي بيقدم ويأخر الفيديو
import ReactPlayer from 'react-player/youtube';

import Navbar from '@/components/layout/Navbar';
// 🔴 التعديل الأول: إضافة certificatesApi هنا
import { coursesApi, mediaApi, usersApi, certificatesApi } from '@/lib/api';
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

// دالة لتنسيق الوقت (لتحويل الثواني لـ 00:00)
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '00:00';
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  if (hh) return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
  return `${mm}:${ss}`;
};

export default function CoursePlayerPage() {
  const { courseId, locale } = useParams() as { courseId: string; locale: string };
  const router = useRouter();
  const { user } = useAuthStore(); 
  const ar = locale === 'ar';

  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });
  const [isClient, setIsClient] = useState(false); // 🔴 للتأكد إن الكود شغال في المتصفح بس

  // ================= 🎓 CERTIFICATE STATES =================
  const [claimingCert, setClaimingCert] = useState(false);

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
  
  const studentIdentifier = user ? `${user.firstName} ${user.lastName} - ${user.email}` : "Protected Mode - Future Platform";

  useEffect(() => {
    setIsClient(true);
    if (courseId) {
      const savedProgress = localStorage.getItem(`completed_lessons_${courseId}`);
      if (savedProgress) setCompletedLessons(JSON.parse(savedProgress));
    }
  }, [courseId]);

  useEffect(() => {
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
      if (data.sections?.length && data.sections[0].lessons?.length) {
        selectLesson(data.sections[0].lessons[0]);
      }
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  const selectLesson = async (lesson: any) => {
    setActiveLesson(lesson);
    setVideoUrl(''); 
    setPlaying(false);
    setPlayed(0);
    try {
      const res = await mediaApi.getStreamUrl(lesson.id);
      const embedUrl = res.data?.data?.streamUrl || res.data?.data?.embedUrl || res.data?.embedUrl || res.data?.streamUrl;
      let finalUrl = embedUrl;
      if (embedUrl && embedUrl.includes('youtube.com/embed/')) {
        const videoId = embedUrl.split('youtube.com/embed/')[1].split('?')[0];
        finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
      setVideoUrl(finalUrl);
    } catch (err) { console.log(err); }
  };

  // 🔴 التعديل الثاني: استبدال الدالة القديمة بالدالة الجديدة اللي بتكلم الباك إند
  const toggleLessonCompletion = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    
    // تحديث الـ UI فوراً
    setCompletedLessons(prev => {
      const newState = prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId) 
        : [...prev, lessonId];
      localStorage.setItem(`completed_lessons_${courseId}`, JSON.stringify(newState));
      return newState;
    });
  
    // لو بيضيف (مش بيشيل) — يبعت للباكند
    if (!completedLessons.includes(lessonId)) {
      try {
        await usersApi.updateProgress(courseId, lessonId);
      } catch (err) {
        console.log('Progress update failed:', err);
      }
    }
  };

  // ================= 🎓 دالة استلام الشهادة =================
const handleClaimCertificate = async () => {
    setClaimingCert(true);
    try {
      // 1. نادي على الدالة الجاهزة اللي بتكلم الباك إند (issue)
      // الباك إند جوه دالة الـ issue هو اللي هيتأكد لو إنت مخلص 100% ولا لأ
      const res = await certificatesApi.issueCertificate(courseId);

      const certNumber = res.data?.data?.certNumber;
      toast.success(ar ? '🎉 تم إصدار شهادتك بنجاح!' : '🎉 Certificate issued!');

      // 2. التوجيه لصفحة الشهادة بعد ثانية ونصف
      setTimeout(() => {
        router.push(`/${locale}/certificates/${certNumber}`);
      }, 1500);

    } catch (err: any) {
      // لو الباك إند رد بإن الشهادة موجودة أصلاً، وديه للصفحة علطول
      if (err.response?.data?.data?.certNumber) {
        router.push(`/${locale}/certificates/${err.response.data.data.certNumber}`);
        return;
      }
      
      // غير كدة يظهر رسالة الخطأ اللي جاية من الباك إند
      const errorMsg = err.response?.data?.message;
      toast.error(errorMsg || (ar ? 'فشل إصدار الشهادة' : 'Failed to issue certificate'));
    } finally {
      setClaimingCert(false);
    }
  };
  // ================= حساب نسبة الإنجاز =================
  const totalLessonsCount = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  const isCourseFullyCompleted = completedLessons.length >= totalLessonsCount && totalLessonsCount > 0;
  const progressPercent = totalLessonsCount > 0 ? Math.round((completedLessons.length / totalLessonsCount) * 100) : 0;

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
    
    // 🔴 تمرير نقطة التقديم الجديدة للفيديو باستخدام الـ Ref
    if (playerRef.current) {
      playerRef.current.seekTo(fraction, 'fraction');
    }

    // 🔴 تأخير بسيط قبل ما نرجع حالة السحب لـ false عشان يوتيوب يلحق يستوعب المكان الجديد وميرجعش لورا
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
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4, md: 5 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
          <Box sx={{ p: { xs: 1, md: 1.5 }, borderRadius: 3, background: alpha(palette.primary, 0.1), border: `1px solid ${alpha(palette.primary, 0.3)}` }}>
            <MenuBookRounded sx={{ color: palette.primary, fontSize: { xs: 24, md: 28 } }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' } }}>
              {course?.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <ShieldRounded sx={{ color: palette.primary, fontSize: 16 }} />
              <Typography sx={{ color: palette.textSec, fontSize: '0.85rem', fontWeight: 600 }}>Protected Environment</Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={{ xs: 2, md: 4 }}>
          {/* ================= VIDEO AREA ================= */}
          <Grid item xs={12} lg={8}>
            <Card
              component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              sx={{
                background: `linear-gradient(180deg, rgba(8, 69, 112, 0.4) 0%, rgba(10, 10, 15, 0.8) 100%)`,
                backdropFilter: 'blur(20px)', border: `1px solid rgba(37,154,203,0.3)`, borderRadius: { xs: 3, md: 5 }, overflow: 'hidden', boxShadow: `0 20px 50px rgba(0,0,0,0.5)`
              }}
            >
              {/* 🛡️ حاوية الفيديو الرئيسية */}
              <Box 
                ref={playerContainerRef}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                sx={{ aspectRatio: '16/9', background: '#000', position: 'relative', overflow: 'hidden' }}
              >
                {isClient && videoUrl ? (
                  <>
                    <Box 
                      sx={{ 
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        pointerEvents: 'none', 
                      }}
                    >
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
                            playerVars: { 
                              modestbranding: 1, rel: 0, showinfo: 0, disablekb: 1, iv_load_policy: 3 
                            }
                          }
                        }}
                      />
                    </Box>
                    
                    <Box 
                      onClick={handlePlayPause}
                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
                      sx={{ position: 'absolute', top: '10%', bottom: '15%', left: 0, right: 0, zIndex: 30, cursor: 'pointer' }} 
                    />

                    {/* 🛡️ DYNAMIC WATERMARK */}
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

                    <Box onContextMenu={(e) => { e.preventDefault(); return false; }} sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', background: 'transparent', zIndex: 40 }} />

                    {/* 🔴 شريط التحكم المخصص 🔴 */}
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
                      {/* شريط التقديم والتأخير */}
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                    <PlayCircleOutlineRounded sx={{ fontSize: 60, color: alpha(palette.primary, 0.5) }} />
                    <Typography color={palette.textSec} sx={{ fontWeight: 600 }}>جاري تحميل الدرس...</Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ p: { xs: 2.5, md: 4 } }}>
                <Chip label="الدرس الحالي" size="small" sx={{ mb: 2, background: alpha(palette.primary, 0.15), color: palette.primary, fontWeight: 800, border: `1px solid ${alpha(palette.primary, 0.3)}` }} />
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1.5, color: '#fff', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>{activeLesson?.title || "اختر درساً للبدء"}</Typography>
                <Typography sx={{ color: palette.textSec, lineHeight: 1.8, fontSize: { xs: '0.9rem', md: '1rem' } }}>{activeLesson?.description || "لا يوجد وصف لهذا الدرس."}</Typography>

                {/* ================= 🎓 زرار الشهادة ================= */}
                {isCourseFullyCompleted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ marginTop: '24px' }}
                  >
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleClaimCertificate}
                      disabled={claimingCert}
                      startIcon={claimingCert
                        ? <CircularProgress size={20} sx={{ color: '#000' }} />
                        : <WorkspacePremiumRounded />
                      }
                      sx={{
                        background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`,
                        color: '#000',
                        fontWeight: 900,
                        py: 2,
                        borderRadius: 3,
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        boxShadow: `0 10px 30px ${alpha(palette.primary, 0.4)}`,
                        transition: 'all 0.3s',
                        '&:hover': {
                          background: palette.primaryHover,
                          boxShadow: `0 14px 40px ${alpha(palette.primary, 0.6)}`,
                          transform: 'translateY(-2px)',
                        },
                        '&:disabled': {
                          background: alpha(palette.primary, 0.4),
                          color: 'rgba(0,0,0,0.5)',
                        }
                      }}
                    >
                      {claimingCert
                        ? (ar ? 'جاري إصدار الشهادة...' : 'Issuing certificate...')
                        : (ar ? '🎉 استلم شهادتك الآن' : '🎉 Claim Your Certificate Now')
                      }
                    </Button>
                  </motion.div>
                )}

                {/* شريط progress مرئي */}
                {totalLessonsCount > 0 && !isCourseFullyCompleted && (
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ color: palette.textSec, fontSize: '0.8rem', fontWeight: 600 }}>
                        {ar ? 'تقدمك في الكورس' : 'Course Progress'}
                      </Typography>
                      <Typography sx={{ color: palette.primary, fontSize: '0.8rem', fontWeight: 900 }}>
                        {completedLessons.length} / {totalLessonsCount} ({progressPercent}%)
                      </Typography>
                    </Box>
                    <Box sx={{ height: 6, borderRadius: 3, background: alpha(palette.primary, 0.15), overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: `linear-gradient(90deg, ${palette.primary}, ${palette.border})`,
                          borderRadius: 3,
                        }}
                      />
                    </Box>
                  </Box>
                )}
                {/* ================= END زرار الشهادة ================= */}

              </Box>
            </Card>
          </Grid>

          {/* ================= COURSE CONTENT (Side Playlist) ================= */}
          <Grid item xs={12} lg={4}>
            <Card
              component={motion.div} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              sx={{ 
                background: `linear-gradient(180deg, rgba(8, 69, 112, 0.3) 0%, rgba(10, 10, 15, 0.9) 100%)`, 
                backdropFilter: 'blur(15px)', border: `1px solid rgba(37,154,203,0.3)`, borderRadius: { xs: 3, md: 5 }, 
                height: { xs: 'auto', lg: '80vh' }, 
                display: 'flex', flexDirection: 'column', overflow: 'hidden' 
              }}
            >
              <Box sx={{ p: 3, borderBottom: `1px solid rgba(37,154,203,0.2)`, background: 'rgba(255,255,255,0.02)' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MenuBookRounded sx={{ color: palette.primary }} /> محتوى الكورس
                </Typography>
                {/* progress mini في الـ sidebar */}
                {totalLessonsCount > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ color: palette.textSec, fontSize: '0.72rem' }}>
                        {completedLessons.length}/{totalLessonsCount} {ar ? 'درس' : 'lessons'}
                      </Typography>
                      <Typography sx={{ color: isCourseFullyCompleted ? palette.success : palette.primary, fontSize: '0.72rem', fontWeight: 700 }}>
                        {isCourseFullyCompleted ? (ar ? '✅ مكتمل' : '✅ Complete') : `${progressPercent}%`}
                      </Typography>
                    </Box>
                    <Box sx={{ height: 4, borderRadius: 2, background: alpha(palette.primary, 0.15), overflow: 'hidden' }}>
                      <Box sx={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: isCourseFullyCompleted
                          ? `linear-gradient(90deg, ${palette.success}, #22d3ee)`
                          : `linear-gradient(90deg, ${palette.primary}, ${palette.border})`,
                        borderRadius: 2,
                        transition: 'width 0.4s ease-out',
                      }} />
                    </Box>
                  </Box>
                )}
              </Box>
              <Box sx={{ flexGrow: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(37,154,203,0.3)', borderRadius: '10px' }, '&::-webkit-scrollbar-thumb:hover': { background: palette.primary } }}>
                {sections.map((section: any, sIndex: number) => (
                  <Box key={section.id}>
                    <Box sx={{ px: 3, py: 2, background: 'rgba(0,0,0,0.3)', borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
                      <Typography sx={{ fontWeight: 800, color: palette.textMain, fontSize: '0.95rem' }}>{sIndex + 1}. {section.title}</Typography>
                    </Box>
                    <List disablePadding>
                      {section.lessons.map((lesson: any, lIndex: number) => {
                        const isSelected = activeLesson?.id === lesson.id;
                        const isCompleted = completedLessons.includes(lesson.id);
                        return (
                          <ListItemButton 
                            key={lesson.id} onClick={() => selectLesson(lesson)} selected={isSelected} 
                            sx={{ 
                              py: { xs: 1.5, md: 2 }, px: 3, borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.3s', 
                              '&.Mui-selected': { background: `linear-gradient(90deg, ${alpha(palette.primary, 0.15)} 0%, transparent 100%)`, borderLeft: `4px solid ${palette.primary}` }, 
                              '&:hover': { background: 'rgba(255,255,255,0.05)' } 
                            }}
                          >
                            <Tooltip title={isCompleted ? "مكتمل" : "تحديد كمكتمل"} placement="top">
                              <IconButton onClick={(e) => toggleLessonCompletion(e, lesson.id)} sx={{ p: 0.5, mr: 2, color: isCompleted ? palette.success : 'rgba(255,255,255,0.2)', transition: '0.3s', '&:hover': { color: isCompleted ? palette.success : palette.primary } }}>
                                {isCompleted ? <CheckCircleRounded fontSize="small" /> : <RadioButtonUncheckedRounded fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <ListItemText primary={`${lIndex + 1}. ${lesson.title}`} primaryTypographyProps={{ fontSize: { xs: '0.85rem', md: '0.95rem' }, fontWeight: isSelected ? 800 : 600, color: isSelected ? '#fff' : palette.textSec, sx: { transition: 'color 0.3s' } }} />
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