'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  ListItemSecondaryAction
} from '@mui/material';

import {
  CheckCircle,
  Add,
  ArrowBack,
  PlayCircleOutline,
  FolderOpen,
  Close,
  EditRounded,
  LockOpenOutlined,
  VisibilityOff
} from '@mui/icons-material';

import Navbar from '@/components/layout/Navbar';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';

// ================= THEME PALETTE =================
const palette = {
  bg: '#0a0a0f',
  cardBg: '#084570',
  border: '#259acb',
  primary: '#30c0f2',
  primaryHover: '#83d9f7',
  textMain: '#a8eff9',
  textSec: '#a0ddf1',
};

export default function AdminCourses() {
  const { locale } = useParams() as { locale: string };
  const ar = locale === 'ar';

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);

  const [sectionDialog, setSectionDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState(false);

  const [sectionTitle, setSectionTitle] = useState('');

  // حالات الدرس (Lesson States)
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState(''); 
  const [isPreview, setIsPreview] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  // ================= FETCH COURSES =================
  const fetchCourses = async () => {
    try {
      const res = await adminApi.allCourses();
      setCourses(res.data?.data?.courses || res.data?.courses || []);
    } catch {
      toast.error(ar ? "فشل تحميل الكورسات" : "Failed to load courses");
    }
    setLoading(false);
  };

  // ================= LOAD COURSE BUILDER =================
  const openCourse = async (course: any) => {
    try {
      setLoading(true);
      const res = await adminApi.getCourse(course.id);
      setSelectedCourse(res.data?.data || res.data);
    } catch {
      toast.error(ar ? "فشل تحميل تفاصيل الكورس" : "Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  // ================= PUBLISH COURSE =================
  const publish = async (id: string) => {
    try {
      setPublishing(id);
      await adminApi.publishCourse(id);
      toast.success(ar ? "تم نشر الكورس" : "Course published");
      fetchCourses();
    } catch {
      toast.error(ar ? "فشل النشر" : "Publish failed");
    }
    setPublishing(null);
  };

  // ================= ADD SECTION =================
  const addSection = async () => {
    if (!sectionTitle.trim()) {
      toast.error(ar ? "يرجى إدخال عنوان القسم" : "Please enter a section title");
      return;
    }
    setIsSubmitting(true);
    try {
      await adminApi.createSection(selectedCourse.id, {
        title: sectionTitle,
        order: selectedCourse.sections?.length ? selectedCourse.sections.length + 1 : 1
      });
      toast.success(ar ? "تم إضافة القسم" : "Section created");
      setSectionDialog(false);
      setSectionTitle('');
      openCourse(selectedCourse);
    } catch {
      toast.error(ar ? "فشل إضافة القسم" : "Failed to create section");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= HANDLE OPEN LESSON DIALOG =================
  const handleOpenAddLesson = (section: any) => {
    setSelectedSection(section);
    setEditLessonId(null);
    setLessonTitle('');
    setYoutubeUrl(''); 
    setIsPreview(false);
    setIsPublished(true);
    setLessonDialog(true);
  };

  const handleOpenEditLesson = (section: any, lesson: any) => {
    setSelectedSection(section);
    setEditLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setYoutubeUrl(lesson.videoUrl || ''); 
    setIsPreview(lesson.isFreePreview || false);
    setIsPublished(lesson.isPublished !== false);
    setLessonDialog(true);
  };

  // ================= SAVE LESSON (ADD OR EDIT) =================
  const saveLesson = async () => {
    if (!lessonTitle.trim()) {
      toast.error(ar ? "يرجى إدخال عنوان الدرس" : "Please enter a lesson title");
      return;
    }
    setIsSubmitting(true);
    try {
      let lessonId = editLessonId;

      if (editLessonId) {
        await adminApi.updateLesson(editLessonId, {
          title: lessonTitle,
          isFreePreview: isPreview,
          isPublished: isPublished
        });
        toast.success(ar ? "تم تعديل الدرس بنجاح" : "Lesson updated successfully");
      } else {
        const lessonRes = await adminApi.createLesson(selectedSection.id, {
          title: lessonTitle,
          order: selectedSection.lessons?.length ? selectedSection.lessons.length + 1 : 1,
          isFreePreview: isPreview,
          isPublished: isPublished
        });
        lessonId = lessonRes.data?.data?.id || lessonRes.data?.id;
        toast.success(ar ? "تم إضافة الدرس" : "Lesson created");
      }

      if (youtubeUrl && lessonId) {
        await adminApi.uploadLessonVideo({
          lessonId: lessonId,
          youtubeUrl: youtubeUrl
        });
      }

      setLessonDialog(false);
      openCourse(selectedCourse);
    } catch (err) {
      toast.error(ar ? "حدث خطأ أثناء حفظ الدرس" : "Failed to save lesson");
      console.log(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, pb: 10, position: 'relative' }}>
      {/* Background Glow - بدون كود معقد عشان ميعملش Error */}
      <Box sx={{ 
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', 
        width: '60vw', height: '40vw', 
        background: 'radial-gradient(circle, rgba(48,192,242,0.08) 0%, transparent 70%)', 
        filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' 
      }} />

      <Navbar />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
        {/* ================= HEADER ================= */}
        {!selectedCourse ? (
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 4,
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryHover})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.8rem', md: '2.5rem' }
            }}
          >
            {ar ? "إدارة محتوى الكورسات" : "Course Content Manager"}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: { xs: 1.5, md: 2 } }}>
            <IconButton 
              onClick={() => setSelectedCourse(null)} 
              sx={{ background: 'rgba(255,255,255,0.05)', color: '#fff', '&:hover': { background: 'rgba(48,192,242,0.2)' } }}
            >
              <ArrowBack sx={{ transform: ar ? 'rotate(180deg)' : 'none' }} />
            </IconButton>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                {selectedCourse.title}
              </Typography>
              <Typography sx={{ color: palette.textSec, fontSize: '0.9rem' }}>
                {ar ? 'أضف ونظم الأقسام والدروس لهذا الكورس' : 'Manage sections and lessons for this course'}
              </Typography>
            </Box>
          </Box>
        )}

        {loading && !isSubmitting ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: palette.primary }} />
          </Box>
        ) : (
          <>
            {/* ================= COURSES GRID ================= */}
            {!selectedCourse && (
              <Grid container spacing={3}>
                {courses.map((course) => (
                  <Grid item xs={12} sm={6} md={4} key={course.id}>
                    <Card
                      sx={{
                        background: 'rgba(8, 69, 112, 0.4)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid rgba(37,154,203,0.3)`,
                        borderRadius: 3,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                          borderColor: palette.primary
                        }
                      }}
                    >
                      <CardContent sx={{ pb: 1, px: 2.5 }}>
                        <Typography sx={{ fontWeight: 700, color: '#fff', mb: 1, fontSize: '1.1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {course.title}
                        </Typography>
                        <Typography sx={{ color: palette.textSec, fontSize: 14, mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px' }}>
                          {course.shortDescription || (ar ? 'لا يوجد وصف قصير' : 'No short description')}
                        </Typography>
                        <Chip
                          label={course.status}
                          size="small"
                          sx={{
                            background: course.status === "PUBLISHED" ? 'rgba(74, 222, 128, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: course.status === "PUBLISHED" ? '#4ade80' : '#f59e0b',
                            fontWeight: 'bold'
                          }}
                        />
                      </CardContent>
                      <Divider sx={{ borderColor: 'rgba(37,154,203,0.3)', my: 1 }} />
                      <CardActions sx={{ display: 'flex', justifyContent: 'space-between', px: 2.5, pb: 2.5 }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => openCourse(course)}
                          sx={{ borderColor: palette.primary, color: palette.primary, '&:hover': { background: 'rgba(48,192,242,0.1)' } }}
                        >
                          {ar ? 'إدارة المحتوى' : 'Manage Content'}
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={publishing === course.id ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                          onClick={() => publish(course.id)}
                          disabled={publishing === course.id || course.status === "PUBLISHED"}
                          sx={{ 
                            background: course.status === "PUBLISHED" ? '#4ade80' : `linear-gradient(135deg, ${palette.primary}, ${palette.border})`,
                            color: '#000', fontWeight: 'bold',
                            '&.Mui-disabled': { background: 'rgba(255,255,255,0.1)', color: palette.textSec }
                          }}
                        >
                          {course.status === "PUBLISHED" ? (ar ? 'منشور' : 'Published') : (ar ? 'نشر الكورس' : 'Publish')}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
                {courses.length === 0 && (
                  <Grid item xs={12}>
                     <Box sx={{ textAlign: 'center', py: { xs: 6, md: 10 }, color: palette.textSec }}>
                        <Typography variant="h6">{ar ? 'لا توجد كورسات متاحة' : 'No courses available'}</Typography>
                     </Box>
                  </Grid>
                )}
              </Grid>
            )}

            {/* ================= COURSE BUILDER ================= */}
            {selectedCourse && (
              <Box>
                {selectedCourse.sections?.map((section: any, index: number) => (
                  <Paper 
                    key={section.id} 
                    sx={{ 
                      mb: { xs: 2.5, md: 3 }, 
                      background: 'rgba(8, 69, 112, 0.3)', 
                      backdropFilter: 'blur(10px)',
                      border: `1px solid rgba(37,154,203,0.3)`, 
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Section Header */}
                    <Box sx={{ p: { xs: 2, md: 2.5 }, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(37,154,203,0.3)` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FolderOpen sx={{ color: palette.primary, fontSize: { xs: '1.3rem', md: '1.5rem' } }} />
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                          {ar ? 'القسم' : 'Section'} {index + 1}: {section.title}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenAddLesson(section)}
                        sx={{ background: 'rgba(48,192,242,0.1)', color: palette.primary, boxShadow: 'none', '&:hover': { background: 'rgba(48,192,242,0.2)', boxShadow: 'none' }, minWidth: {xs: 40, md: 120} }}
                      >
                        {ar ? 'إضافة درس' : 'Add Lesson'}
                      </Button>
                    </Box>

                    {/* Lessons List */}
                    <List sx={{ p: 0 }}>
                      {section.lessons?.map((lesson: any, lIndex: number) => (
                        <Box key={lesson.id}>
                          <ListItem 
                             sx={{ 
                                py: 1.5, 
                                px: { xs: 2.5, md: 3 }, 
                                pr: { xs: 12, md: 15 },
                                '&:hover': { background: 'rgba(255,255,255,0.03)' },
                                transition: 'background 0.2s',
                                opacity: lesson.isPublished === false ? 0.6 : 1 
                             }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <PlayCircleOutline sx={{ color: palette.primary, fontSize: '1.3rem' }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={`${lIndex + 1}. ${lesson.title}`} 
                              primaryTypographyProps={{ 
                                color: lesson.isPublished === false ? palette.textSec : '#e4e4e7',
                                fontWeight: 600, 
                                fontSize: '0.95rem' 
                              }}
                              sx={{ m: 0 }}
                              secondary={
                                <Box sx={{ display: 'flex', gap: 1, marginTop: '6px' }}>
                                  {lesson.isFreePreview && (
                                    <Chip 
                                        size="small" 
                                        icon={<LockOpenOutlined sx={{ fontSize: '14px !important' }}/>}
                                        label={ar ? "معاينة" : "Preview"}
                                        sx={{ 
                                            background: 'rgba(74,222,128,0.1)',
                                            color: '#4ade80',
                                            fontWeight: 'bold', 
                                            height: 20,
                                            '& .MuiChip-label': { px: 1 },
                                            '& .MuiChip-icon': { ml: '4px' },
                                            border: '1px solid rgba(74,222,128,0.3)'
                                        }} 
                                    />
                                  )}
                                  {lesson.isPublished === false && (
                                    <Chip 
                                        size="small" 
                                        icon={<VisibilityOff sx={{ fontSize: '14px !important' }}/>}
                                        label={ar ? "مخفي" : "Hidden"}
                                        sx={{ 
                                            background: 'rgba(245,158,11,0.1)',
                                            color: '#f59e0b',
                                            fontWeight: 'bold', 
                                            height: 20,
                                            '& .MuiChip-label': { px: 1 },
                                            '& .MuiChip-icon': { ml: '4px' },
                                            border: '1px solid rgba(245,158,11,0.3)'
                                        }} 
                                    />
                                  )}
                                </Box>
                              }
                            />
                            
                            <ListItemSecondaryAction sx={{ right: { xs: 16, md: 24 } }}>
                              <Button
                                size="small"
                                startIcon={<EditRounded sx={{ fontSize: '1.1rem !important' }} />}
                                onClick={() => handleOpenEditLesson(section, lesson)}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  px: { xs: 1.5, md: 2 },
                                  color: palette.textMain,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: `1px solid rgba(48,192,242,0.3)`,
                                  backdropFilter: 'blur(10px)',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    color: '#000',
                                    background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`,
                                    borderColor: 'transparent',
                                    boxShadow: `0 4px 15px rgba(48,192,242,0.4)`,
                                  }
                                }}
                              >
                                {ar ? 'تعديل' : 'Edit'}
                              </Button>
                            </ListItemSecondaryAction>
                          </ListItem>
                          {lIndex !== section.lessons.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                        </Box>
                      ))}
                      {(!section.lessons || section.lessons.length === 0) && (
                         <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography sx={{ color: palette.textSec, fontSize: '0.9rem' }}>
                              {ar ? 'لا توجد دروس في هذا القسم بعد.' : 'No lessons in this section yet.'}
                            </Typography>
                         </Box>
                      )}
                    </List>
                  </Paper>
                ))}

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    size="large"
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setSectionDialog(true)}
                    sx={{ 
                      borderStyle: 'dashed', 
                      borderWidth: 2, 
                      borderColor: palette.border, 
                      color: palette.textMain,
                      py: 1.5,
                      px: 4,
                      borderRadius: 3,
                      '&:hover': { borderColor: palette.primary, color: palette.primary, background: 'rgba(48,192,242,0.1)' }
                    }}
                  >
                    {ar ? 'إضافة قسم جديد' : 'Add New Section'}
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* ================= SECTION DIALOG ================= */}
      <Dialog 
        open={sectionDialog} 
        onClose={() => !isSubmitting && setSectionDialog(false)}
        PaperProps={{ sx: { background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3, minWidth: { xs: '90%', sm: 400 } } }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {ar ? 'إضافة قسم جديد' : 'Add New Section'}
          <IconButton onClick={() => setSectionDialog(false)} disabled={isSubmitting} size="small" sx={{ color: palette.textSec }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            label={ar ? "عنوان القسم" : "Section Title"}
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            disabled={isSubmitting}
            sx={{ 
              mt: 2, 
              '& .MuiOutlinedInput-root': { 
                '& fieldset': { borderColor: 'rgba(37,154,203,0.5)' }, 
                '&:hover fieldset': { borderColor: palette.primary }, 
                '&.Mui-focused fieldset': { borderColor: palette.primary } 
              } 
            }}
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: palette.textSec } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setSectionDialog(false)} disabled={isSubmitting} sx={{ color: palette.textSec }}>
            {ar ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={addSection} 
            disabled={isSubmitting || !sectionTitle.trim()} 
            variant="contained" 
            sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 'bold' }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (ar ? 'إضافة' : 'Add Section')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= LESSON DIALOG (ADD & EDIT) ================= */}
      <Dialog 
        open={lessonDialog} 
        onClose={() => !isSubmitting && setLessonDialog(false)}
        PaperProps={{ sx: { background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3, minWidth: { xs: '90%', sm: 480 } } }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editLessonId 
            ? (ar ? 'تعديل الدرس' : 'Edit Lesson') 
            : (ar ? 'إضافة درس جديد' : 'Add New Lesson')
          }
          <IconButton onClick={() => setLessonDialog(false)} disabled={isSubmitting} size="small" sx={{ color: palette.textSec }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            label={ar ? "عنوان الدرس" : "Lesson Title"}
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            disabled={isSubmitting}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(37,154,203,0.5)' }, '&:hover fieldset': { borderColor: palette.primary }, '&.Mui-focused fieldset': { borderColor: palette.primary } } }}
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: palette.textSec } }}
          />

          <TextField
            fullWidth
            label={ar ? "رابط فيديو يوتيوب (اختياري)" : "YouTube Video URL (Optional)"}
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            disabled={isSubmitting}
            placeholder="https://youtu.be/..."
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(37,154,203,0.5)' }, '&:hover fieldset': { borderColor: palette.primary }, '&.Mui-focused fieldset': { borderColor: palette.primary } } }}
            InputProps={{ sx: { color: '#fff' } }}
            InputLabelProps={{ sx: { color: palette.textSec } }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  disabled={isSubmitting}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: palette.primary }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: palette.primary } }}
                />
              }
              label={
                <Typography sx={{ color: '#fff', fontSize: '0.95rem' }}>
                  {ar ? 'نشر الدرس (يظهر للطلاب)' : 'Publish Lesson (Visible to students)'}
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isPreview}
                  onChange={(e) => setIsPreview(e.target.checked)}
                  disabled={isSubmitting}
                  color="success"
                />
              }
              label={
                <Typography sx={{ color: '#fff', fontSize: '0.95rem' }}>
                  {ar ? 'معاينة مجانية (متاح للجميع بدون اشتراك)' : 'Free Preview (Available to all)'}
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setLessonDialog(false)} disabled={isSubmitting} sx={{ color: palette.textSec }}>
            {ar ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={saveLesson} 
            disabled={isSubmitting || !lessonTitle.trim()} 
            variant="contained" 
            sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 'bold' }}
          >
            {isSubmitting 
              ? <CircularProgress size={24} color="inherit" /> 
              : (editLessonId ? (ar ? 'حفظ التعديلات' : 'Save Changes') : (ar ? 'إضافة الدرس' : 'Add Lesson'))
            }
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}