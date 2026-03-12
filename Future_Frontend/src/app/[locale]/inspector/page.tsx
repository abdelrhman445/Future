'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, 
  CircularProgress, Chip, Divider
} from '@mui/material';
import Navbar from '@/components/layout/Navbar';
import toast from 'react-hot-toast';
import { presentationApi } from '@/lib/api';

export default function InspectorDashboard() {
  const { locale } = useParams() as { locale: string };
  const ar = locale === 'ar';

  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const res = await presentationApi.myReceivedInvites();
      setInvites(res.data?.data || res.data || []);
    } catch (error) {
      toast.error(ar ? "فشل تحميل الطلبات" : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    setActionLoading(id);
    try {
      await presentationApi.respond(id, { status });
      toast.success(ar ? `تم ${status === 'ACCEPTED' ? 'قبول' : 'رفض'} الطلب` : `Invite ${status.toLowerCase()}`);
      fetchInvites(); // تحديث القائمة
    } catch (error) {
      toast.error(ar ? "حدث خطأ" : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#0a0a0f' }}><CircularProgress sx={{ color: '#30c0f2' }} /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0f', pb: 10 }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#a8eff9' }}>
          {ar ? "لوحة تحكم المحاضر (Inspector)" : "Inspector Dashboard"}
        </Typography>

        <Grid container spacing={3}>
          {invites.length === 0 ? (
            <Grid item xs={12}>
              <Typography sx={{ color: '#a0ddf1', textAlign: 'center', mt: 5 }}>
                {ar ? "لا توجد طلبات محاضرات حالياً." : "No presentation requests at the moment."}
              </Typography>
            </Grid>
          ) : (
            invites.map((invite) => (
              <Grid item xs={12} md={6} key={invite.id}>
                <Card sx={{ bgcolor: '#084570', border: '1px solid #259acb', borderRadius: 3, position: 'relative' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: '#a8eff9', fontWeight: 'bold' }}>
                        {invite.title}
                      </Typography>
                      <Chip 
                        label={invite.status} 
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: invite.status === 'PENDING' ? 'rgba(48, 192, 242, 0.2)' : invite.status === 'ACCEPTED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(230, 47, 118, 0.2)',
                          color: invite.status === 'PENDING' ? '#30c0f2' : invite.status === 'ACCEPTED' ? '#4ade80' : '#e62f76',
                          border: `1px solid ${invite.status === 'PENDING' ? '#30c0f2' : invite.status === 'ACCEPTED' ? '#4ade80' : '#e62f76'}`
                        }} 
                      />
                    </Box>
                    
                    <Typography sx={{ color: '#a0ddf1', fontSize: '0.9rem', mb: 1 }}>
                      <strong>{ar ? "المرسل:" : "Sender:"}</strong> {invite.sender.firstName} {invite.sender.lastName}
                    </Typography>
                    <Typography sx={{ color: '#a0ddf1', fontSize: '0.9rem', mb: 1 }}>
                      <strong>{ar ? "الموعد المقترح:" : "Scheduled At:"}</strong> {new Date(invite.scheduledAt).toLocaleString(ar ? 'ar-EG' : 'en-US')}
                    </Typography>
                    
                    {invite.message && (
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 1.5, borderRadius: 2, mt: 2, mb: 2 }}>
                        <Typography sx={{ color: '#83d9f7', fontSize: '0.85rem', fontStyle: 'italic' }}>"{invite.message}"</Typography>
                      </Box>
                    )}

                    <Divider sx={{ borderColor: '#259acb', my: 2 }} />
                    
                    <Typography sx={{ color: '#a8eff9', fontSize: '0.9rem', mb: 1, fontWeight: 'bold' }}>
                      {ar ? `الحضور (${invite.attendees.length}):` : `Attendees (${invite.attendees.length}):`}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {invite.attendees.map((att: any) => (
                        <Chip key={att.id} label={att.firstName} size="small" sx={{ bgcolor: 'rgba(160, 221, 241, 0.1)', color: '#a0ddf1', border: '1px solid #83d9f7' }} />
                      ))}
                    </Box>

                    {invite.status === 'PENDING' && (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button 
                          fullWidth 
                          variant="contained" 
                          onClick={() => handleResponse(invite.id, 'ACCEPTED')}
                          disabled={actionLoading === invite.id}
                          sx={{ bgcolor: '#30c0f2', color: '#084570', fontWeight: 'bold', '&:hover': { bgcolor: '#83d9f7' } }}
                        >
                          {actionLoading === invite.id ? <CircularProgress size={20} /> : (ar ? "قبول" : "Accept")}
                        </Button>
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          onClick={() => handleResponse(invite.id, 'DECLINED')}
                          disabled={actionLoading === invite.id}
                          sx={{ color: '#e62f76', borderColor: '#e62f76', fontWeight: 'bold', '&:hover': { bgcolor: 'rgba(230, 47, 118, 0.1)', borderColor: '#e62f76' } }}
                        >
                          {ar ? "رفض" : "Decline"}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </Box>
  );
}