'use client';
// ══════════════════════════════════════════════════════════
// الملف: src/app/[locale]/certificates/[certNumber]/page.tsx
// صفحة عرض الشهادة + تحميل PDF (بنسخة احترافية تدعم الطباعة المثالية)
// ══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import { Download, Print, CheckCircle, Cancel, WorkspacePremiumRounded } from '@mui/icons-material';
import { certificatesApi } from '@/lib/api';

// ================= THEME PALETTE =================
const palette = {
  bg: '#0a0a0f',
  cardBg: '#084570',
  border: '#259acb',
  primary: '#30c0f2',
  primaryHover: '#83d9f7',
  textMain: '#0a0a0f', // للنصوص الداكنة داخل الشهادة
  textSec: '#4a5568',  // للنصوص الثانوية داخل الشهادة
};

interface CertData {
  certNumber:  string;
  studentName: string;
  courseTitle: string;
  duration?:   number;
  issuedAt:    string;
  isValid:     boolean;
  inspectorName?: string; // حقل اسم المفتش/المدرب (إن وجد)
}

// ── helper: تنسيق التاريخ حسب اللغة ──
function formatCertDate(iso: string, isAr: boolean): string {
  return new Date(iso).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

export default function CertificatePage() {
  const { certNumber, locale } = useParams() as { certNumber: string; locale: string };
  const ar = locale === 'ar';

  const [cert, setCert]     = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    certificatesApi.verifyCertificate(certNumber)
      .then(r => setCert(r.data.data))
      .catch(() => setError(ar ? 'الشهادة غير موجودة أو الرقم غير صحيح' : 'Certificate not found or invalid ID'))
      .finally(() => setLoading(false));
  }, [certNumber, ar]);

  const handlePrint = () => window.print();
  const handleDownloadPDF = () => window.print();

  // ================= قاموس التراجم =================
  const t = {
    titleMain: ar ? 'شـهـادة إتـمـام' : 'CERTIFICATE OF COMPLETION',
    titleSub: ar ? 'CERTIFICATE OF COMPLETION' : 'شـهـادة إتـمـام',
    presentedTo: ar ? 'تُمنح هذه الشهادة بكل فخر إلى' : 'This certificate is proudly presented to',
    recognitionOf: ar ? 'تقديراً لإتمامه بنجاح وتفوق كورس' : 'In recognition of successfully completing the course',
    description: ar 
      ? 'وذلك بعد اجتياز جميع متطلبات الكورس والتفاعل مع كامل محتواه التعليمي بجهد ومثابرة تستحق التقدير والثناء من إدارة الأكاديمية.' 
      : 'Having fulfilled all course requirements and actively engaged with the educational content with commendable dedication and excellence.',
    dateLabel: ar ? 'تاريخ الإصدار' : 'Date of Issue',
    certIdLabel: ar ? 'رقم الشهادة: ' : 'Certificate ID: ',
    printBtn: ar ? 'طباعة' : 'Print',
    downloadBtn: ar ? 'تحميل PDF' : 'Download PDF',
  };

  if (loading) return (
    <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background: palette.bg }}>
      <CircularProgress sx={{ color: palette.primary }} />
    </Box>
  );

  if (error) return (
    <Box sx={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minHeight:'100vh', background: palette.bg, gap: 2.5, p: 3 }}>
      <Cancel sx={{ fontSize: 72, color: '#e62f76' }} />
      <Typography sx={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>{error}</Typography>
    </Box>
  );

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 landscape; 
            margin: 0px !important; /* إزالة الهوامش لمحاولة إخفاء الروابط */
          }
          * {
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          body, html {
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #f4f9fc !important;
          }
          .no-print { 
            display: none !important; 
          }
          .cert-page { 
            background: transparent !important; 
            padding: 0 !important; 
            display: flex !important;
            width: 100vw !important;
            height: 100vh !important;
            align-items: center;
            justify-content: center;
          }
          .cert-container {
            width: 100vw !important; 
            height: 100vh !important; 
            box-shadow: none !important; 
            border-radius: 0 !important;
            aspect-ratio: auto !important;
            margin: 0 !important;
            position: relative !important;
            max-width: none !important;
          }
          /* 🔴 تكبير ورفع الشعار في وضع الطباعة فقط */
          .cert-seal {
            width: 140px !important;
            height: 140px !important;
            transform: translateY(-25px) !important;
          }
          .seal-icon {
            font-size: 64px !important;
          }
          .seal-text {
            font-size: 0.75rem !important;
          }
        }
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800;900&family=Playfair+Display:wght@600;800&display=swap');
      `}</style>

      <Box className="cert-page" sx={{
        minHeight: '100vh', background: palette.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: { xs: '30px 15px', md: '50px 20px' },
        fontFamily: 'Cairo, sans-serif'
      }}>

        {/* ── Buttons (No-Print Area) ── */}
        <Box className="no-print" sx={{ display:'flex', gap: 3, mb: 4, flexWrap:'wrap', justifyContent:'center' }} dir={ar ? 'rtl' : 'ltr'}>
          <Button
            onClick={handlePrint}
            variant="outlined"
            sx={{ 
              borderColor: palette.primary, color: palette.primary, fontFamily: 'Cairo', fontWeight: 800, fontSize: '1.05rem', px: 4, py: 1.2, borderRadius: 2,
              display: 'flex', alignItems: 'center', gap: 1.5, 
              '&:hover':{ background: 'rgba(48,192,242,0.1)', borderColor: palette.primaryHover } 
            }}
          >
            <Print sx={{ fontSize: 22 }} />
            {t.printBtn}
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="contained"
            sx={{ 
              background: palette.primary, color: '#000', fontFamily: 'Cairo', fontWeight: 800, fontSize: '1.05rem', px: 4, py: 1.2, borderRadius: 2,
              boxShadow: `0 8px 25px rgba(48,192,242,0.3)`, display: 'flex', alignItems: 'center', gap: 1.5,
              '&:hover':{ background: palette.primaryHover } 
            }}
          >
            <Download sx={{ fontSize: 22 }} />
            {t.downloadBtn}
          </Button>
        </Box>
        {/* ══════════════════════════════════════════════════════
            CERTIFICATE DESIGN
        ══════════════════════════════════════════════════════ */}
        <Box className="cert-container" ref={certRef} dir={ar ? 'rtl' : 'ltr'} sx={{
          width: '100%', maxWidth: 1000, aspectRatio: { xs: 'auto', md: '1.414 / 1' },
          background: '#f4f9fc', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          padding: { xs: '40px 20px', md: '50px 60px' },
          boxShadow: '0 30px 80px rgba(0,0,0,.6)',
        }}>

          {/* Background Elements */}
          {[
            { top:16, right:16, borderBottom:'none', borderLeft: ar ? 'none' : `3px solid ${palette.border}`, borderRight: ar ? `3px solid ${palette.border}` : 'none', borderRadius: ar ? '0 12px 0 0' : '12px 0 0 0' },
            { top:16, left:16,  borderBottom:'none', borderRight: ar ? 'none' : `3px solid ${palette.border}`, borderLeft: ar ? `3px solid ${palette.border}` : 'none', borderRadius: ar ? '12px 0 0 0' : '0 12px 0 0' },
            { bottom:16, right:16, borderTop:'none', borderLeft: ar ? 'none' : `3px solid ${palette.border}`, borderRight: ar ? `3px solid ${palette.border}` : 'none',  borderRadius: ar ? '0 0 0 12px' : '0 0 12px 0' },
            { bottom:16, left:16,  borderTop:'none', borderRight: ar ? 'none' : `3px solid ${palette.border}`, borderLeft: ar ? `3px solid ${palette.border}` : 'none', borderRadius: ar ? '0 0 12px 0' : '0 0 0 12px' },
          ].map((style, i) => (
            <Box key={i} sx={{ position:'absolute', width:{xs:60,md:100}, height:{xs:60,md:100}, borderTop: `3px solid ${palette.border}`, borderBottom: `3px solid ${palette.border}`, ...style }} />
          ))}
          {[{ top:38 }, { bottom:38 }].map((pos, i) => (
            <Box key={i} sx={{ position:'absolute', left:{xs:40,md:70}, right:{xs:40,md:70}, height: 1.5, background: `linear-gradient(90deg, transparent, ${palette.primary} 30%, ${palette.primary} 70%, transparent)`, ...pos }} />
          ))}
          <Box sx={{ position:'absolute', inset:0, pointerEvents:'none', background:`radial-gradient(circle at 50% 50%, rgba(48,192,242,.03) 0%, transparent 70%)` }} />

          {/* 1. Header: Logo */}
          <Box sx={{ flex: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 2 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
              <Box component="img" src="/logo.png" alt="Logo" sx={{ width: {xs: 35, md: 45}, height: {xs: 35, md: 45}, objectFit: 'contain' }} />
              <Typography sx={{ fontFamily:'Cairo', fontWeight:900, fontSize:{xs:'1.1rem',md:'1.3rem'}, color: palette.cardBg, letterSpacing:'.08em' }}>
                FUTURE ACADEMY
              </Typography>
            </Box>
          </Box>

          {/* 2. Body: Certificate Content */}
          <Box sx={{ flex: 3, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', zIndex:2, width:'100%', my: {xs: 3, md: 0} }}>
            
            <Typography sx={{ fontFamily:'serif', fontSize:{xs:'.9rem',md:'1.2rem'}, color: palette.border, letterSpacing:'.1em', mb: 1, textTransform: 'uppercase' }}>
              {t.titleMain}
            </Typography>

            <Typography sx={{ fontFamily:'serif', fontSize:{xs:'1.4rem',md:'2.4rem'}, fontWeight:900, color: palette.cardBg, lineHeight:1.2, mb: 1.5, textTransform: 'uppercase' }}>
              {t.titleSub}
            </Typography>

            <Box sx={{ width: 150, height: 3, background: `linear-gradient(90deg,transparent,${palette.primary},transparent)`, mb: 3 }} />

            <Typography sx={{ fontSize:{xs:'.85rem',md:'1.1rem'}, color: palette.textSec, mb: 1.5 }}>
              {t.presentedTo}
            </Typography>

            <Typography sx={{ fontFamily:'"Playfair Display", serif', fontSize:{xs:'1.8rem',md:'3rem'}, fontWeight:800, color: palette.textMain, mb: 1, letterSpacing:'.02em' }}>
              {cert?.studentName}
            </Typography>

            <Box sx={{ display:'flex', gap: 1, mb: 2 }}>
              {[...Array(5)].map((_,i) => <Typography key={i} sx={{ color: palette.primary, fontSize:{xs:'1rem',md:'1.4rem'} }}>★</Typography>)}
            </Box>

            <Typography sx={{ fontSize:{xs:'.85rem',md:'1.1rem'}, color: palette.textSec, mb: 1 }}>
              {t.recognitionOf}
            </Typography>

            <Typography sx={{ fontFamily:'Cairo', fontWeight:800, fontSize:{xs:'1.2rem',md:'1.8rem'}, color: palette.cardBg, mb: 2, maxWidth:'85%', lineHeight:1.5 }}>
              {cert?.courseTitle}
            </Typography>

            <Typography sx={{ fontSize:{xs:'.75rem',md:'.95rem'}, color: palette.textSec, maxWidth:'75%', lineHeight:1.8 }}>
              {t.description}
            </Typography>

          </Box>

          {/* 3. Footer: Signatures & Seal */}
          <Box sx={{ flex: 1, display:'flex', justifyContent:'space-between', alignItems:'flex-end', zIndex: 2, width: '100%', px: {xs: 0, md: 4} }}>
            
            {/* Signature Block */}
            <Box sx={{ textAlign:'center', flex: 1 }}>
              <Box sx={{ height: {xs: '1.8rem', md: '2.4rem'}, mb: 1 }} /> 
              <Box sx={{ width:{xs:80,md:130}, height: 1.5, background: palette.border, mb: 1, mx: 'auto' }} /> 
              <Typography sx={{ fontSize:{xs:'.65rem',md:'.85rem'}, color: palette.textSec, letterSpacing:'.05em', mb: 0.5, fontFamily:'sans-serif' }}>Signature</Typography>
              <Typography sx={{ fontSize:{xs:'.7rem',md:'.95rem'}, color: palette.cardBg, fontWeight:800 }}>
                {cert?.inspectorName ? cert.inspectorName : 'Abdelwahap Tamer'}
              </Typography>
            </Box>

            {/* Premium Seal */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', transform: 'translateY(-5px)', zIndex: 3 }}>
              <Box className="cert-seal" sx={{
                width:{xs:70,md:100}, height:{xs:70,md:100}, borderRadius:'50%', border:`3px solid ${palette.primary}`,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                background:`radial-gradient(circle, #ffffff, #e0f2fe)`, boxShadow:`0 0 0 3px ${palette.border}, inset 0 0 15px rgba(48,192,242,.3)`
              }}>
                <WorkspacePremiumRounded className="seal-icon" sx={{ fontSize:{xs:32,md:46}, color: palette.cardBg, mb: 0.5 }} />
                <Typography className="seal-text" sx={{ fontSize:{xs:'.4rem',md:'.55rem'}, color: palette.cardBg, fontWeight:900, letterSpacing:'.05em' }}>
                  CERTIFIED
                </Typography>
              </Box>
            </Box>

            {/* Date */}
            <Box sx={{ textAlign:'center', flex: 1 }}>
              <Box sx={{ width:{xs:80,md:130}, height: 1.5, background: palette.border, mb: 1, mx: 'auto' }} />
              <Typography sx={{ fontSize:{xs:'.65rem',md:'.85rem'}, color: palette.textSec, letterSpacing:'.05em', mb: 0.5 }}>{t.dateLabel}</Typography>
              <Typography sx={{ fontSize:{xs:'.7rem',md:'.95rem'}, color: palette.cardBg, fontWeight:800 }}>
                {cert?.issuedAt ? formatCertDate(cert.issuedAt, ar) : '—'}
              </Typography>
            </Box>

          </Box>

          {/* Cert ID */}
          <Typography sx={{ position:'absolute', bottom:{xs:18,md:22}, left:'50%', transform:'translateX(-50%)', fontSize:{xs:'.6rem',md:'.75rem'}, color: palette.border, letterSpacing:'.05em', fontWeight: 700, zIndex: 2 }}>
            {t.certIdLabel} <span style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>{cert?.certNumber}</span>
          </Typography>

        </Box>

      </Box>
    </>
  );
}