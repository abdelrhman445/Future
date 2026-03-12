'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, 
  CircularProgress, TextField, MenuItem, Select, FormControl, 
  InputLabel, Checkbox, ListItemText, OutlinedInput
} from '@mui/material';
import Navbar from '@/components/layout/Navbar'; // تأكد من مسار النافبار بتاعك
import toast from 'react-hot-toast';
import { presentationApi } from '@/lib/api';

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

  if (loading) return <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#0a0a0f' }}><CircularProgress sx={{ color: '#30c0f2' }} /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0f', pb: 10 }}>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#a8eff9', textAlign: 'center' }}>
          {ar ? "طلب محاضرة تعريفية" : "Request a Presentation"}
        </Typography>

        <Card sx={{ bgcolor: '#084570', border: '1px solid #259acb', borderRadius: 4, boxShadow: '0 8px 32px rgba(8, 69, 112, 0.5)' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                
                {/* عنوان المحاضرة */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={ar ? "عنوان المحاضرة *" : "Presentation Title *"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    InputProps={{ sx: { color: '#a0ddf1', bgcolor: 'rgba(255,255,255,0.05)' } }}
                    InputLabelProps={{ sx: { color: '#83d9f7' } }}
                    sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#259acb' }, '&:hover fieldset': { borderColor: '#a8eff9' } } }}
                  />
                </Grid>

                {/* اختيار الأشخاص */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#259acb' }, '&:hover fieldset': { borderColor: '#a8eff9' } } }}>
                    <InputLabel sx={{ color: '#83d9f7' }}>{ar ? "اختر الحضور (أعضاء فريقك) *" : "Select Attendees *"}</InputLabel>
                    <Select
                      multiple
                      value={selectedAttendees}
                      onChange={(e) => setSelectedAttendees(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                      input={<OutlinedInput label={ar ? "اختر الحضور (أعضاء فريقك) *" : "Select Attendees *"} />}
                      renderValue={(selected) => selected.length + (ar ? ' أشخاص' : ' selected')}
                      sx={{ color: '#a0ddf1', bgcolor: 'rgba(255,255,255,0.05)' }}
                    >
                      {referrals.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          <Checkbox checked={selectedAttendees.indexOf(user.id) > -1} sx={{ color: '#259acb', '&.Mui-checked': { color: '#30c0f2' } }} />
                          <ListItemText primary={`${user.firstName} ${user.lastName}`} />
                        </MenuItem>
                      ))}
                      {referrals.length === 0 && <MenuItem disabled>{ar ? "لا يوجد أعضاء مسجلين بكودك" : "No referrals found"}</MenuItem>}
                    </Select>
                  </FormControl>
                </Grid>

                {/* اختيار الـ Inspector */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#259acb' }, '&:hover fieldset': { borderColor: '#a8eff9' } } }}>
                    <InputLabel sx={{ color: '#83d9f7' }}>{ar ? "اختر المحاضر (Inspector) *" : "Select Inspector *"}</InputLabel>
                    <Select
                      value={selectedInspector}
                      onChange={(e) => setSelectedInspector(e.target.value)}
                      input={<OutlinedInput label={ar ? "اختر المحاضر (Inspector) *" : "Select Inspector *"} />}
                      sx={{ color: '#a0ddf1', bgcolor: 'rgba(255,255,255,0.05)' }}
                    >
                      {inspectors.map((ins) => (
                        <MenuItem key={ins.id} value={ins.id}>{ins.firstName} {ins.lastName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* الميعاد */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label={ar ? "موعد المحاضرة المقترح *" : "Proposed Time *"}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    InputLabelProps={{ shrink: true, sx: { color: '#83d9f7' } }}
                    InputProps={{ sx: { color: '#a0ddf1', bgcolor: 'rgba(255,255,255,0.05)' } }}
                    sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#259acb' }, '&:hover fieldset': { borderColor: '#a8eff9' } } }}
                  />
                </Grid>

                {/* رسالة للمحاضر */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label={ar ? "رسالة أو ملاحظات للمحاضر (اختياري)" : "Message/Notes (Optional)"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    InputProps={{ sx: { color: '#a0ddf1', bgcolor: 'rgba(255,255,255,0.05)' } }}
                    InputLabelProps={{ sx: { color: '#83d9f7' } }}
                    sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#259acb' }, '&:hover fieldset': { borderColor: '#a8eff9' } } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #30c0f2, #259acb)',
                      color: '#084570',
                      '&:hover': { background: 'linear-gradient(135deg, #a8eff9, #83d9f7)' }
                    }}
                  >
                    {isSubmitting ? <CircularProgress size={24} sx={{ color: '#084570' }} /> : (ar ? "إرسال الطلب" : "Send Request")}
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