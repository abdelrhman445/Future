'use client';
import { ReactNode, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#f97316', dark: '#ea580c', light: '#fb923c' },
    secondary: { main: '#a855f7' },
    background: { default: '#0a0a0f', paper: '#111118' },
    text: { primary: '#ffffff', secondary: '#a1a1aa' },
  },
  typography: { fontFamily: 'Cairo, Sora, sans-serif' },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          '&:hover': { background: 'linear-gradient(135deg, #ea580c, #c2410c)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10, backgroundColor: '#1a1a24',
            '& fieldset': { borderColor: '#2a2a3a' },
            '&:hover fieldset': { borderColor: '#f97316' },
            '&.Mui-focused fieldset': { borderColor: '#f97316' },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundColor: '#111118', borderRadius: 16, border: '1px solid #2a2a3a' },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { backgroundColor: '#1a1a24', borderRadius: 10 },
      },
    },
  },
});

function AuthRehydrator() {
  const rehydrate = useAuthStore((s) => s.rehydrate);
  useEffect(() => { rehydrate(); }, []);
  return null;
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

// ✅ NO <html> or <body> here — they live in the root layout only
export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const isRTL = params.locale === 'ar';
  return (
    <ThemeProvider theme={{ ...theme, direction: isRTL ? 'rtl' : 'ltr' }}>
      <CssBaseline />
      <AuthRehydrator />
      {children}
      <Toaster
        position={isRTL ? 'top-right' : 'top-left'}
        toastOptions={{
          style: {
            background: '#1a1a24', color: '#fff',
            border: '1px solid #2a2a3a', borderRadius: 10,
          },
        }}
      />
    </ThemeProvider>
  );
}
