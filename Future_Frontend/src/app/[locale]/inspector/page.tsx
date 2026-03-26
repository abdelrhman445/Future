'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, 
  CircularProgress, Chip, Divider
} from '@mui/material';
import { 
  EventNoteRounded, PersonRounded, ChatBubbleOutlineRounded, 
  CheckRounded, CloseRounded, CoPresentRounded 
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
  danger: '#e62f76',
  success: '#4ade80'
};

// 🔴 إعدادات الأنيميشن (حركة انسيابية)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
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

  if (loading) return <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: palette.bg }}><CircularProgress sx={{ color: palette.primary }} /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: palette.bg, pb: 10, position: 'relative', overflow: 'hidden' }}>
      
      {/* 🌌 تأثير الألوان السايحة في الخلفية (Sci-Fi Glow) */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: `radial-gradient(circle, ${palette.cardBg} 0%, transparent 70%)`, filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none', opacity: 0.6 }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: `radial-gradient(circle, ${palette.primary} 0%, transparent 70%)`, filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none', opacity: 0.15 }} />

      <Navbar />
      
      <Container 
        maxWidth="lg" 
        sx={{ py: 6, position: 'relative', zIndex: 1 }}
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <Box component={motion.div} variants={itemVariants} sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, background: `linear-gradient(135deg, #fff, ${palette.textMain})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.5, textShadow: `0 0 40px ${palette.primaryHover}` }}>
            {ar ? "لوحة تحكم المحاضر " : "Inspector Dashboard"}
          </Typography>
          <Typography sx={{ color: palette.textSec, fontSize: '1.15rem', fontWeight: 500, opacity: 0.9 }}>
            {ar ? "قم بإدارة طلبات العروض التقديمية وتحديد مواعيدها" : "Manage presentation requests and schedule your meetings"}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {invites.length === 0 ? (
            <Grid item xs={12} component={motion.div} variants={itemVariants}>
              <Box sx={{ 
                textAlign: 'center', py: 10, background: 'rgba(8,69,112,0.2)', 
                backdropFilter: 'blur(10px)', borderRadius: '40px', border: `1px dashed rgba(37,154,203,0.4)` 
              }}>
                <CoPresentRounded sx={{ fontSize: 80, color: palette.primary, opacity: 0.2, mb: 2 }} />
                <Typography variant="h5" sx={{ color: palette.textMain, fontWeight: 800 }}>
                  {ar ? "لا توجد طلبات محاضرات حالياً." : "No presentation requests at the moment."}
                </Typography>
              </Box>
            </Grid>
          ) : (
            invites.map((invite) => (
              <Grid item xs={12} md={6} key={invite.id} component={motion.div} variants={itemVariants}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, rgba(8,69,112,0.4) 0%, rgba(10,10,15,0.7) 100%)`, 
                  backdropFilter: 'blur(20px)',
                  border: `1px solid rgba(37,154,203,0.3)`, 
                  borderRadius: '40px', // كارت دائري
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: `0 20px 40px rgba(0,0,0,0.5), inset 0 0 15px rgba(48,192,242,0.05)`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { transform: 'translateY(-8px)', borderColor: palette.primary, boxShadow: `0 30px 60px rgba(0,0,0,0.8), inset 0 0 20px rgba(48,192,242,0.15)` }
                }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900, pr: 2, textShadow: `0 0 20px rgba(168,239,249,0.3)` }}>
                        {invite.title}
                      </Typography>
                      <Chip 
                        label={invite.status} 
                        size="small"
                        sx={{
                          fontWeight: 900, px: 1, borderRadius: '50px',
                          bgcolor: invite.status === 'PENDING' ? 'rgba(48, 192, 242, 0.15)' : invite.status === 'ACCEPTED' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(230, 47, 118, 0.15)',
                          color: invite.status === 'PENDING' ? palette.primary : invite.status === 'ACCEPTED' ? palette.success : palette.danger,
                          border: `1px solid ${invite.status === 'PENDING' ? palette.primary : invite.status === 'ACCEPTED' ? palette.success : palette.danger}`,
                          boxShadow: `0 0 10px ${invite.status === 'PENDING' ? palette.primary : invite.status === 'ACCEPTED' ? palette.success : palette.danger}40`
                        }} 
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                      <Typography sx={{ color: palette.textSec, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonRounded sx={{ color: palette.primary, fontSize: 20 }} />
                        <strong style={{ color: palette.textMain }}>{ar ? "المرسل:" : "Sender:"}</strong> {invite.sender.firstName} {invite.sender.lastName}
                      </Typography>
                      <Typography sx={{ color: palette.textSec, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventNoteRounded sx={{ color: palette.primary, fontSize: 20 }} />
                        <strong style={{ color: palette.textMain }}>{ar ? "الموعد المقترح:" : "Scheduled At:"}</strong> {new Date(invite.scheduledAt).toLocaleString(ar ? 'ar-EG' : 'en-US')}
                      </Typography>
                    </Box>
                    
                    {invite.message && (
                      <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', border: `1px dashed rgba(37,154,203,0.3)`, p: 2, borderRadius: '24px', mb: 3 }}>
                        <Typography sx={{ color: palette.textSec, fontSize: '0.9rem', fontStyle: 'italic', display: 'flex', gap: 1 }}>
                          <ChatBubbleOutlineRounded sx={{ color: palette.primaryHover, fontSize: 18, flexShrink: 0 }} />
                          "{invite.message}"
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ borderColor: 'rgba(37,154,203,0.2)', my: 2.5 }} />
                    
                    <Typography sx={{ color: palette.textMain, fontSize: '1rem', mb: 1.5, fontWeight: 900 }}>
                      {ar ? `الحضور (${invite.attendees.length}):` : `Attendees (${invite.attendees.length}):`}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: invite.status === 'PENDING' ? 4 : 1 }}>
                      {invite.attendees.map((att: any) => (
                        <Chip key={att.id} label={att.firstName} size="small" sx={{ bgcolor: 'rgba(10,10,15,0.5)', color: palette.textSec, border: `1px solid rgba(37,154,203,0.3)`, borderRadius: '50px', fontWeight: 600 }} />
                      ))}
                    </Box>

                    {invite.status === 'PENDING' && (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button 
                          fullWidth 
                          variant="contained" 
                          onClick={() => handleResponse(invite.id, 'ACCEPTED')}
                          disabled={actionLoading === invite.id}
                          startIcon={actionLoading !== invite.id && <CheckRounded />}
                          sx={{ 
                            bgcolor: palette.primary, color: '#000', fontWeight: 900, borderRadius: '50px', py: 1.5,
                            gap: 1, '& .MuiButton-startIcon': { margin: 0 },
                            boxShadow: `0 0 15px rgba(48,192,242,0.3)`,
                            '&:hover': { bgcolor: palette.primaryHover, transform: 'scale(1.03)', boxShadow: `0 0 25px rgba(48,192,242,0.5)` },
                            '&.Mui-disabled': { bgcolor: 'rgba(48,192,242,0.3)', color: 'rgba(0,0,0,0.5)' }
                          }}
                        >
                          {actionLoading === invite.id ? <CircularProgress size={24} sx={{ color: '#000' }} /> : (ar ? "قبول" : "Accept")}
                        </Button>
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          onClick={() => handleResponse(invite.id, 'DECLINED')}
                          disabled={actionLoading === invite.id}
                          startIcon={actionLoading !== invite.id && <CloseRounded />}
                          sx={{ 
                            color: palette.danger, borderColor: palette.danger, fontWeight: 900, borderRadius: '50px', py: 1.5,
                            gap: 1, '& .MuiButton-startIcon': { margin: 0 },
                            '&:hover': { bgcolor: 'rgba(230, 47, 118, 0.1)', borderColor: palette.danger, transform: 'scale(1.03)' },
                            '&.Mui-disabled': { borderColor: 'rgba(230, 47, 118, 0.3)', color: 'rgba(230, 47, 118, 0.5)' }
                          }}
                        >
                          {actionLoading === invite.id ? <CircularProgress size={24} sx={{ color: palette.danger }} /> : (ar ? "رفض" : "Decline")}
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