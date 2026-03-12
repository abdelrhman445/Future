'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const rehydrate = useAuthStore((state) => state.rehydrate);

  useEffect(() => {
    // الدالة دي هتشتغل مرة واحدة أول ما الموقع يفتح أو تعمل Refresh
    // هتقارن الكوكي بالـ LocalStorage وتأكد تسجيل الدخول
    rehydrate();
  }, [rehydrate]);

  return <>{children}</>;
}