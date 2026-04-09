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
// 🔴 استيراد الـ API الخاص بمشروعك
import { authApi } from '@/lib/api'; 

// ================= THEME PALETTE =================
const palette = {
  bg: '#050508',
  cardBg: '#084570',
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
    '0%': { transform: 'scale(1)', opacity: 1, filter: 'drop-shadow(0 0 5px rgba(48,192,242,0.4))' },
    '50%': { transform: 'scale(1.15)', opacity: 0.6, filter: 'drop-shadow(0 0 15px rgba(48,192,242,0.8))' },
    '100%': { transform: 'scale(1)', opacity: 1, filter: 'drop-shadow(0 0 5px rgba(48,192,242,0.4))' }
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

  // 🔴 الدالة الوظيفية الأصلية 100%
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
    if (act.includes('create') || act.includes('add') || act.includes('activate')) return palette.success;
    if (act.includes('delete') || act.includes('remove') || act.includes('fail') || act.includes('deactivate')) return palette.danger;
    if (act.includes('update') || act.includes('edit') || act.includes('change')) return palette.warning;
    if (act.includes('login') || act.includes('auth')) return palette.primary;
    return palette.textSec;
  };

  const getActionIcon = (action: string, color: string) => {
    const act = action.toLowerCase();
    const style = { color, fontSize: 16, marginLeft: ar ? 6 : -4, marginRight: ar ? -4 : 6 };
    if (act.includes('create') || act.includes('add')) return <AddCircleOutlineRounded style={style} />;
    if (act.includes('delete') || act.includes('remove')) return <DeleteOutlineRounded style={style} />;
    if (act.includes('update') || act.includes('edit')) return <EditOutlined style={style} />;
    if (act.includes('login') || act.includes('auth')) return <VpnKeyRounded style={style} />;
    return <FlashOnRounded style={style} />;
  };

  if (!mounted) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: palette.bg, pt: { xs: 10, md: 14 }, pb: 10, px: { xs: 2, sm: 3, md: 4 }, dir: ar ? 'rtl' : 'ltr' }}>
      
      {/* 🔴 تم تصحيح الخطأ هنا لـ dangerouslySetInnerHTML */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(10, 10, 15, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(48, 192, 242, 0.3); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(48, 192, 242, 0.6); }
      `}} />

      <Box component={motion.div} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} sx={{ maxWidth: 1300, mx: 'auto' }}>
        
        {/* ================= HEADER SECTION ================= */}
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'center' }} textAlign={{ xs: 'center', sm: ar ? 'right' : 'left' }} gap={3} sx={{ mb: 6, px: 1 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar sx={{ 
              bgcolor: alpha(palette.primary, 0.05), 
              color: palette.primary, 
              width: { xs: 65, md: 76 }, 
              height: { xs: 65, md: 76 }, 
              border: `1px solid ${alpha(palette.primary, 0.3)}`,
              boxShadow: `0 0 35px ${alpha(palette.primary, 0.2)}`,
              backdropFilter: 'blur(10px)'
            }}>
              <ShieldRounded sx={{ fontSize: { xs: 34, md: 40 } }} />
            </Avatar>
            <AutoAwesomeRounded sx={{ position: 'absolute', top: -5, right: -5, color: '#fff', fontSize: { xs: 18, md: 22 }, ...pulseAnimation }} />
          </Box>
          <Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 900, 
              background: `linear-gradient(135deg, #ffffff 0%, ${palette.primary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' },
              mb: 1,
              textShadow: `0 10px 30px ${alpha(palette.primary, 0.3)}`
            }}>
              {ar ? 'سجل مراقبة النظام' : 'System Audit Logs'}
            </Typography>
            <Typography variant="body1" sx={{ color: palette.textSec, opacity: 0.8, fontWeight: 500, fontSize: { xs: '0.95rem', md: '1.1rem' }, maxWidth: 600 }}>
              {ar ? 'تتبع وتحليل العمليات الحساسة وحركات المستخدمين بشكل لحظي لضمان أمان النظام.' : 'Track and analyze sensitive operations and user activities in real-time to ensure system security.'}
            </Typography>
          </Box>
        </Stack>

        {/* ================= TABLE CONTAINER ================= */}
        <TableContainer className="custom-scrollbar" component={Paper} sx={{ 
          background: `linear-gradient(180deg, ${alpha('#0a111a', 0.8)} 0%, ${alpha('#050508', 0.9)} 100%)`, 
          backdropFilter: 'blur(30px)',
          border: `1px solid ${alpha(palette.primary, 0.15)}`, 
          borderRadius: { xs: 4, md: 6 },
          boxShadow: `0 30px 60px -15px rgba(0,0,0,0.9), inset 0 1px 0 ${alpha('#fff', 0.05)}`,
          overflowX: 'auto',
          position: 'relative'
        }}>
          
          <Box sx={{ position: 'absolute', top: '-50%', left: '-10%', width: '50%', height: '100%', background: `radial-gradient(circle, ${alpha(palette.primary, 0.05)} 0%, transparent 70%)`, pointerEvents: 'none' }} />

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center', alignItems: 'center', py: 25 }}>
              <CircularProgress size={50} thickness={4} sx={{ color: palette.primary, filter: `drop-shadow(0 0 12px ${palette.primary})` }} />
              <Typography sx={{ color: palette.primary, fontWeight: 700, letterSpacing: 1, animation: 'pulse 1.5s infinite' }}>
                {ar ? 'جاري استخراج السجلات...' : 'Extracting logs...'}
              </Typography>
            </Box>
          ) : (
            <Table sx={{ minWidth: 850, tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '0 8px', p: { xs: 1, md: 2 } }}>
              <TableHead>
                <TableRow>
                  <TableCell align={align} sx={{ color: palette.textSec, fontWeight: 800, fontSize: { xs: '0.75rem', md: '0.85rem' }, textTransform: 'uppercase', letterSpacing: 1, py: 2, px: { xs: 2, md: 4 }, width: '20%', borderBottom: 'none' }}>{ar ? 'نوع الحدث' : 'Event Type'}</TableCell>
                  <TableCell align={align} sx={{ color: palette.textSec, fontWeight: 800, fontSize: { xs: '0.75rem', md: '0.85rem' }, textTransform: 'uppercase', letterSpacing: 1, py: 2, px: { xs: 2, md: 4 }, width: '30%', borderBottom: 'none' }}>{ar ? 'المستخدم (الفاعل)' : 'Actor (User)'}</TableCell>
                  <TableCell align={align} sx={{ color: palette.textSec, fontWeight: 800, fontSize: { xs: '0.75rem', md: '0.85rem' }, textTransform: 'uppercase', letterSpacing: 1, py: 2, px: { xs: 2, md: 4 }, width: '25%', borderBottom: 'none' }}>{ar ? 'الهدف / المورد' : 'Target Resource'}</TableCell>
                  <TableCell align={align} sx={{ color: palette.textSec, fontWeight: 800, fontSize: { xs: '0.75rem', md: '0.85rem' }, textTransform: 'uppercase', letterSpacing: 1, py: 2, px: { xs: 2, md: 4 }, width: '25%', borderBottom: 'none' }}>{ar ? 'التاريخ والوقت' : 'Timestamp'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: { xs: 10, md: 15 }, borderBottom: 'none' }}>
                      <Box sx={{ ...floatAnimation }}>
                        <HistoryToggleOffRounded sx={{ fontSize: { xs: 60, md: 80 }, color: palette.border, opacity: 0.15, mb: 2, filter: `drop-shadow(0 10px 20px ${alpha(palette.primary, 0.2)})` }} />
                        <Typography sx={{ color: palette.textSec, fontWeight: 800, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>{ar ? 'سجل النظام نظيف تماماً ✨' : 'System logs are completely clean ✨'}</Typography>
                        <Typography sx={{ color: palette.textSec, opacity: 0.5, fontSize: '0.85rem', mt: 1 }}>{ar ? 'لم يتم تسجيل أي حركات حتى الآن.' : 'No actions have been recorded yet.'}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, index) => {
                    const actionTheme = getActionTheme(log.action);
                    return (
                      <TableRow key={log.id} sx={{ 
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        bgcolor: alpha('#fff', 0.02),
                        position: 'relative',
                        // 🔴 إزالة تأثير الـ Scale في الموبايل والتابلت لمنع الاهتزاز أثناء السكرول
                        '&:hover': { 
                          bgcolor: alpha(palette.primary, 0.05),
                          transform: { xs: 'none', md: 'translateY(-3px) scale(1.005)' },
                          boxShadow: `0 15px 30px -10px rgba(0,0,0,0.5), 0 0 15px ${alpha(actionTheme, 0.15)}`,
                          zIndex: 10
                        },
                        // 🔴 تطبيق تأثير الـ Indicator بدون الحاجة لتاج <style>
                        '&:hover .row-indicator': {
                          opacity: 1,
                          height: '100%',
                          top: 0,
                          bottom: 0,
                          borderRadius: 0,
                          boxShadow: `0 0 15px ${actionTheme}`
                        },
                        '& td': { 
                          borderBottom: 'none', 
                          borderTop: `1px solid ${alpha('#fff', 0.03)}`,
                          borderBottomColor: 'transparent',
                          py: { xs: 2, md: 2.5 },
                        },
                        '& td:first-of-type': { borderTopLeftRadius: { xs: 8, md: 12 }, borderBottomLeftRadius: { xs: 8, md: 12 }, borderLeft: `1px solid ${alpha('#fff', 0.03)}` },
                        '& td:last-of-type': { borderTopRightRadius: { xs: 8, md: 12 }, borderBottomRightRadius: { xs: 8, md: 12 }, borderRight: `1px solid ${alpha('#fff', 0.03)}` },
                        animation: `fadeInRow 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.05}s`,
                        opacity: 0,
                        '@keyframes fadeInRow': { 'from': { opacity: 0, transform: 'translateY(20px)' }, 'to': { opacity: 1, transform: 'translateY(0)' } }
                      }}>
                        {/* Action Column */}
                        <TableCell align={align} sx={{ pl: { xs: 2, md: 4 }, position: 'relative' }}>
                          <Box className="row-indicator" sx={{
                            position: 'absolute', top: '15%', bottom: '15%', [ar ? 'right' : 'left']: 0, width: 4, borderRadius: 4,
                            bgcolor: actionTheme, opacity: 0.3, transition: 'all 0.3s',
                          }} />
                          
                          <Chip 
                            icon={getActionIcon(log.action, actionTheme)}
                            label={log.action.replace(/_/g, ' ')} 
                            sx={{ 
                              bgcolor: alpha(actionTheme, 0.08), 
                              color: actionTheme, 
                              fontWeight: 900, 
                              border: `1px solid ${alpha(actionTheme, 0.25)}`,
                              fontSize: { xs: '0.65rem', md: '0.75rem' },
                              px: { xs: 0.5, md: 1.2 },
                              py: { xs: 1.8, md: 2.2 },
                              borderRadius: '10px',
                              backdropFilter: 'blur(10px)',
                              boxShadow: `0 4px 15px ${alpha(actionTheme, 0.1)}`
                            }} 
                          />
                        </TableCell>
                        
                        {/* User Column */}
                        <TableCell align={align} sx={{ px: { xs: 2, md: 4 } }}>
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Avatar sx={{ 
                              width: { xs: 35, md: 44 }, height: { xs: 35, md: 44 }, 
                              background: `linear-gradient(135deg, ${alpha(palette.primary, 0.1)}, ${alpha(palette.border, 0.2)})`, 
                              border: `1px solid ${alpha(palette.primary, 0.3)}`,
                              color: palette.textMain, fontSize: { xs: '0.9rem', md: '1.1rem' }, fontWeight: 900,
                            }}>
                              {log.user?.name ? log.user.name[0]?.toUpperCase() : <PersonOutlineRounded fontSize="small" />}
                            </Avatar>
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography noWrap sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '0.85rem', md: '1rem' }, letterSpacing: 0.5 }}>
                                {log.user?.name || 'System Actor'}
                              </Typography>
                              <Typography noWrap sx={{ color: palette.textSec, fontSize: { xs: '0.7rem', md: '0.8rem' }, opacity: 0.7, mt: 0.3 }}>
                                {log.user?.email || 'automated_process'} {log.user?.role && <span style={{ color: palette.primary, fontWeight: 800 }}>• {log.user.role}</span>}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Resource Column */}
                        <TableCell align={align} sx={{ px: { xs: 2, md: 4 } }}>
                          <Stack direction="row" alignItems="flex-start" gap={1.5}>
                            <Box sx={{ display: { xs: 'none', sm: 'block' }, mt: 0.5, p: 0.8, borderRadius: 2, bgcolor: alpha(palette.border, 0.1), color: palette.border }}>
                              <DnsRounded sx={{ fontSize: 18 }} />
                            </Box>
                            <Box>
                              <Typography sx={{ color: palette.textMain, fontWeight: 800, fontSize: { xs: '0.85rem', md: '0.95rem' } }}>{log.resource}</Typography>
                              {log.resourceId && (
                                <Typography sx={{ 
                                  color: palette.textSec, fontSize: { xs: '0.65rem', md: '0.75rem' }, opacity: 0.6, 
                                  fontFamily: 'monospace', mt: 0.4, bgcolor: alpha('#fff', 0.05), 
                                  px: 1, py: 0.3, borderRadius: 1, display: 'inline-block' 
                                }}>
                                  ID: {log.resourceId.substring(0, 8)}...
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Date Column */}
                        <TableCell align={align} sx={{ px: { xs: 2, md: 4 } }}>
                          <Stack direction="row" alignItems="flex-start" gap={1.5}>
                            <Box sx={{ display: { xs: 'none', sm: 'block' }, mt: 0.5, p: 0.8, borderRadius: 2, bgcolor: alpha(palette.textSec, 0.1), color: palette.textSec }}>
                              <CalendarTodayRounded sx={{ fontSize: 18 }} />
                            </Box>
                            <Box>
                              <Typography sx={{ color: '#fff', fontSize: { xs: '0.8rem', md: '0.9rem' }, fontWeight: 800 }}>
                                {new Date(log.createdAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </Typography>
                              <Typography sx={{ color: palette.textSec, fontSize: { xs: '0.7rem', md: '0.8rem' }, opacity: 0.7, mt: 0.3, fontWeight: 600 }}>
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
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(_, v) => setPage(v)} 
              color="primary" 
              size={typeof window !== 'undefined' && window.innerWidth < 600 ? "medium" : "large"} 
              sx={{
                '& .MuiPaginationItem-root': { 
                  color: palette.textSec, 
                  fontWeight: 900,
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  bgcolor: alpha('#fff', 0.03),
                  border: `1px solid ${alpha('#fff', 0.05)}`,
                  transition: 'all 0.3s',
                  '&:hover': { bgcolor: alpha(palette.primary, 0.2), transform: 'translateY(-2px)' }
                },
                '& .Mui-selected': { 
                  bgcolor: `${palette.primary} !important`, 
                  color: '#000', 
                  boxShadow: `0 5px 15px ${alpha(palette.primary, 0.4)}`,
                  border: 'none',
                  transform: 'scale(1.1)'
                }
              }} 
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}