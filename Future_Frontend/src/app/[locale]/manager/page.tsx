'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Grid, Card, TextField, Button,
  CircularProgress, alpha, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Chip
} from '@mui/material';
import {
  SearchRounded, ManageAccountsRounded, LockOpenRounded,
  CheckCircleRounded, CloseRounded, AutoAwesomeRounded
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import Navbar from '@/components/layout/Navbar';
import { coursesApi, managerApi } from '@/lib/api'; 
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
  danger: '#e62f76',
};

export default function ManagerDashboard() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const ar = locale === 'ar';
  
  const { user, isAuthenticated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modal States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [grantingId, setGrantingId] = useState<string | null>(null);
  
  // 🔴 لحفظ الكورسات اللي اتفعلت في الجلسة الحالية عشان نعطل زرايرها
  const [grantedCourses, setGrantedCourses] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
    if (isAuthenticated && user?.role !== 'MANAGER') {
      toast.error(ar ? 'عفواً، هذه الصفحة مخصصة للمديرين فقط!' : 'Access Denied: Managers Only!');
      router.replace(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, user, router, locale, ar]);

  const fetchCoursesList = async () => {
    if (courses.length > 0) return;
    setLoadingCourses(true);
    try {
      const res = await coursesApi.list();
      setCourses(res.data?.data?.courses || []);
    } catch (err) {
      toast.error(ar ? 'فشل جلب الكورسات' : 'Failed to load courses');
    }
    setLoadingCourses(false);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await managerApi.searchUsers(searchQuery);
      const users = res.data?.data || res.data || [];
      setUsersList(Array.isArray(users) ? users : [users]); 
      
      if (users.length === 0) {
        toast(ar ? 'لم يتم العثور على مستخدم بهذا الاسم/الإيميل' : 'No user found');
      }
    } catch (err: any) {
      console.error("Search Error:", err); 
      const errorMsg = err.response?.data?.message || err.message || (ar ? 'حدث خطأ أثناء البحث' : 'Search failed');
      toast.error(errorMsg);
    } finally {
      setIsSearching(false);
    }
  };

  const openGrantModal = (usr: any) => {
    setSelectedUser(usr);
    setGrantedCourses([]); // تصفير الكورسات المتفعلة لما نفتح يوزر جديد
    fetchCoursesList();
  };

  const handleGrantAccess = async (courseId: string) => {
    if (!selectedUser) return;
    setGrantingId(courseId);
    try {
      await managerApi.grantCourseAccess(selectedUser.id, courseId);
      toast.success(ar ? `تم تفعيل الكورس للمستخدم ${selectedUser.firstName} بنجاح! 🎉` : `Course unlocked for ${selectedUser.firstName}! 🎉`);
      
      // 🔴 إضافة الكورس لقائمة الكورسات المُفعلة عشان نعطل الزرار
      setGrantedCourses((prev) => [...prev, courseId]);
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'فشل تفعيل الكورس' : 'Failed to unlock course'));
    }
    setGrantingId(null);
  };

  if (!isMounted || user?.role !== 'MANAGER') {
    return (
      <Box sx={{ minHeight: '100vh', background: palette.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress sx={{ color: palette.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, position: 'relative', pb: 10 }}>
      {/* Glow Background */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '40vw', background: `radial-gradient(circle, ${alpha(palette.primary, 0.08)} 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

      <Navbar />

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 }, position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <Box component={motion.div} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 6, textAlign: 'center' }}>
          <Box sx={{ width: 80, height: 80, mx: 'auto', mb: 2, borderRadius: '50%', background: `linear-gradient(135deg, ${alpha(palette.primary, 0.2)}, ${alpha(palette.border, 0.1)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${palette.primary}`, boxShadow: `0 0 20px ${alpha(palette.primary, 0.2)}` }}>
            <ManageAccountsRounded sx={{ fontSize: 40, color: palette.primary }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', letterSpacing: '-1px', mb: 1 }}>
            {ar ? 'لوحة تحكم المدير' : 'Manager Dashboard'}
          </Typography>
          <Typography sx={{ color: palette.textSec, fontSize: '1.1rem' }}>
            {ar ? 'ابحث عن المستخدمين وقم بتفعيل الكورسات لهم مباشرة' : 'Search users and manually unlock courses for them'}
          </Typography>
        </Box>

        {/* Search Box */}
        <Card component={motion.form} onSubmit={handleSearch} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          sx={{ p: 1.5, background: 'rgba(8, 69, 112, 0.4)', backdropFilter: 'blur(20px)', border: `1px solid ${alpha(palette.border, 0.4)}`, borderRadius: 4, mb: 4, display: 'flex', gap: 1, boxShadow: `0 20px 40px rgba(0,0,0,0.5)` }}
        >
          <TextField 
            fullWidth placeholder={ar ? 'ابحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'} 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { border: 'none' } } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: palette.textSec }} /></InputAdornment> }}
          />
          <Button type="submit" variant="contained" disabled={isSearching || !searchQuery.trim()}
            sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 800, borderRadius: 3, px: 4, minWidth: 120, textTransform: 'none' }}
          >
            {isSearching ? <CircularProgress size={24} color="inherit" /> : (ar ? 'بحث' : 'Search')}
          </Button>
        </Card>

        {/* Search Results */}
        <AnimatePresence>
          {usersList.length > 0 && (
            <Card component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              sx={{ background: 'rgba(8, 69, 112, 0.2)', backdropFilter: 'blur(20px)', border: `1px solid ${alpha(palette.border, 0.2)}`, borderRadius: 4, overflow: 'hidden' }}
            >
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(palette.border, 0.2)}`, background: 'rgba(0,0,0,0.3)' }}>
                <Typography sx={{ color: '#fff', fontWeight: 800 }}>{ar ? 'نتائج البحث' : 'Search Results'}</Typography>
              </Box>
              <List disablePadding>
                {usersList.map((usr, idx) => (
                  <Box key={usr.id}>
                    <ListItem sx={{ py: 2, px: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ background: palette.primary, color: '#000', fontWeight: 900 }}>{usr.firstName?.[0]}{usr.lastName?.[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={`${usr.firstName} ${usr.lastName}`}
                        secondary={usr.email}
                        primaryTypographyProps={{ color: '#fff', fontWeight: 800 }}
                        secondaryTypographyProps={{ color: palette.textSec }}
                      />
                      {/* 🔴 الحل الجذري لمسافة الأيقونة (إلغاء startIcon واستخدام flex) */}
                      <Button 
                        onClick={() => openGrantModal(usr)}
                        variant="outlined" 
                        sx={{ 
                          borderColor: palette.primary, color: palette.primary, fontWeight: 800, borderRadius: 3, textTransform: 'none', 
                          display: 'flex', alignItems: 'center', gap: 1, // 🔴 المسافة هنا
                          '&:hover': { background: alpha(palette.primary, 0.1), borderColor: palette.primaryHover, color: palette.primaryHover } 
                        }}
                      >
                        <LockOpenRounded fontSize="small" />
                        <Box component="span">{ar ? 'تفعيل كورس' : 'Unlock Course'}</Box>
                      </Button>
                    </ListItem>
                    {idx < usersList.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                  </Box>
                ))}
              </List>
            </Card>
          )}
        </AnimatePresence>

      </Container>

      {/* ================= GRANT COURSE MODAL ================= */}
      <Dialog 
        open={Boolean(selectedUser)} onClose={() => !grantingId && setSelectedUser(null)}
        PaperProps={{ sx: { background: `linear-gradient(180deg, ${palette.cardBg}, #000)`, backdropFilter: 'blur(20px)', border: `1px solid ${alpha(palette.border, 0.4)}`, borderRadius: 5, minWidth: { xs: '95%', sm: 500 }, p: 1, boxShadow: `0 30px 60px rgba(0,0,0,0.8)` } }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
          {ar ? 'اختر الكورس للتفعيل' : 'Select Course to Unlock'}
          <IconButton onClick={() => setSelectedUser(null)} disabled={Boolean(grantingId)} sx={{ color: palette.textSec, '&:hover': { background: alpha(palette.danger, 0.2), color: palette.danger } }}><CloseRounded /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ mb: 3, p: 2, background: 'rgba(0,0,0,0.3)', borderRadius: 3, border: `1px dashed ${palette.primary}` }}>
            <Typography sx={{ color: palette.textSec, fontSize: '0.9rem', mb: 0.5 }}>{ar ? 'المستخدم المحدد:' : 'Selected User:'}</Typography>
            <Typography sx={{ color: '#fff', fontWeight: 800 }}>{selectedUser?.firstName} {selectedUser?.lastName} ({selectedUser?.email})</Typography>
          </Box>

          {loadingCourses ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: palette.primary }} /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '50vh', overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: alpha(palette.primary, 0.3), borderRadius: '10px' } }}>
              {courses.map((c) => {
                // 🔴 نتحقق هل الكورس ده اتفعل في الجلسة دي ولا لسة؟
                const isGranted = grantedCourses.includes(c.id);

                return (
                  <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: `1px solid rgba(255,255,255,0.05)`, transition: '0.3s', '&:hover': { background: 'rgba(255,255,255,0.06)', borderColor: alpha(palette.primary, 0.3) } }}>
                    <Box>
                      <Typography sx={{ color: '#fff', fontWeight: 800, mb: 0.5 }}>{c.title}</Typography>
                      <Chip label={c.packageType} size="small" sx={{ background: alpha(palette.primary, 0.1), color: palette.primary, fontSize: '0.7rem', height: 20 }} />
                    </Box>
                    <Button
                      onClick={() => handleGrantAccess(c.id)}
                      disabled={grantingId === c.id || isGranted} // 🔴 تعطل الزرار لو بيحمل أو لو اتفعل خلاص
                      variant="contained" size="small"
                      sx={{ 
                        background: isGranted ? alpha(palette.success, 0.2) : `linear-gradient(135deg, ${palette.success}, #16a34a)`, 
                        color: isGranted ? palette.success : '#fff', 
                        fontWeight: 800, borderRadius: 2, textTransform: 'none', 
                        '&:hover': { transform: isGranted ? 'none' : 'scale(1.05)' },
                        '&.Mui-disabled': { background: isGranted ? alpha(palette.success, 0.2) : 'rgba(255,255,255,0.1)', color: isGranted ? palette.success : palette.textSec }
                      }}
                    >
                      {grantingId === c.id 
                        ? <CircularProgress size={18} color="inherit" /> 
                        : isGranted 
                          ? (ar ? 'مُفعَّل ✅' : 'Unlocked ✅') 
                          : (ar ? 'تفعيل الان' : 'Unlock Now')}
                    </Button>
                  </Box>
                );
              })}
              {courses.length === 0 && (
                <Typography sx={{ color: palette.textSec, textAlign: 'center', py: 3 }}>{ar ? 'لا توجد كورسات متاحة' : 'No courses available'}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
}