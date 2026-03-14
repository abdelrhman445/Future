'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Card, Grid, Button, CircularProgress, alpha,
  List, ListItem, ListItemAvatar, Avatar, ListItemText, Dialog, DialogTitle,
  DialogContent, TextField, DialogActions, IconButton, Divider, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer
} from '@mui/material';
import {
  AssignmentRounded, SchoolRounded, PersonRounded, CloseRounded, SendRounded, BookRounded, HistoryRounded
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import api, { inspectorApi } from '@/lib/api'; // 🔴 استدعاء api مباشرة
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const palette = {
  bg: '#0a0a0f', cardBg: '#084570', border: '#259acb', primary: '#30c0f2',
  primaryHover: '#83d9f7', textMain: '#a8eff9', textSec: '#a0ddf1', success: '#4ade80',
  danger: '#e62f76', accent: '#f59e0b',
};

export default function InspectorEvaluationsPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const ar = locale === 'ar';
  const { user, isAuthenticated } = useAuthStore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [historyNotes, setHistoryNotes] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated || user?.role !== 'INSPECTOR') {
      toast.error(ar ? 'عفواً، هذه الصفحة مخصصة للمحاضرين فقط' : 'Access Denied');
      router.replace(`/${locale}/dashboard`);
      return;
    }
    fetchMyCourses();
  }, [isMounted, isAuthenticated, user, router, locale, ar]);

  const fetchMyCourses = async () => {
    setLoadingData(true);
    try {
      const res = await inspectorApi.getMyCourses();
      setCourses(res.data?.data || res.data || []);
    } catch (err) {
      toast.error(ar ? 'فشل تحميل الكورسات' : 'Failed to load courses');
    }
    setLoadingData(false);
  };

  // 🔴 استخدام مسار مباشر لتفادي مشاكل ملف api.ts
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/inspector/notes/history');
      setHistoryNotes(res.data?.data || res.data || []);
    } catch (err) {
      toast.error(ar ? 'فشل تحميل سجل التقييمات' : 'Failed to load history');
    }
    setLoadingHistory(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 1 && historyNotes.length === 0) {
      fetchHistory();
    }
  };

  const handleSelectCourse = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setLoadingStudents(true);
    try {
      const res = await inspectorApi.getCourseStudents(courseId);
      setStudents(res.data?.data || res.data || []);
    } catch (err) {
      toast.error(ar ? 'فشل تحميل الطلاب' : 'Failed to load students');
    }
    setLoadingStudents(false);
  };

  const openEvaluationModal = async (student: any) => {
    setSelectedStudent(student);
    setNewNote('');
    setLoadingNotes(true);
    try {
      if (selectedCourseId) {
        const res = await inspectorApi.getStudentNotes(selectedCourseId, student.id);
        setNotes(res.data?.data || res.data || []);
      }
    } catch (err) {
      toast.error(ar ? 'فشل تحميل التقييمات السابقة' : 'Failed to load previous notes');
    }
    setLoadingNotes(false);
  };

  const handleSubmitNote = async () => {
    if (!newNote.trim() || !selectedCourseId || !selectedStudent) return;
    setSubmittingNote(true);
    try {
      const res = await inspectorApi.addNote({
        studentId: selectedStudent.id,
        courseId: selectedCourseId,
        note: newNote.trim()
      });
      toast.success(ar ? 'تم إرسال التقييم بنجاح للطالب' : 'Note sent successfully');
      setNotes([res.data?.data || res.data, ...notes]);
      setNewNote('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'فشل حفظ التقييم' : 'Failed to save note'));
    }
    setSubmittingNote(false);
  };

  if (!isMounted) return <Box sx={{ minHeight: '100vh', bgcolor: palette.bg }} />;

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, pb: 10 }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(palette.primary, 0.1), border: `1px solid ${palette.border}` }}>
            <AssignmentRounded sx={{ fontSize: 40, color: palette.primary }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff', mb: 0.5 }}>
              {ar ? 'تقييم ومتابعة الطلاب' : 'Student Evaluations'}
            </Typography>
            <Typography sx={{ color: palette.textSec }}>
              {ar ? 'أضف تقييماتك للطلاب أو راجع سجل ملاحظاتك السابقة.' : 'Add evaluations or review your past notes.'}
            </Typography>
          </Box>
        </Box>

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ mb: 4, borderBottom: 1, borderColor: alpha(palette.border, 0.3), '& .MuiTab-root': { color: palette.textSec, fontWeight: 700, fontSize: '1.1rem' }, '& .Mui-selected': { color: `${palette.primary} !important` }, '& .MuiTabs-indicator': { backgroundColor: palette.primary, height: 3 } }}
        >
          <Tab icon={<PersonRounded />} iconPosition="start" label={ar ? 'تقييم الطلاب' : 'Evaluate Students'} />
          <Tab icon={<HistoryRounded />} iconPosition="start" label={ar ? 'سجل تقييماتي' : 'My Evaluations History'} />
        </Tabs>

        {activeTab === 0 && (
          loadingData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: palette.primary }} /></Box>
          ) : courses.length === 0 ? (
            <Card sx={{ bgcolor: 'rgba(8,69,112,0.3)', border: `1px dashed ${palette.border}`, borderRadius: 4, p: 6, textAlign: 'center' }}>
              <SchoolRounded sx={{ fontSize: 60, color: palette.textSec, opacity: 0.5, mb: 2 }} />
              <Typography sx={{ color: palette.textMain, fontSize: '1.2rem', fontWeight: 700 }}>
                {ar ? 'لم يتم تعيينك كمحاضر في أي كورس حتى الآن.' : 'You have not been assigned to any course yet.'}
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Typography sx={{ color: palette.textMain, fontWeight: 800, mb: 2, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BookRounded /> {ar ? 'الكورسات المخصصة لك' : 'Your Assigned Courses'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {courses.map((c) => (
                    <Card 
                      key={c.id} 
                      onClick={() => handleSelectCourse(c.id)}
                      sx={{ 
                        p: 2.5, cursor: 'pointer',
                        bgcolor: selectedCourseId === c.id ? alpha(palette.primary, 0.15) : palette.cardBg, 
                        border: `1px solid ${selectedCourseId === c.id ? palette.primary : alpha(palette.border, 0.3)}`, 
                        borderRadius: 3, transition: 'all 0.2s ease',
                        '&:hover': { borderColor: palette.primary, transform: 'translateX(-5px)' }
                      }}
                    >
                      <Typography sx={{ color: '#fff', fontWeight: 800, mb: 1 }}>{c.title}</Typography>
                      <Chip label={c.packageType} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.3)', color: palette.textSec, fontSize: '0.75rem' }} />
                    </Card>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card sx={{ bgcolor: 'rgba(8,69,112,0.2)', border: `1px solid ${alpha(palette.border, 0.2)}`, borderRadius: 4, minHeight: 400, overflow: 'hidden' }}>
                  {!selectedCourseId ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: palette.textSec }}>
                      <PersonRounded sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                      <Typography>{ar ? 'اختر كورس من القائمة لعرض الطلاب' : 'Select a course to view students'}</Typography>
                    </Box>
                  ) : loadingStudents ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><CircularProgress sx={{ color: palette.primary }} /></Box>
                  ) : students.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: palette.textSec }}>
                      <Typography>{ar ? 'لا يوجد طلاب مشتركون في هذا الكورس حالياً' : 'No students enrolled in this course yet'}</Typography>
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(palette.border, 0.2)}`, bgcolor: 'rgba(0,0,0,0.3)' }}>
                        <Typography sx={{ color: palette.primary, fontWeight: 800 }}>
                          {ar ? `قائمة الطلاب (${students.length})` : `Students List (${students.length})`}
                        </Typography>
                      </Box>
                      <List disablePadding>
                        {students.map((student, idx) => (
                          <Box key={student.id}>
                            <ListItem sx={{ py: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: palette.primary, color: '#000', fontWeight: 900 }}>
                                  {student.firstName?.[0]}
                                </Avatar>
                                <Box>
                                  <Typography sx={{ color: '#fff', fontWeight: 800 }}>{student.firstName} {student.lastName}</Typography>
                                  <Typography sx={{ color: palette.textSec, fontSize: '0.85rem' }}>{student.email}</Typography>
                                </Box>
                              </Box>
                              <Button 
                                variant="outlined" 
                                onClick={() => openEvaluationModal(student)}
                                sx={{ borderColor: palette.primary, color: palette.primary, fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: alpha(palette.primary, 0.1) } }}
                              >
                                {ar ? 'تقييم الطالب' : 'Evaluate'}
                              </Button>
                            </ListItem>
                            {idx < students.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                          </Box>
                        ))}
                      </List>
                    </>
                  )}
                </Card>
              </Grid>
            </Grid>
          )
        )}

        {/* ================= TAB 1: سجل التقييمات ================= */}
        {activeTab === 1 && (
          loadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: palette.primary }} /></Box>
          ) : historyNotes.length === 0 ? (
            <Card sx={{ bgcolor: 'rgba(8,69,112,0.3)', border: `1px dashed ${palette.border}`, borderRadius: 4, p: 6, textAlign: 'center' }}>
              <HistoryRounded sx={{ fontSize: 60, color: palette.textSec, opacity: 0.5, mb: 2 }} />
              <Typography sx={{ color: palette.textMain, fontSize: '1.2rem', fontWeight: 700 }}>
                {ar ? 'لم تقم بكتابة أي تقييمات حتى الآن.' : 'You have not written any evaluations yet.'}
              </Typography>
            </Card>
          ) : (
            <Card sx={{ bgcolor: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 4, overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.3)' }}>
                      <TableCell sx={{ color: palette.textMain, fontWeight: 800, borderBottom: `1px solid ${palette.border}` }}>{ar ? 'الطالب' : 'Student'}</TableCell>
                      <TableCell sx={{ color: palette.textMain, fontWeight: 800, borderBottom: `1px solid ${palette.border}` }}>{ar ? 'الكورس' : 'Course'}</TableCell>
                      <TableCell sx={{ color: palette.textMain, fontWeight: 800, borderBottom: `1px solid ${palette.border}` }}>{ar ? 'التقييم/الملاحظة' : 'Evaluation'}</TableCell>
                      <TableCell sx={{ color: palette.textMain, fontWeight: 800, borderBottom: `1px solid ${palette.border}` }}>{ar ? 'التاريخ' : 'Date'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyNotes.map((note) => (
                      <TableRow key={note.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                        <TableCell sx={{ color: '#fff', fontWeight: 700, borderBottom: `1px solid rgba(37,154,203,0.2)` }}>
                          {note.student?.firstName} {note.student?.lastName}
                        </TableCell>
                        <TableCell sx={{ color: palette.primaryHover, borderBottom: `1px solid rgba(37,154,203,0.2)` }}>
                          {note.course?.title}
                        </TableCell>
                        <TableCell sx={{ color: palette.textSec, maxWidth: 300, whiteSpace: 'pre-wrap', borderBottom: `1px solid rgba(37,154,203,0.2)` }}>
                          {note.content}
                        </TableCell>
                        <TableCell sx={{ color: palette.textSec, fontSize: '0.85rem', borderBottom: `1px solid rgba(37,154,203,0.2)` }}>
                          {dayjs(note.createdAt).format('DD/MM/YYYY hh:mm A')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )
        )}
      </Container>

      {/* ================= MODAL: إضافة تقييم ================= */}
      <Dialog 
        open={Boolean(selectedStudent)} 
        onClose={() => !submittingNote && setSelectedStudent(null)}
        PaperProps={{ sx: { background: `linear-gradient(180deg, ${palette.cardBg}, #000)`, border: `1px solid ${palette.primary}`, borderRadius: 4, minWidth: { xs: '95%', sm: 500 }, p: 1 } }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
          {ar ? 'تقييم أداء الطالب' : 'Evaluate Student'}
          <IconButton onClick={() => setSelectedStudent(null)} disabled={submittingNote} sx={{ color: palette.textSec, '&:hover': { color: palette.danger } }}><CloseRounded /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 3, border: `1px dashed ${palette.border}`, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: palette.primary, color: '#000', width: 50, height: 50, fontWeight: 900, fontSize: '1.2rem' }}>
              {selectedStudent?.firstName?.[0]}
            </Avatar>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{selectedStudent?.firstName} {selectedStudent?.lastName}</Typography>
              <Typography sx={{ color: palette.primary }}>{selectedStudent?.email}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              fullWidth multiline rows={4}
              placeholder={ar ? 'اكتب تقييمك والملاحظات التي سيتم إرسالها للطالب هنا...' : 'Write evaluation here...'}
              value={newNote} onChange={(e) => setNewNote(e.target.value)}
              disabled={submittingNote}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff', bgcolor: 'rgba(0,0,0,0.2)', '& fieldset': { borderColor: alpha(palette.border, 0.5) }, '&:hover fieldset': { borderColor: palette.primaryHover }, '&.Mui-focused fieldset': { borderColor: palette.primary } } }}
            />
            <Button 
              onClick={handleSubmitNote} 
              disabled={!newNote.trim() || submittingNote}
              variant="contained" 
              sx={{ alignSelf: 'flex-end', bgcolor: palette.primary, color: '#000', fontWeight: 800, borderRadius: 2, px: 4, py: 1.5, display: 'flex', gap: 1, '&:hover': { bgcolor: palette.primaryHover } }}
            >
              {submittingNote ? <CircularProgress size={20} sx={{ color: '#000' }} /> : (
                <>
                  <SendRounded sx={ar ? {transform: 'rotate(180deg)'} : {}} />
                  {ar ? 'إرسال التقييم للطالب' : 'Send Evaluation'}
                </>
              )}
            </Button>
          </Box>

          <Divider sx={{ borderColor: alpha(palette.border, 0.2) }} />

          <Box>
            <Typography sx={{ color: palette.textSec, fontWeight: 800, mb: 2 }}>{ar ? 'التقييمات السابقة لهذا الطالب' : 'Previous notes for this student'}</Typography>
            {loadingNotes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} sx={{ color: palette.textSec }} /></Box>
            ) : notes.length === 0 ? (
              <Typography sx={{ color: palette.textSec, textAlign: 'center', py: 2, fontStyle: 'italic', opacity: 0.5 }}>
                {ar ? 'لا توجد تقييمات سابقة.' : 'No previous notes.'}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 200, overflowY: 'auto', pr: 1 }}>
                {notes.map((note) => (
                  <Box key={note.id} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
                    <Typography sx={{ color: '#fff', fontSize: '0.95rem', mb: 1, whiteSpace: 'pre-wrap' }}>{note.content}</Typography>
                    <Typography sx={{ color: palette.textSec, fontSize: '0.75rem' }}>{dayjs(note.createdAt).format('DD/MM/YYYY - hh:mm A')}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

        </DialogContent>
      </Dialog>
    </Box>
  );
}