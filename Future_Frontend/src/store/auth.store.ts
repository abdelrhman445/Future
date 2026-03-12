import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  rehydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        // ضفنا path: '/' عشان الكوكي تتشاف في كل صفحات الموقع بدون استثناء
        Cookies.set('accessToken', token, { 
          expires: 7, 
          sameSite: 'lax',
          path: '/' 
        });
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        // لازم نحدد الـ path وإحنا بنمسح كمان عشان يتمسح صح
        Cookies.remove('accessToken', { path: '/' });
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      // الدالة دي مهمة تتنادى في الـ layout عشان تتأكد إن الداتا سليمة
      rehydrate: () => {
        const cookieToken = Cookies.get('accessToken');
        const storeToken = get().token;
        
        if (!cookieToken) {
          // لو الكوكي اتمسحت (أو انتهت) بس الـ LocalStorage لسه محتفظ باليوزر -> اعمل تسجيل خروج
          set({ user: null, token: null, isAuthenticated: false });
        } else if (cookieToken && storeToken) {
          // الاتنين موجودين -> أكد تسجيل الدخول
          set({ isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);