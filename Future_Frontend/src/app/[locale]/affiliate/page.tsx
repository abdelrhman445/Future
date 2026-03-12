'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Container, Grid, Card, Typography, Button, Chip, Table, TableBody, TableCell, 
  TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, 
  InputAdornment, CircularProgress, MenuItem, Select, FormControl, InputLabel 
} from '@mui/material';
import { ContentCopy, TrendingUp, People, AccountBalanceWallet, PendingActions, ReceiptLong, CoPresent } from '@mui/icons-material';
import Navbar from '@/components/layout/Navbar';
import { affiliateApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

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
  const totalSales = data?.stats?.totalSalesGenerated || 0; // مبيعات المسوق
  const totalReferrals = data?.stats?.totalReferrals || 0;
  const recentEarnings = data?.referrals || [];
  
  // مصفوفة سجل السحوبات (بافتراض أن الباك إند يرسلها في داتا الداشبورد)
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
      
      // تحديث البيانات محلياً لتجنب الـ Reload
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

  // تفاصيل حقول السحب بناءً على الطريقة
  const methodDetails: Record<string, { label: string, placeholder: string }> = {
    vodafone_cash: { label: ar ? 'رقم محفظة فودافون كاش' : 'Vodafone Cash Number', placeholder: '010XXXXXXXX' },
    instapay: { label: ar ? 'عنوان الدفع (يوزر إنستاباي)' : 'InstaPay Address (Username)', placeholder: 'username@instapay' },
    paypal: { label: ar ? 'البريد الإلكتروني لباي بال' : 'PayPal Email', placeholder: 'email@example.com' },
    bank: { label: ar ? 'رقم الحساب / الآيبان (IBAN)' : 'Bank Account / IBAN', placeholder: 'EG000000000000000000000000000' }
  };

  // الألوان المتناسقة مع تصميمك
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
        <Box sx={{ height: 400, borderRadius: 3, bgcolor: palette.cardBg, opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
      </Container>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', background: palette.bg, pb: 10 }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: palette.textMain }}>
          {ar ? '💰 لوحة الإحالة والأرباح' : '💰 Affiliate Dashboard'}
        </Typography>
        <Typography sx={{ color: palette.textSec, mb: 4 }}>
          {ar ? 'تابع مبيعاتك، إحالاتك، واسحب أرباحك' : 'Track your sales, referrals, and withdraw earnings'}
        </Typography>

        {/* 🔗 Referral Link Card */}
        <Box sx={{ background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3, p: 3, mb: 4, boxShadow: `0 4px 20px rgba(8,69,112,0.5)` }}>
          <Typography sx={{ fontWeight: 700, mb: 1.5, color: palette.textMain }}>{ar ? '🔗 رابط الإحالة الخاص بك' : '🔗 Your Referral Link'}</Typography>
          {affiliateCode ? (
            <>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ flexGrow: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${palette.border}`, borderRadius: 2, px: 2, py: 1.5, fontFamily: 'monospace', fontSize: '0.9rem', color: palette.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {affiliateLink}
                </Box>
                <Button onClick={copyLink} variant="contained" startIcon={<ContentCopy sx={{ fontSize: '18px !important' }} />}
                  sx={{ bgcolor: palette.primary, color: '#000', fontWeight: 'bold', whiteSpace: 'nowrap', '&:hover': { bgcolor: palette.primaryHover } }}>
                  {ar ? 'نسخ الرابط' : 'Copy Link'}
                </Button>
              </Box>
              <Typography sx={{ color: palette.textSec, fontSize: '0.85rem', mt: 1.5 }}>
                {ar ? `كود الدعوة الخاص بك: ` : `Your invite code: `} <strong style={{color: palette.primary}}>{affiliateCode}</strong>
              </Typography>
            </>
          ) : (
            <Typography sx={{ color: palette.danger }}>
              {ar ? 'لا يوجد كود إحالة — تواصل مع الإدارة لتفعيل حساب الإحالة' : 'No affiliate code — contact admin to activate'}
            </Typography>
          )}
        </Box>

        {/* 📊 Stats */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[
            { icon: <TrendingUp sx={{ fontSize: 32, color: palette.primary }} />, value: `$${totalSales}`, label: ar ? 'إجمالي المبيعات المحققة' : 'Total Sales Generated', color: palette.primary },
            { icon: <AccountBalanceWallet sx={{ fontSize: 32, color: palette.primaryHover }} />, value: `$${totalEarnings}`, label: ar ? 'إجمالي العمولات' : 'Total Commissions', color: palette.primaryHover },
            { icon: <PendingActions sx={{ fontSize: 32, color: palette.textSec }} />, value: `$${pendingEarnings}`, label: ar ? 'الرصيد القابل للسحب' : 'Available to Withdraw', color: palette.textSec },
            { icon: <People sx={{ fontSize: 32, color: palette.textMain }} />, value: totalReferrals, label: ar ? 'عدد الإحالات' : 'Total Referrals', color: palette.textMain },
          ].map((stat, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ p: 3, background: palette.cardBg, border: `1px solid ${palette.border}`, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', borderColor: stat.color, boxShadow: `0 8px 25px ${stat.color}30` } }}>
                <Box sx={{ mb: 1.5 }}>{stat.icon}</Box>
                <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, color: stat.color }}>{stat.value}</Typography>
                <Typography sx={{ color: palette.textSec, fontSize: '0.9rem', fontWeight: 600 }}>{stat.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 💸 Action Buttons */}
        <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            onClick={() => setWithdrawOpen(true)} 
            variant="contained" 
            size="large"
            disabled={pendingEarnings < 10 || totalSales < 300}
            startIcon={<AccountBalanceWallet />}
            sx={{ 
              bgcolor: palette.primary, color: '#000', fontWeight: 800, px: 4, py: 1.5,
              gap: 2, // 🔴 زيادة المسافة بين الأيقونة والنص
              '&:hover': { bgcolor: palette.primaryHover },
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
            }}
          >
            {ar ? `طلب سحب أرباح ($${pendingEarnings})` : `Request Withdrawal ($${pendingEarnings})`}
          </Button>

          <Button 
            onClick={() => router.push(`/${locale}/presentations/request`)} 
            variant="outlined" 
            size="large"
            startIcon={<CoPresent />}
            sx={{ 
              borderColor: palette.primary, color: palette.primary, fontWeight: 800, px: 4, py: 1.5,
              gap: 2, // 🔴 زيادة المسافة بين الأيقونة والنص
              '&:hover': { borderColor: palette.primaryHover, background: 'rgba(48,192,242,0.05)' }
            }}
          >
            {ar ? 'طلبات العروض التقديمية' : 'Presentation Requests'}
          </Button>

          {(totalSales < 300) && (
            <Typography sx={{ color: palette.danger, fontSize: '0.9rem', fontWeight: 600, background: 'rgba(230, 47, 118, 0.1)', px: 2, py: 1, borderRadius: 2 }}>
              {ar ? '⚠️ يجب أن تصل إجمالي مبيعاتك إلى $300 لتتمكن من السحب' : '⚠️ Total sales must reach $300 to withdraw'}
            </Typography>
          )}
        </Box>

        <Grid container spacing={4}>
          {/* 👥 Recent Referrals Table */}
          <Grid item xs={12} lg={6}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: palette.textMain, display: 'flex', alignItems: 'center', gap: 1 }}>
              <People /> {ar ? 'سجل الإحالات الأخيرة' : 'Recent Referrals'}
            </Typography>
            <Box sx={{ background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3, overflow: 'hidden', maxHeight: 400, overflowY: 'auto' }}>
              {!recentEarnings.length ? (
                <Box sx={{ textAlign: 'center', py: 6, color: palette.textSec }}>
                  <Typography>{ar ? 'لا توجد إحالات بعد.' : 'No referrals yet.'}</Typography>
                </Box>
              ) : (
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { background: 'rgba(0,0,0,0.3)', color: palette.textMain, fontWeight: 700, borderBottom: `1px solid ${palette.border}` } }}>
                      <TableCell>{ar ? 'المستخدم' : 'User'}</TableCell>
                      <TableCell>{ar ? 'العمولة' : 'Commission'}</TableCell>
                      <TableCell>{ar ? 'التاريخ' : 'Date'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEarnings.map((t: any) => (
                      <TableRow key={t.id} sx={{ '& td': { borderBottom: `1px solid rgba(37, 154, 203, 0.2)` }, '&:hover': { background: 'rgba(255,255,255,0.03)' } }}>
                        <TableCell sx={{ color: '#fff' }}>{t.referredUser?.firstName} {t.referredUser?.lastName}</TableCell>
                        <TableCell sx={{ color: palette.primary, fontWeight: 700 }}>${t.commissionAmount}</TableCell>
                        <TableCell sx={{ color: palette.textSec, fontSize: '0.85rem' }}>{dayjs(t.createdAt).format('DD/MM/YYYY')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Grid>

          {/* 🏦 Withdrawal History Table */}
          <Grid item xs={12} lg={6}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: palette.textMain, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptLong /> {ar ? 'سجل طلبات السحب' : 'Withdrawal History'}
            </Typography>
            <Box sx={{ background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 3, overflow: 'hidden', maxHeight: 400, overflowY: 'auto' }}>
              {!withdrawalsHistory.length ? (
                <Box sx={{ textAlign: 'center', py: 6, color: palette.textSec }}>
                  <Typography>{ar ? 'لم تقم بأي طلبات سحب حتى الآن.' : 'No withdrawal requests yet.'}</Typography>
                </Box>
              ) : (
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { background: 'rgba(0,0,0,0.3)', color: palette.textMain, fontWeight: 700, borderBottom: `1px solid ${palette.border}` } }}>
                      <TableCell>{ar ? 'المبلغ' : 'Amount'}</TableCell>
                      <TableCell>{ar ? 'الطريقة' : 'Method'}</TableCell>
                      <TableCell>{ar ? 'الحالة' : 'Status'}</TableCell>
                      <TableCell>{ar ? 'التاريخ' : 'Date'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {withdrawalsHistory.map((w: any) => (
                      <TableRow key={w.id} sx={{ '& td': { borderBottom: `1px solid rgba(37, 154, 203, 0.2)` }, '&:hover': { background: 'rgba(255,255,255,0.03)' } }}>
                        <TableCell sx={{ color: '#fff', fontWeight: 700 }}>${w.amount}</TableCell>
                        <TableCell sx={{ color: palette.textSec, textTransform: 'capitalize' }}>{w.method.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Chip label={statusLabel[w.status] || w.status} size="small"
                            sx={{ background: `${statusColor[w.status]}20`, color: statusColor[w.status], fontWeight: 700, border: `1px solid ${statusColor[w.status]}50` }} />
                        </TableCell>
                        <TableCell sx={{ color: palette.textSec, fontSize: '0.85rem' }}>{dayjs(w.createdAt).format('DD/MM/YYYY')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* 💳 WITHDRAWAL MODAL */}
      <Dialog open={withdrawOpen} onClose={() => !withdrawing && setWithdrawOpen(false)}
        PaperProps={{ sx: { background: palette.cardBg, border: `1px solid ${palette.border}`, borderRadius: 4, minWidth: { xs: '90%', sm: 450 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: palette.textMain, borderBottom: `1px solid rgba(37, 154, 203, 0.3)`, pb: 2 }}>
          {ar ? 'تقديم طلب سحب' : 'Submit Withdrawal Request'}
        </DialogTitle>
        <DialogContent sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: `1px dashed ${palette.primaryHover}` }}>
            <Typography sx={{ color: palette.textSec }}>{ar ? 'الرصيد المتاح:' : 'Available Balance:'}</Typography>
            <Typography sx={{ color: palette.primary, fontWeight: 900, fontSize: '1.1rem' }}>${pendingEarnings}</Typography>
          </Box>

          <TextField 
            label={ar ? 'المبلغ المراد سحبه ($)' : 'Amount to withdraw ($)'} 
            type="number" 
            fullWidth
            value={withdrawAmount} 
            onChange={(e) => setWithdrawAmount(e.target.value)}
            disabled={withdrawing}
            InputProps={{ 
              startAdornment: <InputAdornment position="start" sx={{ '& p': {color: palette.textSec} }}>$</InputAdornment>,
              sx: { color: '#fff' }
            }} 
            InputLabelProps={{ sx: { color: palette.textSec } }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primaryHover } } }}
          />

          <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primaryHover } } }}>
            <InputLabel sx={{ color: palette.textSec }}>{ar ? 'طريقة السحب' : 'Withdrawal Method'}</InputLabel>
            <Select
              value={withdrawMethod}
              label={ar ? 'طريقة السحب' : 'Withdrawal Method'}
              onChange={(e) => {
                setWithdrawMethod(e.target.value);
                setAccountDetails(''); // تفريغ الحقل عند تغيير الطريقة
              }}
              disabled={withdrawing}
              sx={{ color: '#fff' }}
            >
              <MenuItem value="vodafone_cash">{ar ? 'فودافون كاش' : 'Vodafone Cash'}</MenuItem>
              <MenuItem value="instapay">{ar ? 'إنستاباي' : 'InstaPay'}</MenuItem>
              <MenuItem value="paypal">{ar ? 'باي بال' : 'PayPal'}</MenuItem>
              <MenuItem value="bank">{ar ? 'تحويل بنكي' : 'Bank Transfer'}</MenuItem>
            </Select>
          </FormControl>

          <TextField 
            label={methodDetails[withdrawMethod].label} 
            placeholder={methodDetails[withdrawMethod].placeholder}
            fullWidth
            value={accountDetails} 
            onChange={(e) => setAccountDetails(e.target.value)}
            disabled={withdrawing}
            InputProps={{ sx: { color: '#fff' } }} 
            InputLabelProps={{ sx: { color: palette.textSec } }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: palette.border }, '&:hover fieldset': { borderColor: palette.primaryHover } } }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, borderTop: `1px solid rgba(37, 154, 203, 0.3)` }}>
          <Button onClick={() => setWithdrawOpen(false)} disabled={withdrawing} sx={{ color: palette.textSec, fontWeight: 'bold' }}>
            {ar ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleWithdraw} 
            variant="contained" 
            disabled={withdrawing || !withdrawAmount || !accountDetails.trim()}
            sx={{ 
              bgcolor: palette.primary, color: '#000', fontWeight: 800, px: 3,
              '&:hover': { bgcolor: palette.primaryHover },
              '&.Mui-disabled': { bgcolor: 'rgba(48, 192, 242, 0.3)', color: 'rgba(255,255,255,0.5)' }
            }}
          >
            {withdrawing ? <CircularProgress size={24} sx={{ color: '#000' }} /> : (ar ? 'تأكيد السحب' : 'Confirm Withdrawal')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}