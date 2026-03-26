'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Container, Card, Typography, Button, Tabs, Tab,
  TextField, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment, IconButton, Grid, Divider, Stack
} from '@mui/material';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Security from '@mui/icons-material/Security';
import Person from '@mui/icons-material/Person';
import DeleteForever from '@mui/icons-material/DeleteForever';
import Warning from '@mui/icons-material/Warning';
import LockReset from '@mui/icons-material/LockReset';

import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

// ================= THEME PALETTE =================
const palette = {
  bg: '#0a0a0f',
  cardBg: '#084570',
  cardFill: '#062d49', 
  border: '#259acb',
  borderDark: 'rgba(37,154,203,0.3)',
  primary: '#30c0f2',
  primaryHover: '#83d9f7',
  textMain: '#a8eff9',
  textSec: '#a0ddf1',
  danger: '#e62f76',
  dangerHover: '#be123c',
  glow: 'rgba(48,192,242,0.15)',
};

// ================= STYLED COMPONENTS =================
const inputStyle = (ar: boolean) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: palette.cardFill,
    borderRadius: 2,
    color: '#fff',
    '& fieldset': { borderColor: palette.borderDark },
    '&:hover fieldset': { borderColor: palette.primary },
    '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2 },
    '& .MuiInputBase-input': { px: 2, py: 1.5, textAlign: ar ? 'right' : 'left' } 
  },
  // 🔴 تم إزالة الإطار الأسود المزعج تماماً وجعله شفافاً وأنيقاً
  '& .Mui-disabled': { 
    WebkitTextFillColor: `${palette.textSec} !important`,
    background: 'transparent !important', 
    '& fieldset': { borderColor: 'rgba(37,154,203,0.15) !important' }
  },
  mb: 1
});

const buttonStyle = {
  fontWeight: 900, py: 1.4, px: 6, fontSize: '1.1rem', borderRadius: 2.5, 
  textTransform: 'none', transition: 'all 0.3s'
};

export default function SettingsPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const ar = locale === 'ar';
  
  // 🔴 تم إزالة checkAuth من هنا عشان نتجنب الـ TypeError
  const { isAuthenticated, user, logout } = useAuthStore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [tab, setTab] = useState(0);

  // --- States ---
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' }); 
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  
  const [loading, setLoading] = useState({ profile: false, password: false, delete: false });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false); 
  const [showNewPassword, setShowNewPassword] = useState(false); 
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) router.push(`/${locale}/login`);
  }, [isMounted, isAuthenticated, router, locale]);

  if (!isMounted || !user) return <Box sx={{ height: '100vh', bgcolor: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{ color: palette.primary }} /></Box>;

  // ================= HANDLERS =================
  const handleUpdateProfile = async () => {
    if (!profileForm.firstName || !profileForm.lastName) {
      return toast.error(ar ? 'الاسم الأول والأخير مطلوبان' : 'First and Last name are required');
    }
    
    if (loading.profile) return; // منع الضغط المتكرر
    
    setLoading({ ...loading, profile: true });
    try {
      await usersApi.updateProfile(profileForm);
      
      // 🔴 التحديث اليدوي الفوري للمتجر (بدون استخدام الدالة اللي بتعمل Error)
      useAuthStore.setState({ 
        user: { 
          ...user, 
          firstName: profileForm.firstName, 
          lastName: profileForm.lastName 
        } 
      });
      
      // رسالة النجاح في الآخر خالص عشان نضمن إن مفيش Error هيحصل
      toast.success(ar ? 'تم تحديث البيانات بنجاح ✓' : 'Profile updated successfully ✓');
    } catch (err: any) {
      console.error("Update Profile Error:", err); // لسهولة التتبع في الـ Console
      toast.error(err.response?.data?.message || (ar ? 'فشل التحديث' : 'Update failed'));
    } finally {
      setLoading({ ...loading, profile: false });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      return toast.error(ar ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error(ar ? 'كلمة المرور الجديدة غير متطابقة' : 'New passwords do not match');
    }
    if (passwordForm.newPassword.length < 8) {
      return toast.error(ar ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
    }

    if (loading.password) return; // منع الضغط المتكرر

    setLoading({ ...loading, password: true });
    try {
      await usersApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => logout(), 2000); 
      
      // رسالة النجاح بعد تنفيذ كل المهام بنجاح
      toast.success(ar ? 'تم تغيير كلمة المرور بنجاح، يرجى تسجيل الدخول مجدداً 🔒' : 'Password changed. Please login again 🔒');
    } catch (err: any) {
      console.error("Change Password Error:", err);
      toast.error(err.response?.data?.message || (ar ? 'فشل تغيير كلمة المرور' : 'Failed to change password'));
    } finally {
      setLoading({ ...loading, password: false });
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return toast.error(ar ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
    
    if (loading.delete) return; // منع الضغط المتكرر

    setLoading({ ...loading, delete: true });
    try {
      await usersApi.deleteAccount({ password: deletePassword });
      setDeleteDialogOpen(false);
      setTimeout(() => {
        logout();
        router.push(`/${locale}/`);
      }, 1500);
      
      // رسالة النجاح بعد تنفيذ كل المهام
      toast.success(ar ? 'تم حذف الحساب نهائياً 🗑️' : 'Account deleted permanently 🗑️');
    } catch (err: any) {
      console.error("Delete Account Error:", err);
      toast.error(err.response?.data?.message || (ar ? 'كلمة المرور غير صحيحة أو فشل الحذف' : 'Incorrect password or deletion failed'));
    } finally {
      setLoading({ ...loading, delete: false });
    }
  };

  return (
    <Box sx={{ height: '100vh', background: palette.bg, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Glow Backgrounds */}
        <Box sx={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '30vw', height: '30vw', background: `radial-gradient(circle, ${palette.glow} 0%, transparent 70%)`, filter: 'blur(80px)', zIndex: 0 }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff', mb: 1, letterSpacing: -1 }}>
              ⚙️ {ar ? 'إعدادات الحساب' : 'Account Settings'}
            </Typography>
            <Typography sx={{ color: palette.textSec, fontSize: '1rem', maxWidth: 600, mx: 'auto' }}>
              {ar ? 'تحكم في بياناتك الشخصية وإعدادات الأمان الخاصة بحسابك.' : 'Manage your personal info and account security settings.'}
            </Typography>
          </Box>

          <Card sx={{ background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 4, overflow: 'hidden', boxShadow: `0 20px 50px rgba(0,0,0,0.5)`, backdropFilter: 'blur(10px)' }}>
            <Tabs 
              value={tab} 
              onChange={(_, v) => setTab(v)} 
              variant="fullWidth"
              sx={{ 
                borderBottom: `1px solid ${palette.borderDark}`,
                '& .MuiTab-root': { 
                  color: palette.textSec, fontWeight: 'bold', py: {xs: 2, md: 2.5}, fontSize: {xs: '0.9rem', md: '1rem'}, 
                  transition: 'all 0.2s', display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, gap: {xs: 1, sm: 1.5}
                },
                '& .Mui-selected': { color: `${palette.primary} !important` },
                '& .MuiTabs-indicator': { backgroundColor: palette.primary, height: 3, borderRadius: '3px 3px 0 0' }
              }}
            >
              <Tab icon={<Person />} label={ar ? 'الملف الشخصي' : 'Profile'} />
              <Tab icon={<Security />} label={ar ? 'الأمان والمرور' : 'Security'} />
              <Tab icon={<DeleteForever />} label={ar ? 'حذف الحساب' : 'Delete Account'} sx={{ '&.Mui-selected': { color: `${palette.danger} !important` } }} />
            </Tabs>

            <Box sx={{ p: { xs: 3, md: 5 }, maxHeight: '60vh', overflowY: 'auto' }}>
              <AnimatePresence mode="wait">
                {/* ================= TAB 0: PROFILE ================= */}
                {tab === 0 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{opacity: 0, x: -20}}>
                    <Grid container spacing={3} dir={ar ? 'rtl' : 'ltr'}>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left', fontSize: '0.95rem' }}>{ar ? 'الاسم الأول' : 'First Name'}</Typography>
                        <TextField fullWidth placeholder={ar ? 'أدخل الاسم الأول...' : 'Enter first name...'} value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} sx={inputStyle(ar)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left', fontSize: '0.95rem' }}>{ar ? 'الاسم الأخير' : 'Last Name'}</Typography>
                        <TextField fullWidth placeholder={ar ? 'أدخل الاسم الأخير...' : 'Enter last name...'} value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} sx={inputStyle(ar)} />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography sx={{ color: palette.textSec, mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left', fontSize: '0.95rem' }}>{ar ? 'البريد الإلكتروني (لا يمكن تغييره)' : 'Email (Cannot be changed)'}</Typography>
                        <TextField fullWidth value={user.email} disabled sx={{ ...inputStyle(ar), mb: 0 }} />
                      </Grid>
                      <Grid item xs={12} sx={{ mt: 1, textAlign: {xs: 'center', sm: ar ? 'right' : 'left'} }}>
                        <Button variant="contained" onClick={handleUpdateProfile} disabled={loading.profile} 
                          sx={{ ...buttonStyle, bgcolor: palette.primary, color: '#000', 
                            '&:hover': {bgcolor: palette.primaryHover}, width: {xs: '100%', sm: 'auto'}, boxShadow: `0 8px 25px rgba(48,192,242,0.3)`
                          }}>
                          {loading.profile ? <CircularProgress size={26} sx={{color:'#000'}}/> : (ar ? 'حفظ التعديلات' : 'Save Changes')}
                        </Button>
                      </Grid>
                    </Grid>
                  </motion.div>
                )}

                {/* ================= TAB 1: SECURITY ================= */}
                {tab === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{opacity: 0, x: -20}}>
                    <Stack spacing={2.5} sx={{ maxWidth: '100%' }} dir={ar ? 'rtl' : 'ltr'}>
                      <Typography sx={{ color: palette.textSec, mb: 1, fontSize: '0.95rem', bgcolor: 'rgba(255,255,255,0.03)', p: 2, borderRadius: 2, borderLeft: ar ? 'none' : `3px solid ${palette.primary}`, borderRight: ar ? `3px solid ${palette.primary}` : 'none', textAlign: ar ? 'right' : 'left' }}>
                        {ar ? 'تغيير كلمة المرور سيؤدي إلى تسجيل خروجك من جميع الأجهزة الأخرى لحماية حسابك من الاختراق.' : 'Changing your password will log you out of all other devices to protect your account.'}
                      </Typography>
                      
                      <Box>
                        <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left', fontSize: '0.95rem' }}>{ar ? 'كلمة المرور الحالية' : 'Current Password'}</Typography>
                        <TextField fullWidth type={showCurrentPassword ? 'text' : 'password'} placeholder={ar ? '••••••••' : '••••••••'} value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                          sx={inputStyle(ar)}
                          InputProps={{ 
                            startAdornment: <InputAdornment position="start"><LockReset sx={{color: palette.borderDark, ml: ar ? 1 : 0, mr: ar ? 0 : 1}} /></InputAdornment>,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end" sx={{color: palette.textSec, p: 1}}>
                                  {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }} />
                      </Box>
                        
                      <Box>
                        <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left', fontSize: '0.95rem' }}>{ar ? 'كلمة المرور الجديدة' : 'New Password'}</Typography>
                        <TextField fullWidth type={showNewPassword ? 'text' : 'password'} placeholder={ar ? '••••••••' : '••••••••'} value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                          sx={inputStyle(ar)} 
                          InputProps={{ startAdornment: <InputAdornment position="start"><Security sx={{color: palette.borderDark, ml: ar ? 1 : 0, mr: ar ? 0 : 1}} /></InputAdornment> }} />
                      </Box>

                      <Box>
                        <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left', fontSize: '0.95rem' }}>{ar ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</Typography>
                        <TextField fullWidth type={showNewPassword ? 'text' : 'password'} placeholder={ar ? '••••••••' : '••••••••'} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                          sx={inputStyle(ar)} 
                          InputProps={{ startAdornment: <InputAdornment position="start"><Security sx={{color: palette.borderDark, ml: ar ? 1 : 0, mr: ar ? 0 : 1}} /></InputAdornment> }} />
                      </Box>
                      
                      <Box sx={{ textAlign: {xs: 'center', sm: ar ? 'right' : 'left'}, pt: 1 }}>
                        <Button variant="contained" onClick={handleChangePassword} disabled={loading.password}
                           sx={{ ...buttonStyle, bgcolor: palette.primary, color: '#000', 
                           '&:hover': {bgcolor: palette.primaryHover}, width: {xs: '100%', sm: 'auto'}, boxShadow: `0 8px 25px rgba(48,192,242,0.3)`
                         }}>
                          {loading.password ? <CircularProgress size={26} sx={{color:'#000'}}/> : (ar ? 'تحديث كلمة المرور' : 'Update Password')}
                        </Button>
                      </Box>
                    </Stack>
                  </motion.div>
                )}

                {/* ================= TAB 2: DELETE ACCOUNT ================= */}
                {tab === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{opacity: 0, x: -20}}>
                    <Box sx={{ border: `2px solid ${palette.danger}`, borderRadius: 4, p: 4, bgcolor: 'rgba(230, 47, 118, 0.03)', boxShadow: `0 0 30px rgba(230, 47, 118, 0.1) inset` }} dir={ar ? 'rtl' : 'ltr'}>
                      <Typography variant="h6" sx={{ color: palette.danger, fontWeight: 900, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: ar ? 'flex-start' : 'flex-start' }}>
                        <Warning sx={{ color: palette.danger, fontSize: 26 }} /> {ar ? 'حذف الحساب وإزالة جميع البيانات' : 'Delete Account and Remove All Data'}
                      </Typography>
                      <Typography sx={{ color: '#fff', mb: 3, fontSize: '1rem', lineHeight: 1.7, textAlign: ar ? 'right' : 'left' }}>
                        {ar ? 'هذا الإجراء نهائي ولا يمكن التراجع عنه أبداً. بمجرد حذفك للحساب، سيتم مسح جميع بياناتك الشخصية، اشتراكاتك في الكورسات، ومحفظة العمولات الخاصة بك نهائياً من سيرفراتنا. يرجى التأكد تماماً قبل المتابعة.' : 'This action is final and cannot be undone. Once you delete your account, all your personal data, course subscriptions, and affiliate commissions will be permanently wiped from our servers. Please be absolutely sure before continuing.'}
                      </Typography>
                      <Box sx={{ textAlign: {xs: 'center', sm: ar ? 'right' : 'left'} }}>
                        <Button variant="contained" onClick={() => setDeleteDialogOpen(true)} 
                          sx={{ ...buttonStyle, bgcolor: palette.danger, color: '#fff', width: {xs: '100%', sm: 'auto'},
                            '&:hover': {bgcolor: palette.dangerHover}, boxShadow: `0 8px 25px rgba(230, 47, 118, 0.3)`
                          }}>
                          {ar ? 'أريد حذف حسابي' : 'I want to delete my account'}
                        </Button>
                      </Box>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Card>
        </Container>
      </Box>

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} 
        PaperProps={{ sx: { background: palette.bg, border: `2px solid ${palette.danger}`, borderRadius: 5, minWidth: { xs: '90%', sm: 450 }, p: 2, boxShadow: `0 0 60px rgba(230, 47, 118, 0.2)` }, dir: ar ? 'rtl' : 'ltr' }}>
        <DialogTitle sx={{ color: palette.danger, fontWeight: 900, fontSize: '1.4rem', pb: 2, textAlign: 'center' }}>
          {ar ? '🛑 تأكيد الحذف النهائي' : '🛑 Final Deletion Confirmation'}
        </DialogTitle>
        <Divider sx={{ borderColor: 'rgba(230, 47, 118, 0.2)' }} />
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left' }}>
            {ar ? 'لتأكيد حذف الحساب نهائياً، يرجى إدخال كلمة المرور الخاصة بك:' : 'To confirm final account deletion, please enter your password:'}
          </Typography>
          <Typography sx={{ color: palette.textSec, mb: 3, fontSize: '0.85rem', textAlign: ar ? 'right' : 'left' }}>
            {ar ? 'هذا الإجراء نهائي ولا يمكن استرجاع الحساب بعده.' : 'This is final and you cannot restore your account after it.'}
          </Typography>
          <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold', textAlign: ar ? 'right' : 'left', fontSize: '0.95rem' }}>{ar ? 'كلمة المرور الحالية' : 'Current Password'}</Typography>
          <TextField fullWidth autoFocus type="password" placeholder={ar ? '••••••••' : '••••••••'} value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#fff',
                '& fieldset': { borderColor: palette.danger },
                '&:hover fieldset': { borderColor: '#ff4d4d' },
                '&.Mui-focused fieldset': { borderColor: palette.danger, borderWidth: 2 },
                '& .MuiInputBase-input': { px: 2, py: 1.4, textAlign: ar ? 'right' : 'left' }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'center', gap: 2 }}>
          <Button onClick={() => { setDeleteDialogOpen(false); setDeletePassword(''); }} variant="outlined" sx={{ ...buttonStyle, py: 1.2, borderColor: palette.border, color: palette.textMain, '&:hover': {borderColor: palette.primary, color: palette.primary} }}>
            {ar ? 'تراجع' : 'Cancel'}
          </Button>
          <Button onClick={handleDeleteAccount} disabled={loading.delete || !deletePassword} variant="contained" 
            sx={{ ...buttonStyle, py: 1.2, bgcolor: palette.danger, color: '#fff', '&:hover': { bgcolor: palette.dangerHover } }}>
            {loading.delete ? <CircularProgress size={20} color="inherit" /> : (ar ? 'حذف نهائي' : 'Delete Permanently')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}