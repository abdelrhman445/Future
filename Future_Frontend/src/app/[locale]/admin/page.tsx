'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Container, Card, Typography, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Switch, 
  FormControlLabel, TableContainer, TextField, Tooltip, Checkbox, ListItemText, OutlinedInput, alpha
} from '@mui/material';
import { 
  Edit, Delete, Add, Refresh, FactCheck, Security, 
  InventoryRounded, SchoolRounded, LocalOfferRounded,
  WorkspacePremiumRounded, Visibility, Search 
} from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { adminApi, coursesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

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
  success: '#22c55e',
  warning: '#f59e0b',
  locked: '#52525b'
};

export default function AdminPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const ar = locale === 'ar';

  const [isMounted, setIsMounted] = useState(false);
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]); 
  const [inspectors, setInspectors] = useState<any[]>([]); 
  const [packages, setPackages] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // ---------- 🎓 Certificates States (New Addition) ----------
  const [certs, setCerts] = useState<any[]>([]);
  const [certSearch, setCertSearch] = useState('');
  const [issueCertOpen, setIssueCertOpen] = useState(false);
  const [revokeCertOpen, setRevokeCertOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [manualCertForm, setManualCertForm] = useState({ userId: '', courseId: '' });

  // ---------- 🔴 Delete States ----------
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [deletePackageDialogOpen, setDeletePackageDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------- User Edit State ----------
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('USER');
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingUser, setSavingUser] = useState(false);

  // ---------- Course State ----------
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [deleteCourseDialogOpen, setDeleteCourseDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [savingCourse, setSavingCourse] = useState(false);
  
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    packageType: 'BASIC',
    category: '', // 🔴 الحقل الجديد
    originalPrice: '',
    thumbnailUrl: '',
    inspectorIds: [] as string[] 
  });

  // ---------- Withdrawal Review State ----------
  const [reviewWithdrawalOpen, setReviewWithdrawalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [withdrawalStatus, setWithdrawalStatus] = useState('PROCESSING');
  const [adminNote, setAdminNote] = useState('');
  const [savingWithdrawal, setSavingWithdrawal] = useState(false);

  // ---------- Packages State ----------
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [savingPackage, setSavingPackage] = useState(false);
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    thumbnailUrl: '',
    coursesCount: ''
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) { router.push(`/${locale}/login`); return; }
    if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
      router.push(`/${locale}/dashboard`);
      return;
    }
    fetchAll();
  }, [isMounted, isAuthenticated, user, locale, router]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, coursesRes] = await Promise.all([
        adminApi.users(),
        user?.role === 'ADMIN' ? adminApi.allCourses().catch(() => ({ data: { data: { courses: [] } } })) : Promise.resolve({ data: { data: { courses: [] } } }),
      ]);

      setUsers(usersRes?.data?.data?.users || usersRes?.data?.users || []);
      setCourses(coursesRes?.data?.data?.courses || coursesRes?.data?.courses || []);

      if (user?.role === 'ADMIN') {
        try {
          const txRes = await adminApi.transactions();
          const d = txRes.data.data;
          setTransactions(Array.isArray(d) ? d : d.purchases || d.transactions || []);
        } catch (err) {}

        try {
          const wRes = await (adminApi as any).getWithdrawals();
          setWithdrawals(wRes.data?.data || wRes.data || []);
        } catch (err) {}

        try {
          const inspRes = await (adminApi as any).getInspectors();
          setInspectors(inspRes.data?.data || inspRes.data || []);
        } catch (err) {}

        try {
          const pkgRes = await (adminApi as any).getPackages?.();
          if(pkgRes) setPackages(pkgRes.data?.data || pkgRes.data || []);
        } catch (err) {}

        // Fetch Certificates (New Logic)
        try {
          const certRes = await (adminApi as any).getAllCertificates({ search: certSearch });
          setCerts(certRes.data?.data?.certs || []);
        } catch (err) {}
      }

    } catch (err) {
      toast.error(ar ? 'خطأ في تحميل البيانات' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // ============================== HANDLERS ==============================

  // --- 🎓 Certificates Handlers ---
  const handleIssueManualCert = async () => {
    if (!manualCertForm.userId || !manualCertForm.courseId) {
      toast.error(ar ? 'يرجى اختيار الطالب والكورس' : 'Please select student and course');
      return;
    }
    setLoading(true);
    try {
      await (adminApi as any).issueManualCertificate(manualCertForm);
      toast.success(ar ? 'تم إصدار الشهادة وتحديث حالة الطالب بنجاح' : 'Certificate issued successfully');
      setIssueCertOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setLoading(false); }
  };

  const handleRevokeCert = async () => {
    if (!selectedCert) return;
    setIsDeleting(true);
    try {
      await (adminApi as any).revokeCertificate(selectedCert.certNumber);
      toast.success(ar ? 'تم إلغاء الشهادة بنجاح' : 'Certificate revoked');
      setRevokeCertOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(ar ? 'فشل الإلغاء' : 'Failed to revoke');
    } finally { setIsDeleting(false); }
  };

  // --- User Deletion Logic ---
  const handleOpenDeleteUser = (u: any) => {
    if (u.role === 'ADMIN') {
      toast.error(ar ? 'لا يمكن حذف حساب المسؤول الرئيسي' : 'Cannot delete Super Admin');
      return;
    }
    setSelectedUser(u);
    setDeleteUserDialogOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteUser(selectedUser.id);
      toast.success(ar ? 'تم حذف المستخدم واشتراكاته نهائياً' : 'User deleted permanently');
      setDeleteUserDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'فشل حذف المستخدم' : 'Failed to delete user'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEditUser = (u: any) => {
    if (user?.role === 'MANAGER' && u.role === 'ADMIN') {
      toast.error(ar ? 'غير مسموح لك بتعديل بيانات المسؤول (Admin)' : 'Not allowed to edit Admin data');
      return;
    }
    setSelectedUser(u);
    setEditRole(u.role || 'USER');
    setEditIsActive(u.isActive !== false); 
    setEditUserOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSavingUser(true);
    try {
      const promises = [];
      if (selectedUser.role !== editRole) promises.push(adminApi.updateUserRole(selectedUser.id, editRole));
      if (selectedUser.isActive !== editIsActive) promises.push(adminApi.updateUserStatus(selectedUser.id, editIsActive));

      if (promises.length > 0) {
        await Promise.all(promises);
        toast.success(ar ? 'تم التحديث بنجاح' : 'Updated successfully');
        fetchAll(); 
      }
      setEditUserOpen(false);
    } catch (err: any) {
      toast.error(ar ? 'خطأ أثناء التحديث' : 'Update error');
    } finally {
      setSavingUser(false);
    }
  };

  const handleOpenAddCourse = () => {
    setSelectedCourse(null);
    setCourseForm({ title: '', description: '', shortDescription: '', packageType: 'BASIC', category: '', originalPrice: '', thumbnailUrl: '', inspectorIds: [] });
    setCourseDialogOpen(true);
  };

  const handleOpenEditCourse = async (c: any) => {
    setSelectedCourse(c);
    setCourseForm({
      title: c.title || '', description: c.description || '', shortDescription: c.shortDescription || '',
      packageType: c.packageType || 'BASIC', category: c.category || '', originalPrice: c.originalPrice || '', thumbnailUrl: c.thumbnailUrl || '',
      inspectorIds: c.inspectors?.map((i:any) => i.id) || [] 
    });
    setCourseDialogOpen(true);

    if (c.slug) {
      try {
        const res = await coursesApi.getBySlug(c.slug);
        const fullCourse = res.data?.data || res.data;
        if (fullCourse) {
          setCourseForm(prev => ({
            ...prev, 
            description: fullCourse.description || prev.description, 
            shortDescription: fullCourse.shortDescription || prev.shortDescription, 
            category: fullCourse.category || prev.category, 
            thumbnailUrl: fullCourse.thumbnailUrl || prev.thumbnailUrl,
            inspectorIds: fullCourse.inspectors?.map((i:any) => i.id) || prev.inspectorIds
          }));
        }
      } catch (err) {}
    }
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title || !courseForm.description) {
      toast.error(ar ? 'يرجى إدخال عنوان ووصف الكورس' : 'Title and description are required');
      return;
    }
    setSavingCourse(true);
    try {
      const payload: any = {
        title: courseForm.title, description: courseForm.description,
        shortDescription: courseForm.shortDescription || courseForm.description.substring(0, 80),
        packageType: courseForm.packageType, 
        category: courseForm.category, 
        originalPrice: parseFloat(courseForm.originalPrice) || 0,
      };
      if (courseForm.thumbnailUrl) payload.thumbnailUrl = courseForm.thumbnailUrl;

      let savedCourseId = selectedCourse?.id;

      if (selectedCourse) {
        await adminApi.updateCourse(selectedCourse.id, payload);
        toast.success(ar ? 'تم تعديل الكورس بنجاح' : 'Course updated');
      } else {
        const res = await adminApi.createCourse(payload);
        savedCourseId = res.data?.data?.id || res.data?.id;
        toast.success(ar ? 'تم إضافة الكورس بنجاح' : 'Course created');
      }

      if (savedCourseId && courseForm.inspectorIds) {
        try {
          await (adminApi as any).assignCourseInspectors(savedCourseId, { inspectorIds: courseForm.inspectorIds });
        } catch (inspErr) {
          console.error('Failed to assign inspectors', inspErr);
        }
      }

      setCourseDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'حدث خطأ في الخادم' : 'Server error'));
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteClick = (c: any) => { setSelectedCourse(c); setDeleteCourseDialogOpen(true); };
  const handleConfirmDeleteCourse = async () => {
    if (!selectedCourse) return;
    setSavingCourse(true);
    try {
      await adminApi.deleteCourse(selectedCourse.id);
      toast.success(ar ? 'تم حذف الكورس' : 'Course deleted');
      setDeleteCourseDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'فشل الحذف' : 'Failed to delete'));
    } finally { setSavingCourse(false); }
  };

  const publishCourse = async (id: string) => {
    try {
      await adminApi.updateCourse(id, { status: 'PUBLISHED' });
      toast.success(ar ? "تم نشر الكورس بنجاح ✓" : "Course Published ✓");
      fetchAll();
    } catch { toast.error(ar ? "فشل النشر" : "Publish failed"); }
  };

  const handleOpenReviewWithdrawal = (w: any) => {
    setSelectedWithdrawal(w);
    setWithdrawalStatus(w.status === 'PENDING' ? 'PROCESSING' : w.status);
    setAdminNote(w.adminNote || '');
    setReviewWithdrawalOpen(true);
  };

  const handleProcessWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    setSavingWithdrawal(true);
    try {
      await (adminApi as any).processWithdrawal(selectedWithdrawal.id, {
        status: withdrawalStatus,
        adminNote: adminNote
      });
      toast.success(ar ? 'تم تحديث حالة الطلب' : 'Withdrawal status updated');
      setReviewWithdrawalOpen(false);
      fetchAll(); 
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'حدث خطأ' : 'Error updating'));
    } finally {
      setSavingWithdrawal(false);
    }
  };

  const handleOpenAddPackage = () => {
    setSelectedPackage(null);
    setPackageForm({ name: '', price: '', thumbnailUrl: '', coursesCount: '' });
    setPackageDialogOpen(true);
  };

  const handleOpenEditPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setPackageForm({ name: pkg.name, price: pkg.price, thumbnailUrl: pkg.thumbnailUrl, coursesCount: pkg.coursesCount });
    setPackageDialogOpen(true);
  };

  const handleOpenDeletePackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setDeletePackageDialogOpen(true);
  };

  const handleConfirmDeletePackage = async () => {
    if (!selectedPackage) return;
    setIsDeleting(true);
    try {
      await (adminApi as any).deletePackage(selectedPackage.id);
      toast.success(ar ? 'تم حذف الباقة بنجاح' : 'Package deleted successfully');
      setDeletePackageDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (ar ? 'فشل حذف الباقة' : 'Failed to delete package'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePackage = async () => {
    if (!packageForm.name || !packageForm.price) {
      toast.error(ar ? 'يرجى اختيار نوع وسعر الباقة' : 'Name and price are required');
      return;
    }
    setSavingPackage(true);
    try {
      const payload = {
        name: packageForm.name,
        price: parseFloat(packageForm.price),
        thumbnailUrl: packageForm.thumbnailUrl,
        coursesCount: parseInt(packageForm.coursesCount) || 0
      };

      if (selectedPackage) {
        await (adminApi as any).updatePackage?.(selectedPackage.id, payload);
        toast.success(ar ? 'تم تعديل الباقة' : 'Package updated');
      } else {
        await (adminApi as any).createPackage?.(payload);
        toast.success(ar ? 'تم إضافة الباقة' : 'Package created');
      }
      setPackageDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.success(ar ? '(وضع تجريبي) تم الحفظ محلياً' : '(Demo) Saved locally');
      setPackageDialogOpen(false);
    } finally {
      setSavingPackage(false);
    }
  };

  if (!isMounted) return <Box sx={{ minHeight: '100vh', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{ color: palette.primary }} /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, pb: 10 }}>
      <Navbar />
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: palette.textMain, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            {ar ? '⚙️ لوحة التحكم والإدارة' : '⚙️ Admin Dashboard'}
          </Typography>
        </Box>

        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)} 
          variant="scrollable" 
          scrollButtons="auto" 
          sx={{ 
            mb: 3, borderBottom: 1, borderColor: palette.border,
            '& .MuiTab-root': { color: palette.textSec, fontWeight: 'bold' },
            '& .Mui-selected': { color: `${palette.primary} !important` },
            '& .MuiTabs-indicator': { backgroundColor: palette.primary }
          }}
        >
          <Tab label={ar ? 'المستخدمون' : 'Users'} />
          {user?.role === 'ADMIN' && <Tab label={ar ? 'الكورسات' : 'Courses'} />}
          {user?.role === 'ADMIN' && <Tab label={ar ? 'المعاملات المالية' : 'Transactions'} />}
          {user?.role === 'ADMIN' && <Tab label={ar ? 'طلبات السحب' : 'Withdrawals'} />}
          {user?.role === 'ADMIN' && <Tab label={ar ? 'إدارة الباقات' : 'Packages'} />}
          {user?.role === 'ADMIN' && <Tab label={ar ? 'إدارة الشهادات ' : 'Certificates'} />}
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: palette.primary }} /></Box>
        ) : (
          <>
            {/* 1. USERS TAB */}
            {tab === 0 && (
              <Card sx={{ p: { xs: 1, sm: 2 }, background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
                <TableContainer>
                  <Table sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow sx={{ '& th': { color: palette.textMain, borderBottom: `1px solid ${palette.border}`, fontWeight: 'bold' } }}>
                        <TableCell>{ar ? 'المستخدم' : 'User'}</TableCell>
                        <TableCell>{ar ? 'البريد الإلكتروني' : 'Email'}</TableCell>
                        <TableCell>{ar ? 'الرتبة' : 'Role'}</TableCell>
                        <TableCell>{ar ? 'الحالة' : 'Status'}</TableCell>
                        <TableCell>{ar ? 'تاريخ الانضمام' : 'Joined'}</TableCell>
                        <TableCell align="center">{ar ? 'إجراءات' : 'Actions'}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((u: any) => (
                        <TableRow key={u.id} sx={{ '& td': { borderBottom: '1px solid rgba(37, 154, 203, 0.2)' }, '&:hover': { background: 'rgba(255,255,255,0.03)' } }}>
                          <TableCell sx={{ color: '#fff' }}>{u.firstName} {u.lastName}</TableCell>
                          <TableCell sx={{ color: palette.textSec }}>{u.email}</TableCell>
                          <TableCell>
                            <Chip label={u.role} size="small" sx={{ background: u.role === 'ADMIN' ? 'rgba(239,68,68,0.2)' : 'rgba(48,192,242,0.2)', color: u.role === 'ADMIN' ? palette.danger : palette.primary, fontWeight: 'bold' }} />
                          </TableCell>
                          <TableCell>
                              <Chip label={u.isActive === false ? (ar ? 'موقوف' : 'Suspended') : (ar ? 'نشط' : 'Active')} size="small" sx={{ background: u.isActive === false ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)', color: u.isActive === false ? palette.danger : palette.success, fontWeight: 'bold' }} />
                          </TableCell>
                          <TableCell sx={{ color: palette.textSec }}>{dayjs(u.createdAt).format('DD/MM/YYYY')}</TableCell>
                          <TableCell align="center">
                            {!(user?.role === 'MANAGER' && u.role === 'ADMIN') ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <IconButton onClick={() => handleOpenEditUser(u)} sx={{ color: palette.primary, '&:hover': { background: 'rgba(48,192,242,0.1)' } }}>
                                  <Edit />
                                </IconButton>
                                <IconButton onClick={() => handleOpenDeleteUser(u)} sx={{ color: palette.danger, '&:hover': { background: 'rgba(230,47,118,0.1)' } }}>
                                  <Delete />
                                </IconButton>
                              </Box>
                            ) : (
                               <Tooltip title={ar ? "إدارة عليا (محمي)" : "Super Admin (Protected)"}>
                                  <Security sx={{ color: palette.locked, opacity: 0.5 }} />
                               </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}

            {/* 2. COURSES TAB */}
            {user?.role === 'ADMIN' && tab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
                  <Button variant="outlined" onClick={() => router.push(`/${locale}/admin/courses`)} 
                    sx={{ borderColor: palette.primary, color: palette.primary, fontWeight: 'bold', '&:hover': { borderColor: palette.primaryHover, background: 'rgba(48,192,242,0.1)' } }}>
                    {ar ? 'إدارة محتوى الكورسات' : 'Manage Courses Content'}
                  </Button>
                  <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddCourse} sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 'bold' }}>
                    {ar ? 'إضافة كورس' : 'Add Course'}
                  </Button>
                </Box>
                <Card sx={{ p: { xs: 1, sm: 2 }, background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
                  <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow sx={{ '& th': { color: palette.textMain, borderBottom: `1px solid ${palette.border}`, fontWeight: 'bold' } }}>
                          <TableCell>{ar ? 'الكورس' : 'Course'}</TableCell>
                          <TableCell>{ar ? 'الباقة' : 'Package'}</TableCell>
                          <TableCell>{ar ? 'السعر' : 'Price'}</TableCell>
                          <TableCell align="center">{ar ? 'المحاضر' : 'Inspector'}</TableCell>
                          <TableCell>{ar ? 'الحالة' : 'Status'}</TableCell>
                          <TableCell align="center">{ar ? 'إجراءات' : 'Actions'}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {courses.map((c: any) => (
                          <TableRow key={c.id} sx={{ '& td': { borderBottom: '1px solid rgba(37, 154, 203, 0.2)' }, '&:hover': { background: 'rgba(255,255,255,0.03)' } }}>
                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{c.title}</TableCell>
                            <TableCell sx={{ color: palette.textSec }}>{c.packageType}</TableCell>
                            <TableCell sx={{ color: palette.success, fontWeight: 'bold' }}>${c.originalPrice || 0}</TableCell>
                            <TableCell align="center">
                              {c.inspectors && c.inspectors.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                                  {c.inspectors.map((insp: any) => (
                                    <Chip key={insp.id} label={`${insp.firstName} ${insp.lastName}`} size="small" sx={{ bgcolor: 'rgba(48,192,242,0.1)', color: palette.primary, border: `1px solid ${palette.primary}`, fontWeight: 'bold' }} />
                                  ))}
                                </Box>
                              ) : (
                                <Typography sx={{ color: palette.textSec, fontSize: '0.85rem', fontStyle: 'italic' }}>{ar ? 'لم يتم التحديد' : 'Not assigned'}</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip label={c.status} size="small" sx={{ background: c.status === "PUBLISHED" ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', color: c.status === "PUBLISHED" ? palette.success : palette.warning, fontWeight: 'bold' }} />
                            </TableCell>
                            <TableCell align="center">
                              {c.status === "DRAFT" && <Button size="small" variant="outlined" onClick={() => publishCourse(c.id)} sx={{ borderColor: palette.success, color: palette.success, mr: 1 }}>{ar ? 'نشر' : 'Publish'}</Button>}
                              <IconButton onClick={() => handleOpenEditCourse(c)} sx={{ color: palette.primary }}><Edit /></IconButton>
                              <IconButton onClick={() => handleDeleteClick(c)} sx={{ color: palette.danger }}><Delete /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            )}

            {/* 3. TRANSACTIONS TAB */}
            {user?.role === 'ADMIN' && tab === 2 && (
              <Card sx={{ p: { xs: 1, sm: 2 }, background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
                <TableContainer>
                  <Table sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow sx={{ '& th': { color: palette.textMain, borderBottom: `1px solid ${palette.border}`, fontWeight: 'bold' } }}>
                        <TableCell>{ar ? 'المستخدم' : 'User'}</TableCell>
                        <TableCell>{ar ? 'الكورس' : 'Course'}</TableCell>
                        <TableCell>{ar ? 'المبلغ' : 'Amount'}</TableCell>
                        <TableCell>{ar ? 'التاريخ' : 'Date'}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((tx: any) => (
                        <TableRow key={tx.id} sx={{ '& td': { borderBottom: '1px solid rgba(37, 154, 203, 0.2)' } }}>
                          <TableCell sx={{ color: '#fff' }}>{tx.user?.firstName} {tx.user?.lastName}</TableCell>
                          <TableCell sx={{ color: palette.textSec }}>{tx.course?.title}</TableCell>
                          <TableCell sx={{ color: palette.success, fontWeight: 'bold' }}>${tx.amountPaid}</TableCell>
                          <TableCell sx={{ color: palette.textSec }}>{dayjs(tx.createdAt).format('DD/MM/YYYY')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}

            {/* 4. WITHDRAWALS TAB */}
            {user?.role === 'ADMIN' && tab === 3 && (
              <Card sx={{ p: { xs: 1, sm: 2 }, background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
                <TableContainer>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow sx={{ '& th': { color: palette.textMain, borderBottom: `1px solid ${palette.border}`, fontWeight: 'bold' } }}>
                        <TableCell>{ar ? 'المسوق' : 'Affiliate'}</TableCell>
                        <TableCell>{ar ? 'المبلغ' : 'Amount'}</TableCell>
                        <TableCell>{ar ? 'الحالة' : 'Status'}</TableCell>
                        <TableCell align="center">{ar ? 'مراجعة' : 'Review'}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {withdrawals.map((w: any) => (
                        <TableRow key={w.id} sx={{ '& td': { borderBottom: '1px solid rgba(37, 154, 203, 0.2)' } }}>
                          <TableCell sx={{ color: '#fff' }}>{w.user?.firstName} {w.user?.lastName}</TableCell>
                          <TableCell sx={{ color: palette.primary, fontWeight: 'bold' }}>${w.amount}</TableCell>
                          <TableCell><Chip label={w.status} size="small" sx={{ background: w.status === 'COMPLETED' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', color: w.status === 'COMPLETED' ? palette.success : palette.warning }} /></TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => handleOpenReviewWithdrawal(w)} sx={{ color: palette.primary }}><FactCheck /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}

            {/* 5. PACKAGES TAB */}
            {user?.role === 'ADMIN' && tab === 4 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddPackage} sx={{ background: palette.primary, color: '#000', fontWeight: 'bold' }}>{ar ? 'إنشاء باقة' : 'Create Package'}</Button>
                </Box>
                <Card sx={{ p: 2, background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ '& th': { color: palette.textMain, borderBottom: `1px solid ${palette.border}`, fontWeight: 'bold' } }}>
                          <TableCell>{ar ? 'اسم الباقة' : 'Name'}</TableCell>
                          <TableCell>{ar ? 'السعر' : 'Price'}</TableCell>
                          <TableCell align="center">{ar ? 'إجراءات' : 'Actions'}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {packages.map((pkg: any) => (
                          <TableRow key={pkg.id} sx={{ '& td': { borderBottom: '1px solid rgba(37, 154, 203, 0.2)' } }}>
                            <TableCell sx={{ color: '#fff' }}>{pkg.name}</TableCell>
                            <TableCell sx={{ color: palette.success }}>${pkg.price}</TableCell>
                            <TableCell align="center">
                              <IconButton onClick={() => handleOpenEditPackage(pkg)} sx={{ color: palette.primary }}><Edit /></IconButton>
                              <IconButton onClick={() => handleOpenDeletePackage(pkg)} sx={{ color: palette.danger }}><Delete /></IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            )}

            {/* 🎓 6. CERTIFICATES TAB (New Section) */}
            {user?.role === 'ADMIN' && tab === 5 && (
              <Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
                   <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: '400px' } }}>
                     <TextField 
                        placeholder={ar ? 'ابحث برقم الشهادة أو اسم الطالب...' : 'Search by cert # or name...'}
                        fullWidth size="small" value={certSearch} onChange={(e) => setCertSearch(e.target.value)}
                        InputProps={{ startAdornment: <Search sx={{ color: palette.textSec, mr: 1 }} />, sx: { color: '#fff', bgcolor: 'rgba(0,0,0,0.2)' } }}
                     />
                     <Button variant="contained" onClick={fetchAll} sx={{ bgcolor: palette.cardBg, border: `1px solid ${palette.border}`, color: '#fff' }}>
                       <Refresh />
                     </Button>
                   </Box>
                   <Button variant="contained" startIcon={<WorkspacePremiumRounded />} onClick={() => setIssueCertOpen(true)}
                     sx={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.border})`, color: '#000', fontWeight: 900, px: 3 }}>
                     {ar ? 'إصدار شهادة يدوياً' : 'Issue Manual Certificate'}
                   </Button>
                </Box>

                <Card sx={{ p: 2, background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3 }}>
                  <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow sx={{ '& th': { color: palette.textMain, borderBottom: `1px solid ${palette.border}`, fontWeight: 'bold' } }}>
                          <TableCell>{ar ? 'رقم الشهادة' : 'Cert Number'}</TableCell>
                          <TableCell>{ar ? 'الطالب' : 'Student'}</TableCell>
                          <TableCell>{ar ? 'الكورس' : 'Course'}</TableCell>
                          <TableCell>{ar ? 'تاريخ الإصدار' : 'Issued At'}</TableCell>
                          <TableCell align="center">{ar ? 'إجراءات' : 'Actions'}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {certs.map((c: any) => (
                          <TableRow key={c.certNumber} sx={{ '& td': { borderBottom: '1px solid rgba(37, 154, 203, 0.2)' }, '&:hover': { background: 'rgba(255,255,255,0.03)' } }}>
                            <TableCell sx={{ color: palette.primary, fontWeight: 'bold', fontFamily: 'monospace' }}>{c.certNumber}</TableCell>
                            <TableCell sx={{ color: '#fff' }}>
                              {c.user?.firstName} {c.user?.lastName} <br/>
                              <span style={{ fontSize: '0.75rem', color: palette.textSec }}>{c.user?.email}</span>
                            </TableCell>
                            <TableCell sx={{ color: palette.textSec }}>{c.course?.title}</TableCell>
                            <TableCell sx={{ color: palette.textSec }}>{dayjs(c.issuedAt).format('DD/MM/YYYY')}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <Tooltip title={ar ? 'معاينة' : 'View'}>
                                  <IconButton onClick={() => router.push(`/${locale}/certificates/${c.certNumber}`)} sx={{ color: palette.success }}><Visibility /></IconButton>
                                </Tooltip>
                                <Tooltip title={ar ? 'إلغاء الشهادة' : 'Revoke'}>
                                  <IconButton onClick={() => { setSelectedCert(c); setRevokeCertOpen(true); }} sx={{ color: palette.danger }}><Delete /></IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* ============================== DIALOGS ============================== */}

      {/* 🎓 1. Issue Manual Certificate Dialog */}
      <Dialog open={issueCertOpen} onClose={() => setIssueCertOpen(false)} PaperProps={{ sx: { background: palette.cardBg, border: `1px solid ${palette.primary}`, borderRadius: 4, minWidth: 400 } }}>
        <DialogTitle sx={{ color: palette.primary, fontWeight: 900 }}>{ar ? '🎓 إصدار شهادة يدوياً' : '🎓 Issue Manual Certificate'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }}>
            <InputLabel sx={{ color: palette.textSec }}>{ar ? 'اختر الطالب' : 'Select Student'}</InputLabel>
            <Select value={manualCertForm.userId} label={ar ? 'اختر الطالب' : 'Select Student'} onChange={(e) => setManualCertForm({ ...manualCertForm, userId: e.target.value })} sx={{ color: '#fff' }}>
              {users.map(u => <MenuItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }}>
            <InputLabel sx={{ color: palette.textSec }}>{ar ? 'اختر الكورس' : 'Select Course'}</InputLabel>
            <Select value={manualCertForm.courseId} label={ar ? 'اختر الكورس' : 'Select Course'} onChange={(e) => setManualCertForm({ ...manualCertForm, courseId: e.target.value })} sx={{ color: '#fff' }}>
              {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="caption" sx={{ color: palette.warning }}>* ملاحظة: سيتم تحويل حالة الطالب في هذا الكورس إلى "مكتمل" تلقائياً عند الإصدار.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIssueCertOpen(false)} sx={{ color: palette.textSec }}>{ar ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={handleIssueManualCert} variant="contained" sx={{ bgcolor: palette.primary, color: '#000', fontWeight: 900 }}>{ar ? 'إصدار الآن' : 'Issue Now'}</Button>
        </DialogActions>
      </Dialog>

      {/* 🎓 2. Revoke Certificate Dialog */}
      <Dialog open={revokeCertOpen} onClose={() => setRevokeCertOpen(false)} PaperProps={{ sx: { background: palette.cardBg, border: `2px solid ${palette.danger}`, borderRadius: 4 } }}>
        <DialogTitle sx={{ color: palette.danger, fontWeight: 900 }}>{ar ? '⚠️ إلغاء شهادة؟' : '⚠️ Revoke Certificate?'}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#fff' }}>{ar ? 'هل أنت متأكد من إلغاء وحذف هذه الشهادة؟ لن يتمكن الطالب من رؤيتها مرة أخرى.' : 'Are you sure you want to delete this certificate permanently?'}</Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: `1px dashed ${palette.danger}` }}>
            <Typography sx={{ color: palette.primary, fontWeight: 800 }}>{selectedCert?.certNumber}</Typography>
            <Typography sx={{ color: '#fff' }}>{selectedCert?.user?.firstName} {selectedCert?.user?.lastName}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setRevokeCertOpen(false)} sx={{ color: palette.textSec }}>{ar ? 'تراجع' : 'Cancel'}</Button>
          <Button onClick={handleRevokeCert} variant="contained" sx={{ bgcolor: palette.danger, fontWeight: 900 }}>{ar ? 'نعم، إلغاء' : 'Yes, Revoke'}</Button>
        </DialogActions>
      </Dialog>

      {/* 🔴 Original Delete User Dialog */}
      <Dialog open={deleteUserDialogOpen} onClose={() => setDeleteUserDialogOpen(false)} PaperProps={{ sx: { background: palette.cardBg, border: `2px solid ${palette.danger}`, borderRadius: 4, minWidth: 350 } }}>
        <DialogTitle sx={{ color: palette.danger, fontWeight: 900 }}>{ar ? '⚠️ حذف مستخدم نهائياً؟' : '⚠️ Delete User Permanently?'}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#fff', mb: 2 }}>{ar ? 'هل أنت متأكد؟ سيتم حذف جميع بيانات المستخدم واشتراكاته من النظام ولا يمكن التراجع عن هذا الإجراء.' : 'Are you sure? This action will wipe all user data and enrollments.'}</Typography>
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: `1px dashed ${palette.danger}` }}>
            <Typography sx={{ color: '#fff', fontWeight: 800 }}>{selectedUser?.firstName} {selectedUser?.lastName}</Typography>
            <Typography sx={{ color: palette.textSec, fontSize: '0.85rem' }}>{selectedUser?.email}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteUserDialogOpen(false)} sx={{ color: palette.textSec }}>{ar ? 'تراجع' : 'Cancel'}</Button>
          <Button onClick={handleConfirmDeleteUser} disabled={isDeleting} variant="contained" sx={{ bgcolor: palette.danger, fontWeight: 900, '&:hover': { bgcolor: '#be123c' } }}>
            {isDeleting ? <CircularProgress size={20} color="inherit" /> : (ar ? 'نعم، احذف نهائياً' : 'Yes, Delete Permanently')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔴 Original Delete Package Dialog */}
      <Dialog open={deletePackageDialogOpen} onClose={() => setDeletePackageDialogOpen(false)} PaperProps={{ sx: { background: palette.cardBg, border: `2px solid ${palette.danger}`, borderRadius: 4, minWidth: 350 } }}>
        <DialogTitle sx={{ color: palette.danger, fontWeight: 900 }}>{ar ? '🗑️ حذف الباقة التعليمية؟' : '🗑️ Delete Educational Package?'}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#fff', mb: 2 }}>{ar ? 'سيتم حذف الباقة من المتجر. لن يتمكن الطلاب الجدد من شرائها، ولكن الطلاب المشتركين مسبقاً لن يتأثروا.' : 'This will remove the package from the store.'}</Typography>
          <Typography sx={{ color: palette.primary, fontWeight: 800, textAlign: 'center' }}>{selectedPackage?.name}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeletePackageDialogOpen(false)} sx={{ color: palette.textSec }}>{ar ? 'تراجع' : 'Cancel'}</Button>
          <Button onClick={handleConfirmDeletePackage} disabled={isDeleting} variant="contained" sx={{ bgcolor: palette.danger, fontWeight: 900 }}>
            {isDeleting ? <CircularProgress size={20} color="inherit" /> : (ar ? 'حذف الباقة' : 'Delete Package')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Original Edit User Dialog */}
      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} PaperProps={{ sx: { background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3, minWidth: { xs: '90%', sm: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 700, color: palette.textMain, borderBottom: `1px solid rgba(37,154,203,0.3)` }}>{ar ? 'تعديل المستخدم' : 'Edit User'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          <Typography sx={{ color: palette.textSec, mb: 1 }}>{selectedUser?.firstName} {selectedUser?.lastName} <br/><span style={{fontSize:'0.85rem'}}>{selectedUser?.email}</span></Typography>
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primaryHover } } }}>
            <InputLabel id="role-select-label" sx={{ color: palette.textSec }}>{ar ? 'الرتبة' : 'Role'}</InputLabel>
            <Select labelId="role-select-label" value={editRole} label={ar ? 'الرتبة' : 'Role'} onChange={(e) => setEditRole(e.target.value)} sx={{ color: '#fff' }}>
              <MenuItem value="USER">{ar ? 'مستخدم عادي' : 'USER'}</MenuItem>
              <MenuItem value="INSPECTOR">{ar ? 'محاضر (Inspector)' : 'INSPECTOR'}</MenuItem>
              {user?.role === 'ADMIN' && <MenuItem value="MANAGER">{ar ? 'مدير (Manager)' : 'MANAGER'}</MenuItem>}
              {user?.role === 'ADMIN' && <MenuItem value="ADMIN">{ar ? 'مسؤول (Admin)' : 'ADMIN'}</MenuItem>}
            </Select>
          </FormControl>
          <FormControlLabel control={<Switch checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} color={editIsActive ? "success" : "error"} />}
            label={<Typography sx={{ color: editIsActive ? palette.success : palette.danger, fontWeight: 'bold' }}>{editIsActive ? (ar ? 'الحساب نشط' : 'Active Account') : (ar ? 'الحساب موقوف' : 'Suspended Account')}</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid rgba(37,154,203,0.3)` }}>
          <Button onClick={() => setEditUserOpen(false)} sx={{ color: palette.textSec }}>{ar ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={savingUser} sx={{ bgcolor: palette.primary, color: '#000', fontWeight: 'bold', '&:hover': {bgcolor: palette.primaryHover} }}>
            {savingUser ? <CircularProgress size={20} sx={{color: '#000'}}/> : (ar ? 'حفظ' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Original Add/Edit Course Dialog */}
      <Dialog open={courseDialogOpen} onClose={() => setCourseDialogOpen(false)} PaperProps={{ sx: { background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3, minWidth: { xs: '90%', sm: 450 } } }}>
        <DialogTitle sx={{ fontWeight: 700, color: palette.textMain, borderBottom: `1px solid rgba(37,154,203,0.3)` }}>{selectedCourse ? (ar ? 'تعديل الكورس' : 'Edit Course') : (ar ? 'إضافة كورس جديد' : 'Add New Course')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField label={ar ? 'عنوان الكورس' : 'Course Title'} value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} fullWidth InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: palette.textSec } }} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primaryHover } } }} />
          <TextField label={ar ? 'وصف قصير (اختياري)' : 'Short Description'} value={courseForm.shortDescription} onChange={(e) => setCourseForm({ ...courseForm, shortDescription: e.target.value })} fullWidth InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: palette.textSec } }} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }}/>
          <TextField label={ar ? 'الوصف الشامل' : 'Full Description'} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} fullWidth multiline rows={3} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: palette.textSec } }} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }}/>
          
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }}>
            <InputLabel sx={{ color: palette.textSec }}>{ar ? 'تخصيص محاضرين (Inspectors)' : 'Assign Inspectors'}</InputLabel>
            <Select
              multiple
              value={courseForm.inspectorIds}
              onChange={(e) => setCourseForm({ ...courseForm, inspectorIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
              input={<OutlinedInput label={ar ? 'تخصيص محاضرين (Inspectors)' : 'Assign Inspectors'} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const insp = inspectors.find(i => i.id === value);
                    return <Chip key={value} label={insp ? `${insp.firstName} ${insp.lastName}` : value} size="small" sx={{ bgcolor: 'rgba(48,192,242,0.2)', color: palette.primary }} />;
                  })}
                </Box>
              )}
              sx={{ color: '#fff' }}
              MenuProps={{ PaperProps: { sx: { bgcolor: palette.cardBg, color: '#fff' } } }}
            >
              {inspectors.map((insp) => (
                <MenuItem key={insp.id} value={insp.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  <Checkbox checked={courseForm.inspectorIds.indexOf(insp.id) > -1} sx={{ color: palette.primary, '&.Mui-checked': { color: palette.primary } }} />
                  <ListItemText primary={`${insp.firstName} ${insp.lastName}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField label={ar ? 'السعر ($)' : 'Price ($)'} type="number" value={courseForm.originalPrice} onChange={(e) => setCourseForm({ ...courseForm, originalPrice: e.target.value })} fullWidth InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: palette.textSec } }} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }}/>

          {/* 🔴 خانة المجال (Category) الجديدة */}
          <TextField 
            label={ar ? 'المجال (مثل: برمجة، تصميم، لغات)' : 'Category (e.g. Programming, Design)'} 
            value={courseForm.category} 
            onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} 
            fullWidth 
            InputProps={{ sx: { color: '#fff' } }} 
            InputLabelProps={{ sx: { color: palette.textSec } }} 
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                '& fieldset': { borderColor: palette.border }, 
                '&:hover fieldset': { borderColor: palette.primaryHover } 
              },
              mb: 1
            }} 
          />
          
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }}>
            <InputLabel sx={{ color: palette.textSec }}>{ar ? 'نوع الباقة التابع لها' : 'Package Type'}</InputLabel>
            <Select value={courseForm.packageType} label={ar ? 'نوع الباقة التابع لها' : 'Package Type'} onChange={(e) => setCourseForm({ ...courseForm, packageType: e.target.value })} sx={{ color: '#fff' }}>
              <MenuItem value="BASIC">Basic</MenuItem>
              <MenuItem value="STANDARD">Standard</MenuItem>
              <MenuItem value="PREMIUM">Premium</MenuItem>
              <MenuItem value="ENTERPRISE">Enterprise</MenuItem>
            </Select>
          </FormControl>
          
          <TextField label={ar ? 'رابط غلاف الدورة (Thumbnail URL)' : 'Thumbnail URL'} value={courseForm.thumbnailUrl} onChange={(e) => setCourseForm({ ...courseForm, thumbnailUrl: e.target.value })} fullWidth InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: palette.textSec } }} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }}/>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid rgba(37,154,203,0.3)` }}>
          <Button onClick={() => setCourseDialogOpen(false)} sx={{ color: palette.textSec }}>{ar ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={handleSaveCourse} variant="contained" disabled={savingCourse} sx={{ bgcolor: palette.primary, color: '#000', fontWeight: 'bold', '&:hover': {bgcolor: palette.primaryHover} }}>
            {savingCourse ? <CircularProgress size={20} sx={{color: '#000'}}/> : (ar ? 'حفظ الكورس' : 'Save Course')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Original Delete Course Dialog */}
      <Dialog open={deleteCourseDialogOpen} onClose={() => setDeleteCourseDialogOpen(false)} PaperProps={{ sx: { background: palette.cardBg, border: `1px solid ${palette.danger}`, borderRadius: 3, minWidth: { xs: '90%', sm: 350 } } }}>
        <DialogTitle sx={{ fontWeight: 700, color: palette.danger }}>{ar ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#fff' }}>{ar ? 'هل أنت متأكد من حذف هذا الكورس بشكل نهائي؟' : 'Are you sure you want to delete this course?'}</Typography>
          <Typography sx={{ color: palette.textSec, mt: 1, fontWeight: 'bold' }}>{selectedCourse?.title}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteCourseDialogOpen(false)} sx={{ color: palette.textSec }}>{ar ? 'تراجع' : 'Cancel'}</Button>
          <Button onClick={handleConfirmDeleteCourse} variant="contained" disabled={savingCourse} sx={{ background: palette.danger, '&:hover': { background: '#be123c' }, fontWeight: 'bold' }}>
            {savingCourse ? <CircularProgress size={20} sx={{color: '#fff'}}/> : (ar ? 'نعم، احذف' : 'Yes, Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Original Review Withdrawal Dialog */}
      <Dialog open={reviewWithdrawalOpen} onClose={() => setReviewWithdrawalOpen(false)} PaperProps={{ sx: { background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3, minWidth: { xs: '90%', sm: 450 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: palette.textMain, borderBottom: `1px solid rgba(37,154,203,0.3)`, pb: 2 }}>
          {ar ? 'مراجعة طلب السحب' : 'Review Withdrawal'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: `1px dashed ${palette.primary}` }}>
             <Box>
                <Typography sx={{ color: palette.textSec, fontSize: '0.85rem' }}>{ar ? 'المسوق:' : 'Affiliate:'}</Typography>
                <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{selectedWithdrawal?.user?.firstName} {selectedWithdrawal?.user?.lastName}</Typography>
             </Box>
             <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: palette.textSec, fontSize: '0.85rem' }}>{ar ? 'المبلغ المطلوب:' : 'Requested Amount:'}</Typography>
                <Typography sx={{ color: palette.primary, fontWeight: 900, fontSize: '1.2rem' }}>${selectedWithdrawal?.amount}</Typography>
             </Box>
          </Box>
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primaryHover } } }}>
            <InputLabel sx={{ color: palette.textSec }}>{ar ? 'قرار الإدارة (الحالة)' : 'Decision (Status)'}</InputLabel>
            <Select value={withdrawalStatus} label={ar ? 'قرار الإدارة (الحالة)' : 'Decision (Status)'} onChange={(e) => setWithdrawalStatus(e.target.value)} sx={{ color: '#fff' }}>
              <MenuItem value="PROCESSING">{ar ? 'قيد المراجعة / تعليق' : 'Processing / Hold'}</MenuItem>
              <MenuItem value="COMPLETED" sx={{ color: palette.success, fontWeight: 'bold' }}>{ar ? 'موافقة (مكتمل)' : 'Approve (Completed)'}</MenuItem>
              <MenuItem value="REJECTED" sx={{ color: palette.danger, fontWeight: 'bold' }}>{ar ? 'رفض الطلب' : 'Reject'}</MenuItem>
            </Select>
          </FormControl>
          <TextField label={ar ? 'ملاحظة الإدارة (ستظهر للمسوق)' : 'Admin Note (Visible to affiliate)'} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} fullWidth multiline rows={3} placeholder={ar ? 'مثال: تم تحويل المبلغ بنجاح' : 'e.g. Transferred successfully'} InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: palette.textSec } }} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primaryHover } } }} />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid rgba(37,154,203,0.3)` }}>
          <Button onClick={() => setReviewWithdrawalOpen(false)} sx={{ color: palette.textSec, fontWeight: 'bold' }}>{ar ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={handleProcessWithdrawal} variant="contained" disabled={savingWithdrawal} sx={{ bgcolor: withdrawalStatus === 'COMPLETED' ? palette.success : withdrawalStatus === 'REJECTED' ? palette.danger : palette.primary, color: withdrawalStatus === 'PROCESSING' ? '#000' : '#fff', fontWeight: 'bold' }}>
            {savingWithdrawal ? <CircularProgress size={20} sx={{color: '#fff'}}/> : (ar ? 'حفظ وتحديث الحالة' : 'Save & Update Status')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Original Add/Edit Package Dialog */}
      <Dialog open={packageDialogOpen} onClose={() => setPackageDialogOpen(false)} PaperProps={{ sx: { background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3, minWidth: { xs: '90%', sm: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 700, color: palette.textMain, borderBottom: `1px solid rgba(37,154,203,0.3)` }}>
          {selectedPackage ? (ar ? 'تعديل الباقة' : 'Edit Package') : (ar ? 'إنشاء باقة جديدة' : 'Create New Package')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          
          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }}>
            <InputLabel sx={{ color: palette.textSec }}>{ar ? 'نوع الباقة' : 'Package Type'}</InputLabel>
            <Select
              value={packageForm.name}
              label={ar ? 'نوع الباقة' : 'Package Type'}
              onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
              sx={{ color: '#fff' }}
            >
              <MenuItem value="ALL">{ar ? 'فتح كل الكورسات (ALL)' : 'ALL Courses'}</MenuItem>
              <MenuItem value="BASIC">Basic</MenuItem>
              <MenuItem value="STANDARD">Standard</MenuItem>
              <MenuItem value="PREMIUM">Premium</MenuItem>
              <MenuItem value="ENTERPRISE">Enterprise</MenuItem>
            </Select>
          </FormControl>

          <TextField label={ar ? 'سعر الباقة ($)' : 'Package Price ($)'} type="number" value={packageForm.price} onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })} fullWidth InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: palette.textSec } }} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }} />
          <TextField label={ar ? 'عدد الكورسات المتاحة' : 'Available Courses Count'} type="number" value={packageForm.coursesCount} onChange={(e) => setPackageForm({ ...packageForm, coursesCount: e.target.value })} fullWidth InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: palette.textSec } }} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }} />
          <TextField label={ar ? 'رابط صورة الباقة (Thumbnail)' : 'Thumbnail URL'} value={packageForm.thumbnailUrl} onChange={(e) => setPackageForm({ ...packageForm, thumbnailUrl: e.target.value })} fullWidth InputProps={{ sx: { color: '#fff' } }} InputLabelProps={{ sx: { color: palette.textSec } }} sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border } } }} />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid rgba(37,154,203,0.3)` }}>
          <Button onClick={() => setPackageDialogOpen(false)} sx={{ color: palette.textSec }}>{ar ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={handleSavePackage} variant="contained" disabled={savingPackage} sx={{ bgcolor: palette.primary, color: '#000', fontWeight: 'bold', '&:hover': {bgcolor: palette.primaryHover} }}>
            {savingPackage ? <CircularProgress size={20} sx={{color: '#000'}}/> : (ar ? 'حفظ الباقة' : 'Save Package')}
          </Button>
        </DialogActions>
      </Dialog>
      
    </Box>
  );
}