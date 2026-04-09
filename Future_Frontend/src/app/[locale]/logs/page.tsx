'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Pagination, CircularProgress, Chip, Stack, Avatar, alpha
} from '@mui/material';
import { 
  ShieldRounded, HistoryToggleOffRounded, AutoAwesomeRounded,
  DnsRounded, CalendarTodayRounded, FlashOnRounded, AddCircleOutlineRounded,
  DeleteOutlineRounded, EditOutlined, VpnKeyRounded, PersonOutlineRounded
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api'; 

// ================= THEME PALETTE =================
const palette = {
  bg: '#050508',
  cardBg: '#0a111a',
  border: '#259acb',
  primary: '#30c0f2',
  textMain: '#e0f7fa',
  textSec: '#a0ddf1',
  danger: '#ff4b82',
  success: '#10b981',
  warning: '#f59e0b',
};

const pulseAnimation = {
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)', opacity: 1, filter: `drop-shadow(0 0 5px ${alpha(palette.primary, 0.4)})` },
    '50%': { transform: 'scale(1.15)', opacity: 0.6, filter: `drop-shadow(0 0 15px ${alpha(palette.primary, 0.8)})` },
    '100%': { transform: 'scale(1)', opacity: 1, filter: `drop-shadow(0 0 5px ${alpha(palette.primary, 0.4)})` }
  },
  animation: 'pulse 2.5s infinite ease-in-out'
};

const floatAnimation = {
  '@keyframes float': {
    '0%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-10px)' },
    '100%': { transform: 'translateY(0px)' }
  },
  animation: 'float 4s ease-in-out infinite'
};

export default function SystemLogsPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const ar = locale === 'ar';
  const align: 'right' | 'left' = ar ? 'right' : 'left';

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchLogs = async (currentPage: number) => {
    setLoading(true);
    try {
      let validToken = '';
      if (typeof window !== 'undefined') {
        validToken = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
        
        if (!validToken || validToken === 'undefined' || validToken === 'null') {
          const match = document.cookie.match(new RegExp('(^| )(access_token|accessToken)=([^;]+)'));
          if (match) validToken = match[3];
        }
      }

      const requestConfig: any = {
        method: 'GET',
        credentials: 'include', 
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (validToken && validToken !== 'undefined' && validToken !== 'null') {
        requestConfig.headers['Authorization'] = `Bearer ${validToken}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/logs?page=${currentPage}&limit=20`, requestConfig);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error fetching logs');
      }

      setLogs(data.data.logs);
      setTotalPages(data.data.totalPages);
    } catch (error: any) {
      console.error("Log fetch error:", error);
      toast.error(ar ? 'جلسة منتهية أو لا توجد صلاحية' : 'Session expired or Access denied');
      if (error.message?.includes('401') || error.message?.includes('403')) {
        router.push(`/${locale}`); 
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (mounted) fetchLogs(page); }, [page, mounted]);

  const getActionTheme = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add') || act.includes('activate') || act.includes('approve')) return palette.success;
    if (act.includes('delete') || act.includes('remove') || act.includes('fail') || act.includes('deactivate') || act.includes('reject')) return palette.danger;
    if (act.includes('update') || act.includes('edit') || act.includes('change') || act.includes('process')) return palette.warning;
    if (act.includes('login') || act.includes('auth') || act.includes('request')) return palette.primary;
    return palette.textSec;
  };

  const getActionIcon = (action: string, color: string) => {
    const act = action.toLowerCase();
    const iconProps = { sx: { color, fontSize: 18, mr: ar ? -0.5 : 1, ml: ar ? 1 : -0.5 } };
    
    if (act.includes('create') || act.includes('add')) return <AddCircleOutlineRounded {...iconProps} />;
    if (act.includes('delete') || act.includes('remove')) return <DeleteOutlineRounded {...iconProps} />;
    if (act.includes('update') || act.includes('edit')) return <EditOutlined {...iconProps} />;
    if (act.includes('login') || act.includes('auth')) return <VpnKeyRounded {...iconProps} />;
    return <FlashOnRounded {...iconProps} />;
  };

  if (!mounted) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: palette.bg, pt: { xs: 10, md: 14 }, pb: 10, px: { xs: 2, sm: 3, md: 4 }, dir: ar ? 'rtl' : 'ltr', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Gradients */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '20%', width: '60vw', height: '40vh', background: `radial-gradient(ellipse, ${alpha(palette.primary, 0.08)} 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vh', background: `radial-gradient(circle, ${alpha(palette.border, 0.05)} 0%, transparent 60%)`, filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${alpha(palette.bg, 0.5)}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${alpha(palette.border, 0.3)}; border-radius: 10px; border: 1px solid ${alpha('#fff', 0.05)}; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${alpha(palette.primary, 0.6)}; }
      `}} />

      <Box component={motion.div} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} sx={{ maxWidth: 1200, mx: 'auto', position: 'relative', zIndex: 1 }}>
        
        {/* ================= HEADER SECTION ================= */}
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="center" textAlign="center" gap={3} sx={{ mb: { xs: 6, md: 8 } }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar sx={{ 
              bgcolor: alpha(palette.primary, 0.08), 
              color: palette.primary, 
              width: { xs: 70, md: 90 }, 
              height: { xs: 70, md: 90 }, 
              border: `1px solid ${alpha(palette.primary, 0.2)}`,
              boxShadow: `0 0 40px ${alpha(palette.primary, 0.15)}`,
              backdropFilter: 'blur(10px)'
            }}>
              <ShieldRounded sx={{ fontSize: { xs: 36, md: 46 } }} />
            </Avatar>
            <AutoAwesomeRounded sx={{ position: 'absolute', top: -5, right: -5, color: '#fff', fontSize: { xs: 20, md: 24 }, ...pulseAnimation }} />
          </Box>
          <Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 900, 
              background: `linear-gradient(135deg, #ffffff 0%, ${palette.primary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.2rem' },
              mb: 1.5,
              textShadow: `0 10px 30px ${alpha(palette.primary, 0.2)}`
            }}>
              {ar ? 'سجل مراقبة النظام' : 'System Audit Logs'}
            </Typography>
            <Typography variant="body1" sx={{ color: palette.textSec, opacity: 0.85, fontWeight: 500, fontSize: { xs: '0.95rem', md: '1.15rem' }, maxWidth: 650, mx: 'auto', lineHeight: 1.6 }}>
              {ar ? 'تتبع وتحليل العمليات الحساسة وحركات المستخدمين بشكل لحظي لضمان أمان وسلامة النظام.' : 'Track and analyze sensitive operations and user activities in real-time to ensure system security and integrity.'}
            </Typography>
          </Box>
        </Stack>

        {/* ================= TABLE CONTAINER ================= */}
        <TableContainer className="custom-scrollbar" component={Paper} sx={{ 
          background: `linear-gradient(180deg, ${alpha(palette.cardBg, 0.7)} 0%, ${alpha(palette.bg, 0.9)} 100%)`, 
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(palette.border, 0.15)}`, 
          borderRadius: { xs: 4, md: 6 },
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.7), inset 0 1px 0 ${alpha('#fff', 0.05)}`,
          overflowX: 'auto',
          minHeight: 400
        }}>
          
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center', alignItems: 'center', py: 20 }}>
              <CircularProgress size={48} thickness={4} sx={{ color: palette.primary, filter: `drop-shadow(0 0 10px ${alpha(palette.primary, 0.5)})` }} />
              <Typography sx={{ color: palette.textSec, fontWeight: 700, letterSpacing: 1, animation: 'pulse 1.5s infinite', fontSize: '1.1rem' }}>
                {ar ? 'انتظار...' : 'Loading...'}
              </Typography>
            </Box>
          ) : (
            <Table sx={{ minWidth: 900, borderCollapse: 'separate', borderSpacing: '0 4px', p: { xs: 1, md: 2 } }}>
              <TableHead>
                <TableRow>
                  <TableCell align={align} sx={{ color: palette.textSec, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1, py: 3, px: { xs: 2, md: 4 }, width: '22%', borderBottom: `1px solid ${alpha(palette.border, 0.1)}` }}>{ar ? 'نوع الحدث' : 'Event Type'}</TableCell>
                  <TableCell align={align} sx={{ color: palette.textSec, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1, py: 3, px: { xs: 2, md: 4 }, width: '30%', borderBottom: `1px solid ${alpha(palette.border, 0.1)}` }}>{ar ? 'المستخدم (الفاعل)' : 'Actor (User)'}</TableCell>
                  <TableCell align={align} sx={{ color: palette.textSec, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1, py: 3, px: { xs: 2, md: 4 }, width: '25%', borderBottom: `1px solid ${alpha(palette.border, 0.1)}` }}>{ar ? 'الهدف / المورد' : 'Target Resource'}</TableCell>
                  <TableCell align={align} sx={{ color: palette.textSec, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1, py: 3, px: { xs: 2, md: 4 }, width: '23%', borderBottom: `1px solid ${alpha(palette.border, 0.1)}` }}>{ar ? 'التاريخ والوقت' : 'Timestamp'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: { xs: 12, md: 18 }, borderBottom: 'none' }}>
                      <Box sx={{ ...floatAnimation }}>
                        <HistoryToggleOffRounded sx={{ fontSize: { xs: 70, md: 90 }, color: palette.border, opacity: 0.2, mb: 3, filter: `drop-shadow(0 10px 20px ${alpha(palette.primary, 0.1)})` }} />
                        <Typography sx={{ color: palette.textMain, fontWeight: 800, fontSize: { xs: '1.2rem', md: '1.5rem' }, mb: 1 }}>{ar ? 'سجل النظام نظيف تماماً ✨' : 'System logs are completely clean ✨'}</Typography>
                        <Typography sx={{ color: palette.textSec, opacity: 0.6, fontSize: '0.95rem' }}>{ar ? 'لم يتم تسجيل أي حركات أو أحداث حتى الآن.' : 'No actions or events have been recorded yet.'}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, index) => {
                    const actionTheme = getActionTheme(log.action);
                    return (
                      <TableRow key={log.id} sx={{ 
                        transition: 'all 0.3s ease',
                        bgcolor: alpha(palette.bg, 0.4),
                        position: 'relative',
                        '&:hover': { 
                          bgcolor: alpha(palette.cardBg, 0.8),
                          boxShadow: `inset 0 0 0 1px ${alpha(actionTheme, 0.2)}`,
                        },
                        '& td': { 
                          borderBottom: 'none', 
                          py: { xs: 2.5, md: 3 },
                        },
                        '& td:first-of-type': { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
                        '& td:last-of-type': { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
                        animation: `fadeInRow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards ${index * 0.04}s`,
                        opacity: 0,
                        '@keyframes fadeInRow': { 'from': { opacity: 0, transform: 'translateY(10px)' }, 'to': { opacity: 1, transform: 'translateY(0)' } }
                      }}>
                        
                        {/* Action Column */}
                        <TableCell align={align} sx={{ pl: { xs: 2, md: 4 } }}>
                          <Chip 
                            icon={getActionIcon(log.action, actionTheme)}
                            label={log.action.replace(/_/g, ' ')} 
                            sx={{ 
                              bgcolor: alpha(actionTheme, 0.1), 
                              color: actionTheme, 
                              fontWeight: 800, 
                              border: `1px solid ${alpha(actionTheme, 0.2)}`,
                              fontSize: { xs: '0.7rem', md: '0.8rem' },
                              px: 1.5,
                              py: 2.5,
                              borderRadius: '8px',
                              textTransform: 'capitalize',
                              '& .MuiChip-icon': { ml: ar ? 1 : -0.5, mr: ar ? -0.5 : 1 }
                            }} 
                          />
                        </TableCell>
                        
                        {/* User Column */}
                        <TableCell align={align} sx={{ px: { xs: 2, md: 4 } }}>
                          <Stack direction="row" alignItems="center" gap={2}>
                            <Avatar sx={{ 
                              width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, 
                              background: `linear-gradient(135deg, ${alpha(palette.primary, 0.15)}, ${alpha(palette.border, 0.3)})`, 
                              border: `1px solid ${alpha(palette.primary, 0.4)}`,
                              color: palette.textMain, fontSize: { xs: '1rem', md: '1.2rem' }, fontWeight: 900,
                            }}>
                              {log.user?.name ? log.user.name[0]?.toUpperCase() : <PersonOutlineRounded />}
                            </Avatar>
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography noWrap sx={{ color: '#fff', fontWeight: 700, fontSize: { xs: '0.9rem', md: '1rem' }, mb: 0.5 }}>
                                {log.user?.name || 'System Actor'}
                              </Typography>
                              <Typography noWrap sx={{ color: palette.textSec, fontSize: { xs: '0.75rem', md: '0.85rem' }, opacity: 0.8 }}>
                                {log.user?.email || 'automated_process'} 
                                {log.user?.role && <span style={{ color: palette.primary, fontWeight: 800, marginLeft: 4, marginRight: 4 }}>• {log.user.role}</span>}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Resource Column */}
                        <TableCell align={align} sx={{ px: { xs: 2, md: 4 } }}>
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '8px', bgcolor: alpha(palette.border, 0.1), color: palette.textSec }}>
                              <DnsRounded sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography sx={{ color: palette.textMain, fontWeight: 700, fontSize: { xs: '0.9rem', md: '1rem' }, mb: 0.5 }}>
                                {log.resource.replace(/_/g, ' ')}
                              </Typography>
                              {log.resourceId && (
                                <Typography sx={{ 
                                  color: palette.textSec, fontSize: '0.75rem', opacity: 0.7, 
                                  fontFamily: 'monospace', bgcolor: alpha('#fff', 0.05), 
                                  px: 1, py: 0.2, borderRadius: 1, display: 'inline-block' 
                                }}>
                                  ID: {log.resourceId.length > 15 ? `${log.resourceId.substring(0, 15)}...` : log.resourceId}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Date Column */}
                        <TableCell align={align} sx={{ px: { xs: 2, md: 4 } }}>
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '8px', bgcolor: alpha(palette.textSec, 0.1), color: palette.textSec }}>
                              <CalendarTodayRounded sx={{ fontSize: 18 }} />
                            </Box>
                            <Box>
                              <Typography sx={{ color: '#fff', fontSize: { xs: '0.85rem', md: '0.95rem' }, fontWeight: 700, mb: 0.5 }}>
                                {new Date(log.createdAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </Typography>
                              <Typography sx={{ color: palette.textSec, fontSize: { xs: '0.75rem', md: '0.85rem' }, opacity: 0.8, fontWeight: 500 }}>
                                {new Date(log.createdAt).toLocaleTimeString(ar ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* ================= PAGINATION ================= */}
        {!loading && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 6, md: 8 } }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(_, v) => setPage(v)} 
              color="primary" 
              size={typeof window !== 'undefined' && window.innerWidth < 600 ? "medium" : "large"} 
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root': { 
                  color: palette.textSec, 
                  fontWeight: 700,
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  bgcolor: alpha(palette.cardBg, 0.5),
                  border: `1px solid ${alpha(palette.border, 0.1)}`,
                  margin: '0 4px',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: alpha(palette.primary, 0.15), borderColor: alpha(palette.primary, 0.3) }
                },
                '& .Mui-selected': { 
                  bgcolor: `${palette.primary} !important`, 
                  color: '#000', 
                  fontWeight: 900,
                  boxShadow: `0 4px 12px ${alpha(palette.primary, 0.3)}`,
                  border: 'none',
                }
              }} 
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}