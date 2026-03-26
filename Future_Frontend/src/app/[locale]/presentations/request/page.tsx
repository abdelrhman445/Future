'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, 
  CircularProgress, TextField, MenuItem, Select, FormControl, 
  InputLabel, Checkbox, ListItemText, OutlinedInput, InputAdornment
} from '@mui/material';
import { 
  TitleRounded, GroupRounded, RecordVoiceOverRounded, 
  EditCalendarRounded, ChatBubbleOutlineRounded, SendRounded 
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar'; 
import toast from 'react-hot-toast';
import { presentationApi } from '@/lib/api';

// 🔴 نظام الألوان الفضائي
const palette = {
  bg: '#0a0a0f',
  cardBg: '#084570',
  border: '#259acb',
  primary: '#30c0f2',
  primaryHover: '#83d9f7',
  textMain: '#a8eff9',
  textSec: '#a0ddf1',
  danger: '#e62f76'
};

// 🔴 إعدادات الأنيميشن (حركة انسيابية)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { type: "spring", stiffness: 120, damping: 15 } 
  }
};

export default function RequestPresentation() {
  const { locale } = useParams() as { locale: string };
  const ar = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [referrals, setReferrals] = useState<any[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);

  // Form State
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [selectedInspector, setSelectedInspector] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [refsRes, insRes] = await Promise.all([
        presentationApi.myReferrals(),
        presentationApi.inspectors()
      ]);
      setReferrals(refsRes.data?.data || refsRes.data || []);
      setInspectors(insRes.data?.data || insRes.data || []);
    } catch (error) {
      toast.error(ar ? "حدث خطأ في تحميل البيانات" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedInspector || !scheduledAt || selectedAttendees.length === 0) {
      toast.error(ar ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await presentationApi.sendInvite({
        inspectorId: selectedInspector,
        attendeeIds: selectedAttendees,
        title,
        message,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      toast.success(ar ? "تم إرسال طلب المحاضرة بنجاح!" : "Presentation request sent successfully!");
      // تفريغ الحقول بعد الإرسال
      setTitle(''); setMessage(''); setScheduledAt(''); setSelectedAttendees([]); setSelectedInspector('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || (ar ? "فشل الإرسال" : "Failed to send request"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: palette.bg }}><CircularProgress sx={{ color: palette.primary }} /></Box>;

  // 🔴 تنسيق موحد لحقول الإدخال الدائرية
  const inputStyles = {
    '& .MuiOutlinedInput-root': { 
      borderRadius: '50px', // كبسولة دائرية
      background: 'rgba(0,0,0,0.4)',
      color: '#fff',
      fontWeight: 600,
      transition: 'all 0.3s',
      '& fieldset': { borderColor: palette.border }, 
      '&:hover fieldset': { borderColor: palette.primaryHover }, 
      '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2, boxShadow: `0 0 20px rgba(48,192,242,0.3)` } 
    },
    '& .MuiInputLabel-root': { color: palette.textSec, fontWeight: 600 },
    '& .MuiInputLabel-root.Mui-focused': { color: palette.primary }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: palette.bg, pb: 10, position: 'relative', overflow: 'hidden' }}>
      
      {/* 🌌 تأثير الألوان السايحة في الخلفية (Sci-Fi Glow) */}
      <Box sx={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: `radial-gradient(circle, ${palette.cardBg} 0%, transparent 70%)`, filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none', opacity: 0.6 }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '60%', height: '60%', background: `radial-gradient(circle, ${palette.primary} 0%, transparent 70%)`, filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none', opacity: 0.15 }} />

      <Navbar />
      
      <Container 
        maxWidth="md" 
        sx={{ py: 6, position: 'relative', zIndex: 1 }}
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <Box component={motion.div} variants={itemVariants} sx={{ mb: 5, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, background: `linear-gradient(135deg, #fff, ${palette.textMain})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.5, textShadow: `0 0 40px ${palette.primaryHover}` }}>
            {ar ? "طلب محاضرة تعريفية" : "Request a Presentation"}
          </Typography>
          <Typography sx={{ color: palette.textSec, fontSize: '1.15rem', fontWeight: 500, opacity: 0.9 }}>
            {ar ? "رتب موعداً مع أحد خبرائنا لتقديم عرض احترافي لفريقك" : "Schedule a professional presentation for your team with our experts"}
          </Typography>
        </Box>

        <Card component={motion.div} variants={itemVariants} sx={{ 
          background: `linear-gradient(135deg, rgba(8,69,112,0.4) 0%, rgba(10,10,15,0.7) 100%)`, 
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(37,154,203,0.4)`, 
          borderRadius: '40px', // كارت دائري الحواف
          boxShadow: `0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(48,192,242,0.1)`,
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: { xs: 3, md: 6 } }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                
                {/* عنوان المحاضرة */}
                <Grid item xs={12} component={motion.div} variants={itemVariants}>
                  <TextField
                    fullWidth
                    label={ar ? "عنوان المحاضرة *" : "Presentation Title *"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={inputStyles}
                    InputProps={{
                      // 🔴 تم إضافة mx: 1 لضبط مسافة الأيقونة
                      startAdornment: <InputAdornment position="start" sx={{ mx: 1 }}><TitleRounded sx={{ color: palette.primary }} /></InputAdornment>,
                    }}
                  />
                </Grid>

                {/* اختيار الأشخاص */}
                <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
                  <FormControl fullWidth sx={inputStyles}>
                    <InputLabel>{ar ? "اختر الحضور (أعضاء فريقك) *" : "Select Attendees *"}</InputLabel>
                    <Select
                      multiple
                      value={selectedAttendees}
                      onChange={(e) => setSelectedAttendees(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                      input={<OutlinedInput label={ar ? "اختر الحضور (أعضاء فريقك) *" : "Select Attendees *"} 
                              // 🔴 تم إضافة mx: 1 لضبط مسافة الأيقونة
                              startAdornment={<InputAdornment position="start" sx={{ mx: 1 }}><GroupRounded sx={{ color: palette.primary }} /></InputAdornment>} 
                            />}
                      renderValue={(selected) => <Typography sx={{ fontWeight: 600 }}>{selected.length + (ar ? ' أشخاص' : ' selected')}</Typography>}
                      MenuProps={{ PaperProps: { sx: { bgcolor: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: '24px', mt: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.8)' } } }}
                    >
                      {referrals.map((user) => (
                        <MenuItem key={user.id} value={user.id} sx={{ '&:hover': { bgcolor: 'rgba(48,192,242,0.1)' } }}>
                          <Checkbox checked={selectedAttendees.indexOf(user.id) > -1} sx={{ color: palette.border, '&.Mui-checked': { color: palette.primary } }} />
                          <ListItemText primary={`${user.firstName} ${user.lastName}`} primaryTypographyProps={{ fontWeight: 600, color: '#fff' }} />
                        </MenuItem>
                      ))}
                      {referrals.length === 0 && <MenuItem disabled sx={{ color: palette.textSec }}>{ar ? "لا يوجد أعضاء مسجلين بكودك" : "No referrals found"}</MenuItem>}
                    </Select>
                  </FormControl>
                </Grid>

                {/* اختيار الـ Inspector */}
                <Grid item xs={12} md={6} component={motion.div} variants={itemVariants}>
                  <FormControl fullWidth sx={inputStyles}>
                    <InputLabel>{ar ? "اختر المحاضر (Inspector) *" : "Select Inspector *"}</InputLabel>
                    <Select
                      value={selectedInspector}
                      onChange={(e) => setSelectedInspector(e.target.value)}
                      input={<OutlinedInput label={ar ? "اختر المحاضر (Inspector) *" : "Select Inspector *"} 
                              // 🔴 تم إضافة mx: 1 لضبط مسافة الأيقونة
                              startAdornment={<InputAdornment position="start" sx={{ mx: 1 }}><RecordVoiceOverRounded sx={{ color: palette.primary }} /></InputAdornment>}
                            />}
                      MenuProps={{ PaperProps: { sx: { bgcolor: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: '24px', mt: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.8)' } } }}
                    >
                      {inspectors.map((ins) => (
                        <MenuItem key={ins.id} value={ins.id} sx={{ fontWeight: 600, color: '#fff', py: 1.5, '&:hover': { bgcolor: 'rgba(48,192,242,0.1)' } }}>
                          {ins.firstName} {ins.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* الميعاد */}
                <Grid item xs={12} component={motion.div} variants={itemVariants}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label={ar ? "موعد المحاضرة المقترح *" : "Proposed Time *"}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ ...inputStyles, colorScheme: 'dark' }} 
                    InputProps={{
                      // 🔴 تم إضافة mx: 1 لضبط مسافة الأيقونة
                      startAdornment: <InputAdornment position="start" sx={{ mx: 1 }}><EditCalendarRounded sx={{ color: palette.primary }} /></InputAdornment>,
                    }}
                  />
                </Grid>

                {/* رسالة للمحاضر */}
                <Grid item xs={12} component={motion.div} variants={itemVariants}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label={ar ? "رسالة أو ملاحظات للمحاضر (اختياري)" : "Message/Notes (Optional)"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    sx={{ 
                      ...inputStyles, 
                      '& .MuiOutlinedInput-root': { 
                        ...inputStyles['& .MuiOutlinedInput-root'], 
                        borderRadius: '24px' // الحقل المتعدد بياخد حواف أقل دائرية
                      } 
                    }}
                    InputProps={{
                      // 🔴 تم إضافة mx: 1 لضبط مسافة الأيقونة
                      startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1, mx: 1 }}><ChatBubbleOutlineRounded sx={{ color: palette.primary }} /></InputAdornment>,
                    }}
                  />
                </Grid>

                {/* زرار الإرسال */}
                <Grid item xs={12} component={motion.div} variants={itemVariants} sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={!isSubmitting && <SendRounded />}
                    sx={{
                      py: 2,
                      gap: 1.5, // 🔴 إضافة مسافة واضحة بين الأيقونة والنص
                      '& .MuiButton-startIcon': { margin: 0 }, // 🔴 إلغاء الهامش الافتراضي المزعج في الـ RTL
                      fontSize: '1.15rem',
                      fontWeight: 900,
                      borderRadius: '50px', // كبسولة دائرية
                      background: palette.primary,
                      color: '#000',
                      boxShadow: `0 0 20px rgba(48,192,242,0.4)`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        background: palette.primaryHover, 
                        transform: 'translateY(-3px)',
                        boxShadow: `0 8px 30px rgba(48,192,242,0.6)` 
                      },
                      '&.Mui-disabled': { background: 'rgba(8,69,112,0.5)', color: 'rgba(255,255,255,0.3)', boxShadow: 'none' }
                    }}
                  >
                    {isSubmitting ? <CircularProgress size={28} sx={{ color: '#000' }} /> : (ar ? "إرسال الطلب الآن" : "Send Request Now")}
                  </Button>
                </Grid>

              </Grid>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}