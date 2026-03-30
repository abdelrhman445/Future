'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link'; 
import Image from 'next/image';
import { useParams, useRouter, usePathname } from 'next/navigation';
import {
  AppBar, Toolbar, Button, IconButton, Menu, MenuItem, Typography,
  Avatar, Box, Divider, Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Logout,
  AdminPanelSettings, Language, TrendingUp, CoPresent, School, ManageAccountsRounded, SupportAgentRounded, Assignment, LocalOfferRounded, Settings,
  WorkspacePremium, HomeRounded, MenuBook, InventoryRounded
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion'; 
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
  accent: '#f59e0b',
};

export default function Navbar() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); 
  const ar = locale === 'ar';

  useEffect(() => { 
    setMounted(true); 
    const handleScroll = () => {
      // 🔴 لما ينزل أكتر من 20 بيكسل، الناف بار بيفصل ويبقى Pinned
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = {
    home: ar ? 'الرئيسية' : 'Home',
    allCourses: ar ? 'الكورسات' : 'Courses',
    packages: ar ? 'الباقات' : 'Packages', 
    myCourses: ar ? 'الكورسات' : 'Courses', 
    myPackages: ar ? 'باقاتي' : 'My Packages',
    myCertificates: ar ? 'شهاداتي' : 'My Certificates',
    login: ar ? 'دخول' : 'Login',
    register: ar ? 'إنشاء حساب' : 'Register',
    dashboard: ar ? 'لوحتي' : 'Dashboard',
    affiliate: ar ? 'برنامج الإحالة' : 'Affiliate',
    admin: ar ? 'الإدارة' : 'Admin',
    manager: ar ? 'لوحة المدير' : 'Manager Panel', 
    inspector: ar ? 'طلبات المحاضرات' : 'Presentations',
    evaluations: ar ? 'تقييم الطلاب' : 'Student Evaluations',
    settings: ar ? 'إعدادات الحساب' : 'Account Settings',
    logout: ar ? 'تسجيل الخروج' : 'Logout',
    support: ar ? 'خدمة العملاء' : 'Customer Support', 
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    try { await authApi.logout(); } catch {}
    logout();
    router.push(`/${locale}`);
    toast.success(ar ? 'تم تسجيل الخروج' : 'Logged out');
  };

  const isActive = (href: string) => pathname === href;

  const hasAffiliate = mounted && isAuthenticated && user?.affiliateCode;
  const isAdmin = mounted && isAuthenticated && user?.role === 'ADMIN'; 
  const isManager = mounted && isAuthenticated && user?.role === 'MANAGER'; 
  const isInspector = mounted && isAuthenticated && user?.role === 'INSPECTOR';

  return (
    <>
      {/* 🔴 مساحة وهمية (Placeholder) تعوض مساحة الناف بار لما يبقى Fixed عشان الصفحة متتنططش */}
      <Box sx={{ height: isScrolled ? '85px' : '0px', transition: 'height 0.4s ease' }} />

      <Box 
        component={motion.div} 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        sx={{ 
          // 🔴 التعديل هنا: طبيعي (Relative) في البداية، ولما تنزل يقلب Fixed عشان يبقى Pinned
          position: isScrolled ? 'fixed' : 'relative',
          top: 0, 
          left: 0, 
          right: 0, 
          width: '100%', 
          zIndex: 1100,
          animation: isScrolled ? 'slideDown 0.4s ease-in-out' : 'none',
          '@keyframes slideDown': {
            '0%': { transform: 'translateY(-100%)' },
            '100%': { transform: 'translateY(0)' }
          }
        }}
      >
        <AppBar position="static" elevation={0}
          sx={{ 
            background: isScrolled ? 'rgba(8, 69, 112, 0.95)' : 'transparent', 
            backdropFilter: isScrolled ? 'blur(20px)' : 'none', 
            WebkitBackdropFilter: isScrolled ? 'blur(20px)' : 'none',
            borderBottom: isScrolled ? `1px solid rgba(48,192,242,0.3)` : `1px solid transparent`,
            boxShadow: isScrolled ? '0 10px 30px rgba(0, 0, 0, 0.6)' : 'none',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
          <Toolbar 
            sx={{ 
              justifyContent: 'space-between', 
              maxWidth: 1280, 
              width: '100%', 
              mx: 'auto', 
              px: { xs: 2, md: 3 }, 
              py: isScrolled ? 0.5 : 1.5, 
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >

            <Link href={`/${locale}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Box component={motion.div} whileHover={{ scale: 1.05 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, filter: 'drop-shadow(0px 0px 8px rgba(48,192,242,0.4))' }}>
                <Image src="/logo.png" alt="Future Logo" width={38} height={38} style={{ objectFit: 'contain' }} priority />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: 22, background: `linear-gradient(135deg, ${palette.primary}, #fff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 0.5, textShadow: '0 2px 10px rgba(48,192,242,0.2)' }}>
                {ar ? 'فيوتشر أكاديمي' : 'Future Academy'}
              </Typography>
            </Link>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center' }}>
              {(
                mounted && isAuthenticated
                  ? [
                      { label: t.dashboard, href: `/${locale}/dashboard` }, 
                      { label: t.myCourses, href: `/${locale}/courses` }, 
                      { label: t.packages, href: `/${locale}/packages` }, 
                    ]
                  : [
                      { label: t.home, href: `/${locale}` },
                      { label: t.allCourses, href: `/${locale}/courses` },
                      { label: t.packages, href: `/${locale}/packages` }, 
                    ]
              ).map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  sx={{
                    position: 'relative',
                    color: isActive(link.href) ? palette.primary : palette.textSec,
                    fontWeight: isActive(link.href) ? 800 : 600,
                    fontSize: '1rem',
                    letterSpacing: 0.5,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: isActive(link.href) ? '20px' : '0px',
                      height: '3px',
                      borderRadius: '2px',
                      background: palette.primary,
                      transition: 'width 0.3s ease',
                      boxShadow: `0 0 8px ${palette.primary}`,
                    },
                    '&:hover': { 
                      color: palette.textMain, 
                      background: 'rgba(48,192,242,0.05)',
                    },
                    '&:hover::after': {
                      width: '20px'
                    }
                  }}
                >
                  {link.label}
                </Button>
              ))}

              <Button
                href="https://wa.me/201155242794" 
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: palette.textSec,
                  fontWeight: 600,
                  fontSize: '1rem',
                  letterSpacing: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': { color: '#25D366', background: 'rgba(37,211,102,0.08)', boxShadow: '0 4px 15px rgba(37,211,102,0.1)' } 
                }}
              >
                <SupportAgentRounded fontSize="small" sx={{ filter: 'drop-shadow(0 0 5px rgba(37,211,102,0.3))' }} />
                {t.support}
              </Button>

              <IconButton
                onClick={() => router.push(pathname.replace(`/${locale}`, locale === 'ar' ? '/en' : '/ar'))}
                sx={{ 
                  color: palette.textSec, 
                  border: `1px solid rgba(255,255,255,0.1)`, 
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px', 
                  px: 1.5, 
                  mx: 1, 
                  gap: 0.5, 
                  transition: 'all 0.3s',
                  '&:hover': { borderColor: palette.primary, color: palette.primary, background: 'rgba(48,192,242,0.05)', transform: 'translateY(-2px)', boxShadow: `0 4px 12px rgba(48,192,242,0.15)` } 
                }} 
                size="small"
              >
                <Language sx={{ fontSize: 18 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{locale === 'ar' ? 'EN' : 'عربي'}</Typography>
              </IconButton>

              {!mounted ? (
                <Box sx={{ width: 150 }} />
              ) : isAuthenticated && user ? (
                <>
                  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5, ml: 1, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}>
                    <Avatar sx={{ 
                      width: 44, height: 44, 
                      background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, 
                      color: '#000', fontSize: 16, fontWeight: 900, 
                      border: `2px solid rgba(255,255,255,0.2)`,
                      boxShadow: `0 0 15px rgba(48,192,242,0.4)`
                    }}>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </Avatar>
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{ 
                      sx: { 
                        background: 'rgba(10, 10, 15, 0.95)', 
                        backdropFilter: 'blur(20px)',
                        border: `1px solid rgba(255,255,255,0.1)`, 
                        mt: 1.5, 
                        minWidth: 240, 
                        borderRadius: 4, 
                        boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 20px rgba(48,192,242,0.1)`,
                        overflow: 'hidden'
                      } 
                    }}>

                    <Box sx={{ px: 2.5, py: 2, background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: palette.textMain, letterSpacing: 0.5 }}>{user.firstName} {user.lastName}</Typography>
                      <Typography sx={{ color: palette.textSec, fontSize: '0.8rem', opacity: 0.8 }}>{user.email}</Typography>
                    </Box>

                    <Box sx={{ p: 1 }}>
                      <MenuItem component={Link} href={`/${locale}/dashboard`} onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mb: 0.5, py: 1.2, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(255,255,255,0.05)', pl: 3} }}>
                        <Dashboard sx={{ mr: 1.5, fontSize: 20, color: palette.primary }} /> <Typography sx={{color: '#fff', fontWeight: 600, fontSize: '0.95rem'}}>{t.dashboard}</Typography>
                      </MenuItem>
                      
                      <MenuItem component={Link} href={`/${locale}/my-courses`} onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mb: 0.5, py: 1.2, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(255,255,255,0.05)', pl: 3} }}>
                        <School sx={{ mr: 1.5, fontSize: 20, color: palette.textMain }} /> <Typography sx={{color: '#fff', fontWeight: 600, fontSize: '0.95rem'}}>{t.myCourses}</Typography>
                      </MenuItem>

                      <MenuItem component={Link} href={`/${locale}/my-packages`} onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mb: 0.5, py: 1.2, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(255,255,255,0.05)', pl: 3} }}>
                        <LocalOfferRounded sx={{ mr: 1.5, fontSize: 20, color: palette.accent }} /> <Typography sx={{color: '#fff', fontWeight: 600, fontSize: '0.95rem'}}>{t.myPackages}</Typography>
                      </MenuItem>

                      {hasAffiliate && (
                        <MenuItem component={Link} href={`/${locale}/affiliate`} onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mb: 0.5, py: 1.2, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(74,222,128,0.1)', pl: 3} }}>
                          <TrendingUp sx={{ mr: 1.5, fontSize: 20, color: '#4ade80' }} /> <Typography sx={{color: '#fff', fontWeight: 600, fontSize: '0.95rem'}}>{t.affiliate}</Typography>
                        </MenuItem>
                      )}

                      {isInspector && (
                        <Box>
                          <MenuItem component={Link} href={`/${locale}/inspector`} onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mb: 0.5, py: 1.2, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(255,255,255,0.05)', pl: 3} }}>
                            <CoPresent sx={{ mr: 1.5, fontSize: 20, color: palette.primaryHover }} /> <Typography sx={{color: '#fff', fontWeight: 600, fontSize: '0.95rem'}}>{t.inspector}</Typography>
                          </MenuItem>
                          <MenuItem component={Link} href={`/${locale}/inspector/evaluations`} onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mb: 0.5, py: 1.2, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(255,255,255,0.05)', pl: 3} }}>
                            <Assignment sx={{ mr: 1.5, fontSize: 20, color: palette.primaryHover }} /> <Typography sx={{color: '#fff', fontWeight: 600, fontSize: '0.95rem'}}>{t.evaluations}</Typography>
                          </MenuItem>
                        </Box>
                      )}

                      {isAdmin && (
                        <MenuItem component={Link} href={`/${locale}/admin`} onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mb: 0.5, py: 1.2, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(168,85,247,0.1)', pl: 3} }}>
                          <AdminPanelSettings sx={{ mr: 1.5, fontSize: 20, color: '#a855f7' }} /> <Typography sx={{color: '#fff', fontWeight: 600, fontSize: '0.95rem'}}>{t.admin}</Typography>
                        </MenuItem>
                      )}

                      {isManager && (
                        <MenuItem component={Link} href={`/${locale}/manager`} onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mb: 0.5, py: 1.2, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(249,115,22,0.1)', pl: 3} }}>
                          <ManageAccountsRounded sx={{ mr: 1.5, fontSize: 20, color: '#f97316' }} /> <Typography sx={{color: '#fff', fontWeight: 600, fontSize: '0.95rem'}}>{t.manager}</Typography>
                        </MenuItem>
                      )}

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', my: 1 }} />
                      
                      <MenuItem component={Link} href={`/${locale}/my-certificates`} onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mb: 0.5, py: 1.2, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(255,255,255,0.05)', pl: 3} }}>
                        <WorkspacePremium sx={{ mr: 1.5, fontSize: 20, color: palette.primary }} /> <Typography sx={{color: '#fff', fontWeight: 600, fontSize: '0.95rem'}}>{t.myCertificates}</Typography>
                      </MenuItem>

                      <MenuItem component={Link} href={`/${locale}/settings`} onClick={() => setAnchorEl(null)} sx={{ borderRadius: 2, mb: 0.5, py: 1.2, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(255,255,255,0.05)', pl: 3} }}>
                        <Settings sx={{ mr: 1.5, fontSize: 20, color: palette.textSec }} /> <Typography sx={{color: '#fff', fontWeight: 600, fontSize: '0.95rem'}}>{t.settings}</Typography>
                      </MenuItem>

                      <MenuItem onClick={handleLogout} sx={{ borderRadius: 2, py: 1.2, color: palette.danger, transition: 'all 0.2s', '&:hover': {bgcolor: 'rgba(230,47,118,0.1)', pl: 3} }}>
                        <Logout sx={{ mr: 1.5, fontSize: 20 }} /> <Typography sx={{fontWeight: 800, fontSize: '0.95rem'}}>{t.logout}</Typography>
                      </MenuItem>
                    </Box>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', ml: 2 }}>
                  <Button component={Link} href={`/${locale}/login`} variant="outlined" 
                    sx={{ 
                      px: 3.5, 
                      py: 1, 
                      borderColor: 'rgba(255,255,255,0.2)', 
                      color: '#fff', 
                      fontWeight: 800, 
                      fontSize: '0.95rem', 
                      borderRadius: 3, 
                      transition: 'all 0.3s',
                      '&:hover': { borderColor: palette.primary, color: palette.primary, background: 'rgba(48,192,242,0.05)', transform: 'translateY(-2px)', boxShadow: `0 4px 15px rgba(48,192,242,0.15)` } 
                    }}>
                    {t.login}
                  </Button>
                  <Button component={Link} href={`/${locale}/register`} variant="contained" 
                    sx={{ 
                      px: 3.5, 
                      py: 1, 
                      background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, 
                      color: '#000', 
                      fontWeight: 900, 
                      fontSize: '0.95rem', 
                      borderRadius: 3, 
                      boxShadow: `0 4px 15px rgba(48,192,242,0.3)`,
                      transition: 'all 0.3s',
                      '&:hover': { background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})`, transform: 'translateY(-2px)', boxShadow: `0 6px 20px rgba(48,192,242,0.5)` } 
                    }}>
                    {t.register}
                  </Button>
                </Box>
              )}
            </Box>

            <IconButton sx={{ display: { md: 'none' }, color: palette.primary }} onClick={() => setMobileOpen(true)}>
              <MenuIcon fontSize="large" />
            </IconButton>
          </Toolbar>

          {/* ================= MOBILE DRAWER ================= */}
          <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}
            PaperProps={{ 
              sx: { 
                background: 'rgba(8, 69, 112, 0.85)', 
                backdropFilter: 'blur(20px)', 
                width: 320, 
                borderRight: `1px solid rgba(37,154,203,0.2)`,
                boxShadow: '20px 0 50px rgba(0,0,0,0.5)'
              } 
            }}>

            {mounted && isAuthenticated && user && (
              <Box sx={{ p: 3, background: `linear-gradient(135deg, rgba(48,192,242,0.05), transparent)`, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{ width: 56, height: 56, background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 900, fontSize: '1.4rem', boxShadow: `0 0 15px rgba(48,192,242,0.3)` }}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 900, color: palette.textMain, fontSize: '1.15rem', letterSpacing: 0.5 }}>{user.firstName} {user.lastName}</Typography>
                    <Typography sx={{ color: palette.textSec, fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>{user.role}</Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <List sx={{ pt: 2, px: 2, pb: 4 }}>
              
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton component={Link} href={`/${locale}`} onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: 3, color: isActive(`/${locale}`) ? palette.primary : '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', pl: 3 } }}>
                  <ListItemIcon sx={{ minWidth: 36, color: isActive(`/${locale}`) ? palette.primary : palette.textSec }}><HomeRounded /></ListItemIcon>
                  <ListItemText primary={t.home} primaryTypographyProps={{ fontWeight: isActive(`/${locale}`) ? 900 : 600, fontSize: '1rem' }} />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton component={Link} href={`/${locale}/courses`} onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: 3, color: isActive(`/${locale}/courses`) ? palette.primary : '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', pl: 3 } }}>
                  <ListItemIcon sx={{ minWidth: 36, color: isActive(`/${locale}/courses`) ? palette.primary : palette.textSec }}><MenuBook /></ListItemIcon>
                  <ListItemText primary={t.allCourses} primaryTypographyProps={{ fontWeight: isActive(`/${locale}/courses`) ? 900 : 600, fontSize: '1rem' }} />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton component={Link} href={`/${locale}/packages`} onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: 3, color: isActive(`/${locale}/packages`) ? palette.primary : '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', pl: 3 } }}>
                  <ListItemIcon sx={{ minWidth: 36, color: isActive(`/${locale}/packages`) ? palette.primary : palette.textSec }}><InventoryRounded /></ListItemIcon>
                  <ListItemText primary={t.packages} primaryTypographyProps={{ fontWeight: isActive(`/${locale}/packages`) ? 900 : 600, fontSize: '1rem' }} />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton component="a" href="https://wa.me/201155242794" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}
                  sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(37,211,102,0.1)', pl: 3 } }}>
                  <ListItemIcon sx={{ minWidth: 36, color: '#25D366' }}><SupportAgentRounded /></ListItemIcon>
                  <ListItemText primary={t.support} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                </ListItemButton>
              </ListItem>

              {mounted && isAuthenticated && user ? (
                <>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
                  
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton component={Link} href={`/${locale}/dashboard`} onClick={() => setMobileOpen(false)}
                      sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', pl: 3 } }}>
                      <ListItemIcon sx={{ minWidth: 36, color: palette.primary }}><Dashboard /></ListItemIcon>
                      <ListItemText primary={t.dashboard} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton component={Link} href={`/${locale}/my-courses`} onClick={() => setMobileOpen(false)}
                      sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', pl: 3 } }}>
                      <ListItemIcon sx={{ minWidth: 36, color: palette.textMain }}><School /></ListItemIcon>
                      <ListItemText primary={t.myCourses} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton component={Link} href={`/${locale}/my-packages`} onClick={() => setMobileOpen(false)}
                      sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', pl: 3 } }}>
                      <ListItemIcon sx={{ minWidth: 36, color: palette.accent }}><LocalOfferRounded /></ListItemIcon>
                      <ListItemText primary={t.myPackages} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                    </ListItemButton>
                  </ListItem>
                  
                  {hasAffiliate && (
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton component={Link} href={`/${locale}/affiliate`} onClick={() => setMobileOpen(false)}
                        sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(74,222,128,0.1)', pl: 3 } }}>
                        <ListItemIcon sx={{ minWidth: 36, color: '#4ade80' }}><TrendingUp /></ListItemIcon>
                        <ListItemText primary={t.affiliate} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                      </ListItemButton>
                    </ListItem>
                  )}

                  {isInspector && (
                    <>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton component={Link} href={`/${locale}/inspector`} onClick={() => setMobileOpen(false)}
                          sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', pl: 3 } }}>
                          <ListItemIcon sx={{ minWidth: 36, color: palette.primaryHover }}><CoPresent /></ListItemIcon>
                          <ListItemText primary={t.inspector} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                        </ListItemButton>
                      </ListItem>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <ListItemButton component={Link} href={`/${locale}/inspector/evaluations`} onClick={() => setMobileOpen(false)}
                          sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', pl: 3 } }}>
                          <ListItemIcon sx={{ minWidth: 36, color: palette.primaryHover }}><Assignment /></ListItemIcon>
                          <ListItemText primary={t.evaluations} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                        </ListItemButton>
                      </ListItem>
                    </>
                  )}

                  {isAdmin && (
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton component={Link} href={`/${locale}/admin`} onClick={() => setMobileOpen(false)}
                        sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(168,85,247,0.1)', pl: 3 } }}>
                        <ListItemIcon sx={{ minWidth: 36, color: '#a855f7' }}><AdminPanelSettings /></ListItemIcon>
                        <ListItemText primary={t.admin} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                      </ListItemButton>
                    </ListItem>
                  )}

                  {isManager && (
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemButton component={Link} href={`/${locale}/manager`} onClick={() => setMobileOpen(false)}
                        sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(249,115,22,0.1)', pl: 3 } }}>
                        <ListItemIcon sx={{ minWidth: 36, color: '#f97316' }}><ManageAccountsRounded /></ListItemIcon>
                        <ListItemText primary={t.manager} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                      </ListItemButton>
                    </ListItem>
                  )}

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
                  
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton component={Link} href={`/${locale}/my-certificates`} onClick={() => setMobileOpen(false)}
                      sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', pl: 3 } }}>
                      <ListItemIcon sx={{ minWidth: 36, color: palette.primary }}><WorkspacePremium /></ListItemIcon>
                      <ListItemText primary={t.myCertificates} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <ListItemButton component={Link} href={`/${locale}/settings`} onClick={() => setMobileOpen(false)}
                      sx={{ borderRadius: 3, color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)', pl: 3 } }}>
                      <ListItemIcon sx={{ minWidth: 36, color: palette.textSec }}><Settings /></ListItemIcon>
                      <ListItemText primary={t.settings} primaryTypographyProps={{ fontWeight: 800, fontSize: '1rem' }} />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding>
                    <ListItemButton onClick={() => { setMobileOpen(false); handleLogout(); }}
                      sx={{ borderRadius: 3, color: palette.danger, transition: 'all 0.2s', '&:hover': { background: 'rgba(230,47,118,0.1)', pl: 3 } }}>
                      <ListItemIcon sx={{ minWidth: 36, color: palette.danger }}><Logout /></ListItemIcon>
                      <ListItemText primary={t.logout} primaryTypographyProps={{ fontWeight: 900, fontSize: '1rem' }} />
                    </ListItemButton>
                  </ListItem>
                </>
              ) : mounted && (
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2, px: 1 }}>
                  <Button component={Link} href={`/${locale}/login`} variant="outlined" fullWidth
                    sx={{ py: 1.5, borderRadius: 3, borderColor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 900, fontSize: '1.05rem', transition: 'all 0.3s', '&:hover': { borderColor: palette.primary, color: palette.primary, background: 'rgba(48,192,242,0.05)' } }} 
                    onClick={() => setMobileOpen(false)}>
                    {t.login}
                  </Button>
                  <Button component={Link} href={`/${locale}/register`} variant="contained" fullWidth 
                    sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 900, py: 1.5, borderRadius: 3, fontSize: '1.05rem', boxShadow: `0 4px 15px rgba(48,192,242,0.3)`, transition: 'all 0.3s', '&:hover': { background: `linear-gradient(135deg, ${palette.primaryHover}, ${palette.primary})`, boxShadow: `0 6px 20px rgba(48,192,242,0.5)` } }} 
                    onClick={() => setMobileOpen(false)}>
                    {t.register}
                  </Button>
                </Box>
              )}
            </List>
          </Drawer>
        </AppBar>
      </Box>
    </>
  );
}
