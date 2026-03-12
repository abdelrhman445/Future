'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter, usePathname } from 'next/navigation';
import {
  AppBar, Toolbar, Button, IconButton, Menu, MenuItem, Typography,
  Avatar, Box, Divider, Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Stack
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Logout,
  AdminPanelSettings, Language, BookmarkBorder, TrendingUp, CoPresent, School, ManageAccountsRounded, SupportAgentRounded
} from '@mui/icons-material';
import { motion } from 'framer-motion'; 
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
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
  danger: '#e62f76',
};

export default function Navbar() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ar = locale === 'ar';

  // Wait for client hydration before showing auth state
  useEffect(() => { setMounted(true); }, []);

  const t = {
    home: ar ? 'الرئيسية' : 'Home',
    allCourses: ar ? 'الكورسات' : 'Courses',
    myCourses: ar ? 'الكورسات' : 'Courses', 
    login: ar ? 'دخول' : 'Login',
    register: ar ? 'إنشاء حساب' : 'Register',
    dashboard: ar ? 'لوحتي' : 'Dashboard',
    affiliate: ar ? 'برنامج الإحالة' : 'Affiliate',
    admin: ar ? 'الإدارة' : 'Admin',
    manager: ar ? 'لوحة المدير' : 'Manager Panel', 
    inspector: ar ? 'لوحة المحاضر' : 'Inspector Panel',
    logout: ar ? 'تسجيل الخروج' : 'Logout',
    support: ar ? 'خدمة العملاء' : 'Customer Support', // 🔴 إضافة ترجمة خدمة العملاء
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    try { await authApi.logout(); } catch {}
    logout();
    router.push(`/${locale}`);
    toast.success(ar ? 'تم تسجيل الخروج' : 'Logged out');
  };

  const isActive = (href: string) => pathname === href;

  // Role Checks
  const hasAffiliate = mounted && isAuthenticated && user?.affiliateCode;
  const isAdmin = mounted && isAuthenticated && user?.role === 'ADMIN'; 
  const isManager = mounted && isAuthenticated && user?.role === 'MANAGER'; 
  const isInspector = mounted && isAuthenticated && user?.role === 'INSPECTOR';

  return (
    <Box 
      component={motion.div} 
      initial={{ y: -20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      sx={{ position: 'sticky', top: 0, zIndex: 1100 }}
    >
      <AppBar position="static" elevation={0}
        sx={{ background: 'rgba(10,10,15,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${palette.cardBg}` }}>
        <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, md: 3 }, py: 0.5 }}>

          {/* Logo & Brand Name */}
          <Link href={`/${locale}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Box component={motion.div} whileHover={{ scale: 1.05 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Image src="/logo.png" alt="Future Logo" width={38} height={38} style={{ objectFit: 'contain' }} priority />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: 22, background: `linear-gradient(135deg, ${palette.primary}, ${palette.textMain})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 0.5 }}>
              {ar ? 'فيوتشر' : 'Future'}
            </Typography>
          </Link>

          {/* Desktop Nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4, alignItems: 'center' }}>
            {(
              mounted && isAuthenticated
                ? [
                    { label: t.dashboard, href: `/${locale}/dashboard` }, 
                    { label: t.myCourses, href: `/${locale}/courses` }, 
                  ]
                : [
                    { label: t.home, href: `/${locale}` },
                    { label: t.allCourses, href: `/${locale}/courses` },
                  ]
            ).map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                sx={{
                  color: isActive(link.href) ? palette.primary : palette.textSec,
                  fontWeight: isActive(link.href) ? 800 : 600,
                  fontSize: '1.05rem',
                  letterSpacing: 0.5,
                  '&:hover': { color: palette.textMain, background: 'rgba(48,192,242,0.05)' }
                }}
              >
                {link.label}
              </Button>
            ))}

            {/* 🔴 زر خدمة العملاء (Desktop) بيظهر في كل الحالات */}
            <Button
              href="https://wa.me/201000000000" // 🔴 حط رقم الواتساب هنا
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: palette.textSec,
                fontWeight: 600,
                fontSize: '1.05rem',
                letterSpacing: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': { color: '#25D366', background: 'rgba(37,211,102,0.05)' } // لون الواتساب
              }}
            >
              <SupportAgentRounded fontSize="small" />
              {t.support}
            </Button>

            {/* Language Toggle */}
            <IconButton
              onClick={() => router.push(pathname.replace(`/${locale}`, locale === 'ar' ? '/en' : '/ar'))}
              sx={{ color: palette.textSec, border: `1px solid ${palette.border}`, borderRadius: 2, px: 1.5, mx: 2, gap: 0.5, '&:hover': {borderColor: palette.primary, color: palette.primary} }} size="small">
              <Language sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{locale === 'ar' ? 'EN' : 'عر'}</Typography>
            </IconButton>

            {/* Auth Section */}
            {!mounted ? (
              <Box sx={{ width: 150 }} />
            ) : isAuthenticated && user ? (
              <>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                  <Avatar sx={{ width: 44, height: 44, background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontSize: 16, fontWeight: 800, border: `2px solid ${palette.primaryHover}` }}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </Avatar>
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                  PaperProps={{ sx: { background: palette.bg, border: `1px solid ${palette.border}`, mt: 1.5, minWidth: 230, borderRadius: 3, boxShadow: `0 8px 32px rgba(8,69,112,0.4)` } }}>

                  <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${palette.cardBg}` }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: palette.textMain }}>{user.firstName} {user.lastName}</Typography>
                    <Typography sx={{ color: palette.textSec, fontSize: '0.8rem' }}>{user.email}</Typography>
                  </Box>

                  <MenuItem component={Link} href={`/${locale}/dashboard`} onClick={() => setAnchorEl(null)} sx={{ mt: 1, py: 1.2, '&:hover': {bgcolor: palette.cardBg} }}>
                    <Dashboard sx={{ mr: 1.5, fontSize: 20, color: palette.primary }} /> <Typography sx={{color: '#fff', fontWeight: 600}}>{t.dashboard}</Typography>
                  </MenuItem>
                  
                  <MenuItem component={Link} href={`/${locale}/my-courses`} onClick={() => setAnchorEl(null)} sx={{ py: 1.2, '&:hover': {bgcolor: palette.cardBg} }}>
                    <School sx={{ mr: 1.5, fontSize: 20, color: palette.textMain }} /> <Typography sx={{color: '#fff', fontWeight: 600}}>{t.myCourses}</Typography>
                  </MenuItem>

                  {hasAffiliate && (
                    <MenuItem component={Link} href={`/${locale}/affiliate`} onClick={() => setAnchorEl(null)} sx={{ py: 1.2, '&:hover': {bgcolor: palette.cardBg} }}>
                      <TrendingUp sx={{ mr: 1.5, fontSize: 20, color: '#4ade80' }} /> <Typography sx={{color: '#fff', fontWeight: 600}}>{t.affiliate}</Typography>
                    </MenuItem>
                  )}

                  {isInspector && (
                    <MenuItem component={Link} href={`/${locale}/inspector`} onClick={() => setAnchorEl(null)} sx={{ py: 1.2, '&:hover': {bgcolor: palette.cardBg} }}>
                      <CoPresent sx={{ mr: 1.5, fontSize: 20, color: palette.primaryHover }} /> <Typography sx={{color: '#fff', fontWeight: 600}}>{t.inspector}</Typography>
                    </MenuItem>
                  )}

                  {isAdmin && (
                    <MenuItem component={Link} href={`/${locale}/admin`} onClick={() => setAnchorEl(null)} sx={{ py: 1.2, '&:hover': {bgcolor: palette.cardBg} }}>
                      <AdminPanelSettings sx={{ mr: 1.5, fontSize: 20, color: '#a855f7' }} /> <Typography sx={{color: '#fff', fontWeight: 600}}>{t.admin}</Typography>
                    </MenuItem>
                  )}

                  {isManager && (
                    <MenuItem component={Link} href={`/${locale}/manager`} onClick={() => setAnchorEl(null)} sx={{ py: 1.2, '&:hover': {bgcolor: palette.cardBg} }}>
                      <ManageAccountsRounded sx={{ mr: 1.5, fontSize: 20, color: '#f97316' }} /> <Typography sx={{color: '#fff', fontWeight: 600}}>{t.manager}</Typography>
                    </MenuItem>
                  )}

                  <Divider sx={{ borderColor: palette.cardBg, my: 1 }} />
                  <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: palette.danger, '&:hover': {bgcolor: 'rgba(230,47,118,0.1)'} }}>
                    <Logout sx={{ mr: 1.5, fontSize: 20 }} /> <Typography sx={{fontWeight: 700}}>{t.logout}</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', ml: 2 }}>
                <Button component={Link} href={`/${locale}/login`} variant="outlined" 
                  sx={{ 
                    px: 3.5, 
                    py: 1, 
                    borderColor: palette.border, 
                    color: palette.textMain, 
                    fontWeight: 800, 
                    fontSize: '1rem', 
                    borderRadius: 2, 
                    '&:hover': { borderColor: palette.primary, color: palette.primary, background: 'rgba(48,192,242,0.05)' } 
                  }}>
                  {t.login}
                </Button>
                <Button component={Link} href={`/${locale}/register`} variant="contained" 
                  sx={{ 
                    px: 3.5, 
                    py: 1, 
                    background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, 
                    color: '#000', 
                    fontWeight: 800, 
                    fontSize: '1rem', 
                    borderRadius: 2, 
                    '&:hover': { background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})` } 
                  }}>
                  {t.register}
                </Button>
              </Box>
            )}
          </Box>

          {/* Mobile Menu Button */}
          <IconButton sx={{ display: { md: 'none' }, color: palette.primary }} onClick={() => setMobileOpen(true)}>
            <MenuIcon fontSize="large" />
          </IconButton>
        </Toolbar>

        {/* Mobile Drawer */}
        {/* 🔴 تعديل Drawer عشان يفتح من ناحية واحدة في اللغتين */}
        <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { background: palette.bg, width: 300, borderRight: `1px solid ${palette.cardBg}` } }}>

          {mounted && isAuthenticated && user && (
            <Box sx={{ p: 3, background: `linear-gradient(135deg, rgba(48,192,242,0.1), transparent)`, borderBottom: `1px solid ${palette.cardBg}` }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar sx={{ width: 50, height: 50, background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 800, fontSize: '1.2rem' }}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: palette.textMain, fontSize: '1.1rem' }}>{user.firstName} {user.lastName}</Typography>
                  <Typography sx={{ color: palette.textSec, fontSize: '0.85rem', fontWeight: 600 }}>{user.role}</Typography>
                </Box>
              </Box>
            </Box>
          )}

          <List sx={{ pt: 2, px: 2 }}>
            {(!mounted || !isAuthenticated) && (
              <>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton component={Link} href={`/${locale}`} onClick={() => setMobileOpen(false)}
                    sx={{ borderRadius: 2, color: isActive(`/${locale}`) ? palette.primary : palette.textSec, '&:hover': { background: palette.cardBg, color: palette.textMain } }}>
                    <ListItemText primary={t.home} primaryTypographyProps={{ fontWeight: isActive(`/${locale}`) ? 800 : 600, fontSize: '1.1rem' }} />
                  </ListItemButton>
                </ListItem>
                
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton component={Link} href={`/${locale}/courses`} onClick={() => setMobileOpen(false)}
                    sx={{ borderRadius: 2, color: isActive(`/${locale}/courses`) ? palette.primary : palette.textSec, '&:hover': { background: palette.cardBg, color: palette.textMain } }}>
                    <ListItemText primary={t.allCourses} primaryTypographyProps={{ fontWeight: isActive(`/${locale}/courses`) ? 800 : 600, fontSize: '1.1rem' }} />
                  </ListItemButton>
                </ListItem>
              </>
            )}

            {/* 🔴 زر خدمة العملاء (Mobile) بيظهر في كل الحالات */}
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton component="a" href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}
                sx={{ borderRadius: 2, color: '#fff', '&:hover': { background: 'rgba(37,211,102,0.1)' } }}>
                <ListItemIcon sx={{ minWidth: 40, color: '#25D366' }}><SupportAgentRounded /></ListItemIcon>
                <ListItemText primary={t.support} primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            </ListItem>

            {mounted && isAuthenticated && user ? (
              <>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton component={Link} href={`/${locale}/dashboard`} onClick={() => setMobileOpen(false)}
                    sx={{ borderRadius: 2, color: '#fff', '&:hover': { background: palette.cardBg } }}>
                    <ListItemIcon sx={{ minWidth: 40, color: palette.primary }}><Dashboard /></ListItemIcon>
                    <ListItemText primary={t.dashboard} primaryTypographyProps={{ fontWeight: 700 }} />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton component={Link} href={`/${locale}/my-courses`} onClick={() => setMobileOpen(false)}
                    sx={{ borderRadius: 2, color: '#fff', '&:hover': { background: palette.cardBg } }}>
                    <ListItemIcon sx={{ minWidth: 40, color: palette.textMain }}><School /></ListItemIcon>
                    <ListItemText primary={t.myCourses} primaryTypographyProps={{ fontWeight: 700 }} />
                  </ListItemButton>
                </ListItem>
                
                {hasAffiliate && (
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton component={Link} href={`/${locale}/affiliate`} onClick={() => setMobileOpen(false)}
                      sx={{ borderRadius: 2, color: '#fff', '&:hover': { background: palette.cardBg } }}>
                      <ListItemIcon sx={{ minWidth: 40, color: '#4ade80' }}><TrendingUp /></ListItemIcon>
                      <ListItemText primary={t.affiliate} primaryTypographyProps={{ fontWeight: 700 }} />
                    </ListItemButton>
                  </ListItem>
                )}

                {isInspector && (
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton component={Link} href={`/${locale}/inspector`} onClick={() => setMobileOpen(false)}
                      sx={{ borderRadius: 2, color: '#fff', '&:hover': { background: palette.cardBg } }}>
                      <ListItemIcon sx={{ minWidth: 40, color: palette.primaryHover }}><CoPresent /></ListItemIcon>
                      <ListItemText primary={t.inspector} primaryTypographyProps={{ fontWeight: 700 }} />
                    </ListItemButton>
                  </ListItem>
                )}

                {isAdmin && (
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton component={Link} href={`/${locale}/admin`} onClick={() => setMobileOpen(false)}
                      sx={{ borderRadius: 2, color: '#fff', '&:hover': { background: palette.cardBg } }}>
                      <ListItemIcon sx={{ minWidth: 40, color: '#a855f7' }}><AdminPanelSettings /></ListItemIcon>
                      <ListItemText primary={t.admin} primaryTypographyProps={{ fontWeight: 700 }} />
                    </ListItemButton>
                  </ListItem>
                )}

                {isManager && (
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton component={Link} href={`/${locale}/manager`} onClick={() => setMobileOpen(false)}
                      sx={{ borderRadius: 2, color: '#fff', '&:hover': { background: palette.cardBg } }}>
                      <ListItemIcon sx={{ minWidth: 40, color: '#f97316' }}><ManageAccountsRounded /></ListItemIcon>
                      <ListItemText primary={t.manager} primaryTypographyProps={{ fontWeight: 700 }} />
                    </ListItemButton>
                  </ListItem>
                )}

                <Divider sx={{ borderColor: palette.cardBg, my: 3 }} />
                
                <ListItem disablePadding>
                  <ListItemButton onClick={() => { setMobileOpen(false); handleLogout(); }}
                    sx={{ borderRadius: 2, color: palette.danger, '&:hover': { background: 'rgba(230,47,118,0.1)' } }}>
                    <ListItemIcon sx={{ minWidth: 40, color: palette.danger }}><Logout /></ListItemIcon>
                    <ListItemText primary={t.logout} primaryTypographyProps={{ fontWeight: 800 }} />
                  </ListItemButton>
                </ListItem>
              </>
            ) : mounted && (
              <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button component={Link} href={`/${locale}/login`} variant="outlined" fullWidth
                  sx={{ py: 1.5, borderRadius: 2, borderColor: palette.border, color: palette.textMain, fontWeight: 800, fontSize: '1.05rem' }} 
                  onClick={() => setMobileOpen(false)}>
                  {t.login}
                </Button>
                <Button component={Link} href={`/${locale}/register`} variant="contained" fullWidth 
                  sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 800, py: 1.5, borderRadius: 2, fontSize: '1.05rem' }} 
                  onClick={() => setMobileOpen(false)}>
                  {t.register}
                </Button>
              </Box>
            )}
          </List>
        </Drawer>
      </AppBar>
    </Box>
  );
}