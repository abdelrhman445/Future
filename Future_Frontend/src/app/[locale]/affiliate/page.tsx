'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Container, Grid, Card, Typography, Button, Chip, Table, TableBody, TableCell, 
  TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
  InputAdornment, CircularProgress, MenuItem, Select, FormControl, InputLabel 
} from '@mui/material';
import { ContentCopy, TrendingUp, People, AccountBalanceWallet, PendingActions, ReceiptLong, CoPresent } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { affiliateApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

// 🔴 إعدادات الأنيميشن الجديدة (بدون Blur وبحركة انسيابية Spring)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
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

export default function AffiliatePage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const ar = locale === 'ar';
  
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // إعدادات نافذة السحب
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('vodafone_cash');
  const [accountDetails, setAccountDetails] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) { 
      router.push(`/${locale}/login`); 
      return; 
    }

    affiliateApi.dashboard()
      .then((res) => {
        setData(res.data.data);
      })
      .catch(() => toast.error(ar ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'))
      .finally(() => setLoading(false));
  }, [isMounted, isAuthenticated, locale, router, ar]);

  const affiliateCode = data?.user?.affiliateCode || data?.affiliate?.affiliateCode;
  const affiliateLink = affiliateCode
    ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/${locale}/register?ref=${affiliateCode}`
    : null;
    
  const totalEarnings = data?.stats?.totalEarnings || data?.user?.totalEarnings || 0;
  const pendingEarnings = data?.affiliate?.pendingEarnings || data?.user?.pendingEarnings || 0;
  
  const totalSales = data?.stats?.totalSalesGenerated || 0; 
  
  const totalReferrals = data?.stats?.totalReferrals || data?.referrals?.length || 0;
  const recentEarnings = data?.referrals || [];
  
  const withdrawalsHistory = data?.withdrawals || []; 

  const copyLink = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      toast.success(ar ? 'تم النسخ بنجاح!' : 'Copied successfully!');
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);

    if (!amount || amount < 10) {
      toast.error(ar ? 'الحد الأدنى للسحب هو 10$' : 'Minimum withdrawal is $10');
      return;
    }

    if (amount > pendingEarnings) {
      toast.error(ar ? 'المبلغ المطلوب أكبر من رصيدك المتاح' : 'Amount exceeds available balance');
      return;
    }

    if (!accountDetails.trim()) {
      toast.error(ar ? 'يرجى إدخال تفاصيل حساب السحب' : 'Please enter account details');
      return;
    }

    setWithdrawing(true);

    try {
      await affiliateApi.requestWithdrawal({
        amount,
        method: withdrawMethod,
        accountDetails: accountDetails.trim()
      });

      toast.success(ar ? 'تم إرسال طلب السحب بنجاح' : 'Withdrawal requested successfully');
      setWithdrawOpen(false);
      setWithdrawAmount('');
      setAccountDetails('');
      
      setData((prev: any) => ({
        ...prev,
        affiliate: { ...prev.affiliate, pendingEarnings: prev.affiliate.pendingEarnings - amount },
        withdrawals: [{ 
          id: Date.now(), amount, method: withdrawMethod, accountDetails, status: 'PENDING', createdAt: new Date() 
        }, ...(prev.withdrawals || [])]
      }));

    } catch (err:any) {
      toast.error(err.response?.data?.message || (ar ? "فشل إرسال الطلب" : "Error requesting withdrawal"));
    } finally {
      setWithdrawing(false);
    }
  };

  const methodDetails: Record<string, { label: string, placeholder: string }> = {
    vodafone_cash: { label: ar ? 'رقم محفظة فودافون كاش' : 'Vodafone Cash Number', placeholder: '010XXXXXXXX' },
    instapay: { label: ar ? 'عنوان الدفع (يوزر إنستاباي)' : 'InstaPay Address (Username)', placeholder: 'username@instapay' },
    paypal: { label: ar ? 'البريد الإلكتروني لباي بال' : 'PayPal Email', placeholder: 'email@example.com' },
    bank: { label: ar ? 'رقم الحساب / الآيبان (IBAN)' : 'Bank Account / IBAN', placeholder: 'EG000000000000000000000000000' }
  };

  const palette = {
    bg: '#0a0a0f',
    cardBg: '#084570',
    border: '#259acb',
    primary: '#30c0f2',
    primaryHover: '#83d9f7',
    textMain: '#a8eff9',
    textSec: '#a0ddf1',
    danger: '#e62f76'
  };

  const statusColor: Record<string, string> = { PENDING: palette.textSec, APPROVED: palette.primary, PAID: palette.primary, COMPLETED: palette.primary, REJECTED: palette.danger };
  const statusLabel: Record<string, string> = {
    PENDING: ar ? 'قيد المراجعة' : 'Pending',
    APPROVED: ar ? 'تمت الموافقة' : 'Approved',
    PAID: ar ? 'تم الدفع' : 'Paid',
    COMPLETED: ar ? 'مكتمل' : 'Completed',
    REJECTED: ar ? 'مرفوض' : 'Rejected',
  };

  if (!isMounted) {
    return <Box sx={{ minHeight: '100vh', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{ color: palette.primary }} /></Box>;
  }

  if (loading) return (
    <Box sx={{ minHeight: '100vh', background: palette.bg }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ height: 400, borderRadius: '50px', bgcolor: palette.cardBg, opacity: 0.3, animation: 'pulse 1.5s infinite' }} />
      </Container>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, pb: 10, position: 'relative', overflow: 'hidden' }}>
      
      {/* 🌌 تأثير الألوان السايحة في الخلفية (Sci-Fi Glow) */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: `radial-gradient(circle, ${palette.cardBg} 0%, transparent 70%)`, filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none', opacity: 0.6 }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: `radial-gradient(circle, ${palette.primary} 0%, transparent 70%)`, filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none', opacity: 0.15 }} />

      <Navbar />
      
      <Container 
        maxWidth="lg" 
        sx={{ py: 5, position: 'relative', zIndex: 1 }}
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <Box component={motion.div} variants={itemVariants} sx={{ mb: 6, textAlign: { xs: 'center', md: ar ? 'right' : 'left' } }}>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, background: `linear-gradient(135deg, #fff, ${palette.textMain})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.5, textShadow: `0 0 40px ${palette.primaryHover}` }}>
            {ar ? 'لوحة الإحالة ' : 'Affiliate Command Center'}
          </Typography>
          <Typography sx={{ color: palette.textSec, fontSize: '1.15rem', fontWeight: 500, opacity: 0.9 }}>
            {ar ? 'تابع مبيعاتك، إحالاتك، واسحب أرباحك ' : 'Track your sales, referrals, and withdraw earnings at lightspeed'}
          </Typography>
        </Box>

        {/* 🔗 Referral Link Card - كبسولة زجاجية */}
        <Box component={motion.div} variants={itemVariants} sx={{ 
          background: `linear-gradient(135deg, rgba(8,69,112,0.4) 0%, rgba(10,10,15,0.7) 100%)`, 
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(37,154,203,0.4)`, 
          borderRadius: '50px',
          p: { xs: 3, md: 4 }, mb: 6, 
          boxShadow: `0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(48,192,242,0.1)`,
          position: 'relative', overflow: 'hidden'
        }}>
          <Typography sx={{ fontWeight: 800, mb: 2, fontSize: '1.2rem', color: palette.textMain, display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
            <TrendingUp sx={{ color: palette.primary, filter: `drop-shadow(0 0 8px ${palette.primary})` }} /> 
            {ar ? 'رابط الإحالة الخاص بك' : 'Your Referral Link'}
          </Typography>
          {affiliateCode ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                <Box sx={{ 
                  flexGrow: 1, width: '100%', background: 'rgba(0,0,0,0.5)', border: `1px solid rgba(37,154,203,0.3)`, 
                  borderRadius: '50px',
                  px: 4, py: 2.5, fontFamily: 'monospace', fontSize: '1.05rem', 
                  color: palette.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                }}>
                  {affiliateLink}
                </Box>
                {/* 🔴 زرار النسخ بسطر واحد ومسافة للأيقونة */}
                <Button onClick={copyLink} variant="contained" startIcon={<ContentCopy sx={{ fontSize: '20px !important' }} />}
                  sx={{ 
                    bgcolor: palette.primary, color: '#000', fontWeight: 900, px: 5, py: 2.5, 
                    borderRadius: '50px',
                    gap: 1, width: { xs: '100%', md: 'auto' },
                    whiteSpace: 'nowrap', // تمنع السطرين
                    boxShadow: `0 0 20px rgba(48,192,242,0.4)`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& .MuiButton-startIcon': { margin: 0 }, // لضبط محاذاة الأيقونة في العربي
                    '&:hover': { bgcolor: palette.primaryHover, transform: 'scale(1.05)', boxShadow: `0 0 30px rgba(48,192,242,0.6)` } 
                  }}>
                  {ar ? 'نسخ الرابط' : 'Copy Link'}
                </Button>
              </Box>
              {/* 🔴 تعديل المسافة بين كلمة كود الدعوة والكود نفسه بـ gap */}
              <Box sx={{ color: palette.textSec, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
                {ar ? `كود الدعوة: ` : `Invite Code: `} 
                <Chip label={affiliateCode} sx={{ background: 'rgba(48,192,242,0.15)', color: palette.primary, fontWeight: 900, fontSize: '1rem', border: `1px solid rgba(48,192,242,0.4)`, borderRadius: '50px', px: 1 }} />
              </Box>
            </Box>
          ) : (
            <Box sx={{ background: 'rgba(230, 47, 118, 0.1)', border: `1px dashed ${palette.danger}`, borderRadius: '50px', p: 3, textAlign: 'center' }}>
              <Typography sx={{ color: palette.danger, fontWeight: 800, fontSize: '1.1rem' }}>
                {ar ? 'لا يوجد كود إحالة — تواصل مع الإدارة لتفعيل حساب الإحالة' : 'No affiliate code — contact admin to activate'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 📊 Stats - كروت زجاجية دائرية */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[
            { icon: <TrendingUp sx={{ fontSize: 38, color: palette.primary }} />, value: `$${totalSales}`, label: ar ? 'المبيعات المحققة' : 'Generated Sales' },
            { icon: <AccountBalanceWallet sx={{ fontSize: 38, color: palette.primary }} />, value: `$${totalEarnings}`, label: ar ? 'إجمالي العمولات' : 'Total Commissions' },
            { icon: <PendingActions sx={{ fontSize: 38, color: palette.textSec }} />, value: `$${pendingEarnings}`, label: ar ? 'الرصيد المتاح' : 'Available Balance' },
            { icon: <People sx={{ fontSize: 38, color: palette.textMain }} />, value: totalReferrals, label: ar ? 'عدد الإحالات' : 'Total Referrals' },
          ].map((stat, i) => (
            <Grid item xs={12} sm={6} md={3} key={i} component={motion.div} variants={itemVariants}>
              <Card sx={{ 
                p: 4, 
                background: `linear-gradient(180deg, rgba(8,69,112,0.2) 0%, rgba(10,10,15,0.5) 100%)`, 
                backdropFilter: 'blur(15px)',
                border: `1px solid rgba(37,154,203,0.3)`, 
                borderRadius: '40px',
                textAlign: 'center',
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                '&:hover': { transform: 'translateY(-12px)', borderColor: palette.primary, boxShadow: `0 15px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(48,192,242,0.15)` } 
              }}>
                <Box sx={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '50%', background: palette.primary, opacity: 0.1, filter: 'blur(40px)', borderRadius: '50%' }} />
                
                <Box sx={{ mb: 2.5, display: 'inline-flex', p: 2, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(37,154,203,0.3)`, boxShadow: `0 0 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(48,192,242,0.1)` }}>
                  {stat.icon}
                </Box>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: palette.textMain, mb: 0.5, letterSpacing: -1, textShadow: `0 0 20px rgba(168,239,249,0.4)` }}>{stat.value}</Typography>
                <Typography sx={{ color: palette.textSec, fontSize: '1rem', fontWeight: 600 }}>{stat.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 💸 Action Buttons */}
        <Box component={motion.div} variants={itemVariants} sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button 
            onClick={() => setWithdrawOpen(true)} 
            variant="contained" 
            size="large"
            disabled={pendingEarnings < 10 || totalSales < 300}
            startIcon={<AccountBalanceWallet sx={{ fontSize: '24px !important' }} />}
            sx={{ 
              bgcolor: palette.primary, color: '#000', fontWeight: 900, px: 5, py: 2, 
              borderRadius: '50px',
              gap: 1.5, fontSize: '1.05rem',
              boxShadow: `0 0 20px rgba(48,192,242,0.4)`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '& .MuiButton-startIcon': { margin: 0 },
              '&:hover': { bgcolor: palette.primaryHover, transform: 'scale(1.05)', boxShadow: `0 0 35px rgba(48,192,242,0.6)` },
              '&.Mui-disabled': { bgcolor: 'rgba(8,69,112,0.4)', color: 'rgba(255,255,255,0.2)', boxShadow: 'none' }
            }}
          >
            {ar ? `سحب الأرباح ($${pendingEarnings})` : `Withdraw ($${pendingEarnings})`}
          </Button>

          <Button 
            onClick={() => router.push(`/${locale}/presentations/request`)} 
            variant="outlined" 
            size="large"
            startIcon={<CoPresent sx={{ fontSize: '24px !important' }} />}
            sx={{ 
              borderColor: palette.border, color: palette.textMain, fontWeight: 800, px: 5, py: 2, 
              borderRadius: '50px',
              gap: 1.5, fontSize: '1.05rem', background: 'rgba(8,69,112,0.2)', backdropFilter: 'blur(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '& .MuiButton-startIcon': { margin: 0 },
              '&:hover': { borderColor: palette.primary, color: palette.primary, transform: 'scale(1.05)', background: 'rgba(48,192,242,0.1)', boxShadow: `0 0 25px rgba(48,192,242,0.2)` }
            }}
          >
            {ar ? 'طلبات العروض' : 'Presentations'}
          </Button>

          {(totalSales < 300) && (
            <Chip 
              label={ar ? '⚠️ يجب أن تصل المبيعات لـ $300 للسحب' : '⚠️ Sales must reach $300 to withdraw'}
              sx={{ color: palette.danger, fontSize: '1rem', fontWeight: 800, background: 'rgba(230,47,118,0.1)', border: `1px dashed ${palette.danger}`, px: 2, py: 2.5, borderRadius: '50px' }}
            />
          )}
        </Box>

        {/* 📋 الجداول */}
        <Grid container spacing={4}>
          <Grid item xs={12} lg={6} component={motion.div} variants={itemVariants}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: palette.textMain, display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
              <People sx={{ color: palette.primary, filter: `drop-shadow(0 0 5px ${palette.primary})` }} /> {ar ? 'الإحالات الأخيرة' : 'Recent Referrals'}
            </Typography>
            <Box sx={{ background: `linear-gradient(135deg, rgba(8,69,112,0.2) 0%, rgba(10,10,15,0.6) 100%)`, backdropFilter: 'blur(20px)', border: `1px solid rgba(37,154,203,0.3)`, borderRadius: '40px', overflow: 'hidden', maxHeight: 450, overflowY: 'auto', boxShadow: `0 15px 40px rgba(0,0,0,0.5)` }}>
              {!recentEarnings.length ? (
                <Box sx={{ textAlign: 'center', py: 8, color: palette.textSec }}>
                  <People sx={{ fontSize: 70, opacity: 0.1, mb: 2 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>{ar ? 'لا توجد إحالات بعد.' : 'No referrals yet.'}</Typography>
                </Box>
              ) : (
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(10px)', color: palette.textSec, fontWeight: 900, fontSize: '1rem', borderBottom: `1px solid rgba(37,154,203,0.2)`, py: 2.5 } }}>
                      <TableCell sx={{ pl: 4 }}>{ar ? 'المستخدم' : 'User'}</TableCell>
                      <TableCell>{ar ? 'العمولة' : 'Commission'}</TableCell>
                      <TableCell sx={{ pr: 4 }}>{ar ? 'التاريخ' : 'Date'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEarnings.map((t: any) => (
                      <TableRow key={t.id} sx={{ transition: 'all 0.2s', '& td': { borderBottom: `1px solid rgba(255,255,255,0.02)`, py: 2 }, '&:hover': { background: 'rgba(48,192,242,0.05)' } }}>
                        <TableCell sx={{ color: palette.textMain, fontWeight: 700, pl: 4 }}>{t.referredUser?.firstName} {t.referredUser?.lastName}</TableCell>
                        <TableCell sx={{ color: palette.primary, fontWeight: 900, fontSize: '1.1rem' }}>+${t.commissionAmount}</TableCell>
                        <TableCell sx={{ color: palette.textSec, fontSize: '0.9rem', pr: 4 }}>{dayjs(t.createdAt).format('DD/MM/YYYY')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} lg={6} component={motion.div} variants={itemVariants}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: palette.textMain, display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
              <ReceiptLong sx={{ color: palette.primary, filter: `drop-shadow(0 0 5px ${palette.primary})` }} /> {ar ? 'سجل السحوبات' : 'Withdrawal History'}
            </Typography>
            <Box sx={{ background: `linear-gradient(135deg, rgba(8,69,112,0.2) 0%, rgba(10,10,15,0.6) 100%)`, backdropFilter: 'blur(20px)', border: `1px solid rgba(37,154,203,0.3)`, borderRadius: '40px', overflow: 'hidden', maxHeight: 450, overflowY: 'auto', boxShadow: `0 15px 40px rgba(0,0,0,0.5)` }}>
              {!withdrawalsHistory.length ? (
                <Box sx={{ textAlign: 'center', py: 8, color: palette.textSec }}>
                  <ReceiptLong sx={{ fontSize: 70, opacity: 0.1, mb: 2 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>{ar ? 'لم تقم بأي طلبات سحب حتى الآن.' : 'No withdrawal requests yet.'}</Typography>
                </Box>
              ) : (
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(10px)', color: palette.textSec, fontWeight: 900, fontSize: '1rem', borderBottom: `1px solid rgba(37,154,203,0.2)`, py: 2.5 } }}>
                      <TableCell sx={{ pl: 4 }}>{ar ? 'المبلغ' : 'Amount'}</TableCell>
                      <TableCell>{ar ? 'الطريقة' : 'Method'}</TableCell>
                      <TableCell>{ar ? 'الحالة' : 'Status'}</TableCell>
                      <TableCell sx={{ pr: 4 }}>{ar ? 'التاريخ' : 'Date'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {withdrawalsHistory.map((w: any) => (
                      <TableRow key={w.id} sx={{ transition: 'all 0.2s', '& td': { borderBottom: `1px solid rgba(255,255,255,0.02)`, py: 2 }, '&:hover': { background: 'rgba(48,192,242,0.05)' } }}>
                        <TableCell sx={{ color: palette.textMain, fontWeight: 900, fontSize: '1.1rem', pl: 4 }}>${w.amount}</TableCell>
                        <TableCell sx={{ color: palette.textSec, textTransform: 'capitalize', fontSize: '0.95rem', fontWeight: 600 }}>{w.method.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Chip label={statusLabel[w.status] || w.status} size="small"
                            sx={{ background: 'rgba(0,0,0,0.5)', color: statusColor[w.status], fontWeight: 900, border: `1px solid ${statusColor[w.status]}`, borderRadius: '50px', px: 1 }} />
                        </TableCell>
                        <TableCell sx={{ color: palette.textSec, fontSize: '0.9rem', pr: 4 }}>{dayjs(w.createdAt).format('DD/MM/YYYY')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* 💳 WITHDRAWAL MODAL - سفينة فضاء */}
      <Dialog open={withdrawOpen} onClose={() => !withdrawing && setWithdrawOpen(false)}
        PaperProps={{ 
          sx: { 
            background: `linear-gradient(135deg, rgba(8,69,112,0.9) 0%, rgba(10,10,15,0.98) 100%)`, 
            backdropFilter: 'blur(30px)',
            border: `1px solid rgba(48,192,242,0.4)`, 
            borderRadius: '40px',
            minWidth: { xs: '90%', sm: 480 },
            boxShadow: '0 30px 60px rgba(0,0,0,0.9), inset 0 0 20px rgba(48,192,242,0.1)'
          } 
        }}>
        <DialogTitle sx={{ fontWeight: 900, color: palette.textMain, borderBottom: `1px solid rgba(37,154,203,0.3)`, pb: 3, pt: 4, textAlign: 'center', fontSize: '1.5rem', letterSpacing: -0.5 }}>
          {ar ? 'تقديم طلب سحب أرباح' : 'Submit Withdrawal Request'}
        </DialogTitle>
        <DialogContent sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3.5, px: { xs: 3, sm: 5 } }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, background: 'rgba(0,0,0,0.3)', borderRadius: '30px', border: `1px dashed rgba(48,192,242,0.5)`, boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)' }}>
            <Typography sx={{ color: palette.textSec, fontWeight: 700, fontSize: '1.1rem' }}>{ar ? 'رصيدك المتاح:' : 'Available Balance:'}</Typography>
            <Typography sx={{ color: palette.primary, fontWeight: 900, fontSize: '1.6rem', textShadow: `0 0 10px rgba(48,192,242,0.5)` }}>${pendingEarnings}</Typography>
          </Box>

          <TextField 
            label={ar ? 'المبلغ المراد سحبه ($)' : 'Amount to withdraw ($)'} 
            type="number" 
            fullWidth
            value={withdrawAmount} 
            onChange={(e) => setWithdrawAmount(e.target.value)}
            disabled={withdrawing}
            InputProps={{ 
              startAdornment: <InputAdornment position="start" sx={{ '& p': {color: palette.textSec, fontWeight: 900, fontSize: '1.3rem'} }}>$</InputAdornment>,
              sx: { color: palette.textMain, fontWeight: 800, fontSize: '1.2rem', borderRadius: '50px', background: 'rgba(0,0,0,0.3)' }
            }} 
            InputLabelProps={{ sx: { color: palette.textSec, fontWeight: 700 } }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primaryHover }, '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2 } } }}
          />

          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '50px', background: 'rgba(0,0,0,0.3)', '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primaryHover }, '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2 } } }}>
            <InputLabel sx={{ color: palette.textSec, fontWeight: 700 }}>{ar ? 'طريقة السحب' : 'Withdrawal Method'}</InputLabel>
            <Select
              value={withdrawMethod}
              label={ar ? 'طريقة السحب' : 'Withdrawal Method'}
              onChange={(e) => {
                setWithdrawMethod(e.target.value);
                setAccountDetails('');
              }}
              disabled={withdrawing}
              sx={{ color: palette.textMain, fontWeight: 800, fontSize: '1.1rem' }}
              MenuProps={{ PaperProps: { sx: { bgcolor: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: '30px', mt: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.8)' } } }}
            >
              <MenuItem value="vodafone_cash" sx={{ fontWeight: 700, py: 1.5, '&:hover': { bgcolor: 'rgba(48,192,242,0.1)' } }}>{ar ? 'فودافون كاش' : 'Vodafone Cash'}</MenuItem>
              <MenuItem value="instapay" sx={{ fontWeight: 700, py: 1.5, '&:hover': { bgcolor: 'rgba(48,192,242,0.1)' } }}>{ar ? 'إنستاباي' : 'InstaPay'}</MenuItem>
              <MenuItem value="paypal" sx={{ fontWeight: 700, py: 1.5, '&:hover': { bgcolor: 'rgba(48,192,242,0.1)' } }}>{ar ? 'باي بال' : 'PayPal'}</MenuItem>
              <MenuItem value="bank" sx={{ fontWeight: 700, py: 1.5, '&:hover': { bgcolor: 'rgba(48,192,242,0.1)' } }}>{ar ? 'تحويل بنكي' : 'Bank Transfer'}</MenuItem>
            </Select>
          </FormControl>

          <TextField 
            label={methodDetails[withdrawMethod].label} 
            placeholder={methodDetails[withdrawMethod].placeholder}
            fullWidth
            value={accountDetails} 
            onChange={(e) => setAccountDetails(e.target.value)}
            disabled={withdrawing}
            InputProps={{ sx: { color: palette.textMain, fontWeight: 800, fontSize: '1.1rem', borderRadius: '50px', background: 'rgba(0,0,0,0.3)' } }} 
            InputLabelProps={{ sx: { color: palette.textSec, fontWeight: 700 } }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primaryHover }, '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2 } } }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 4, pt: 3, borderTop: `1px solid rgba(37,154,203,0.3)`, justifyContent: 'center', gap: 3 }}>
          <Button onClick={() => setWithdrawOpen(false)} disabled={withdrawing} sx={{ color: palette.textSec, fontWeight: 900, px: 4, py: 1.8, borderRadius: '50px', fontSize: '1.05rem', border: `1px solid transparent`, '&:hover': { background: 'rgba(0,0,0,0.3)', borderColor: palette.border } }}>
            {ar ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleWithdraw} 
            variant="contained" 
            disabled={withdrawing || !withdrawAmount || !accountDetails.trim()}
            sx={{ 
              bgcolor: palette.primary, color: '#000', fontWeight: 900, px: 6, py: 1.8, borderRadius: '50px', fontSize: '1.05rem',
              boxShadow: `0 0 20px rgba(48,192,242,0.4)`,
              '&:hover': { bgcolor: palette.primaryHover, transform: 'scale(1.05)', boxShadow: `0 0 30px rgba(48,192,242,0.6)` },
              '&.Mui-disabled': { bgcolor: 'rgba(8,69,112,0.5)', color: 'rgba(255,255,255,0.3)', boxShadow: 'none' }
            }}
          >
            {withdrawing ? <CircularProgress size={26} sx={{ color: '#000' }} /> : (ar ? 'تأكيد السحب' : 'Confirm Withdrawal')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}