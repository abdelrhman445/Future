import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach token to every request (Client & Server safe)
api.interceptors.request.use(async (config) => {
  let token = undefined;

  if (typeof window !== 'undefined') {
    // Client-side: قراءة التوكن من المتصفح
    token = Cookies.get('accessToken');
  } else {
    // Server-side: قراءة التوكن من سيرفر Next.js
    try {
      // بنستخدم dynamic import عشان ميعملش مشكلة في الـ Client Components
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      token = cookieStore.get('accessToken')?.value;
    } catch (error) {
      // تجاهل الخطأ لو الريكويست مش في بيئة بتدعم الـ cookies()
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally (Safe Redirect)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;

        // لا تسجل خروج في صفحات الدفع
        if (
          path.includes('/payment') ||
          path.includes('/success') ||
          path.includes('/verify')
        ) {
          return Promise.reject(error);
        }

        Cookies.remove('accessToken');

        if (!path.includes('/login')) {
          window.location.href = '/ar/login';
        }
      }
    }

    return Promise.reject(error);
  }
);
export default api;

// ==================== AUTH ====================
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; referralCode?: string }) =>
    api.post('/auth/register', data),
  verifyOtp: (email: string, otp: string) =>
    api.post('/auth/verify-otp', { email, otp }),
  resendOtp: (email: string) =>
    api.post('/auth/resend-otp', { email }),
  me: () => api.get('/users/me'),
  logout: () => api.post('/auth/logout'),
};

// ==================== COURSES ====================
export const coursesApi = {
  list: (params?: { page?: number; limit?: number; package?: string }) =>
    api.get('/courses', { params }),
  getBySlug: (slug: string) =>
    api.get(`/courses/${slug}`),
  getContent: (courseId: string) =>
    api.get(`/courses/${courseId}/content`),
  myCourses: () =>
    api.get('/users/my-courses'),
};

// ==================== PAYMENTS ====================
export const paymentsApi = {
  checkout: (courseId: string) =>
    api.post('/payments/checkout/stripe', { courseId }),
  verify: (sessionId: string) =>
    api.get(`/payments/verify/${sessionId}`),
  history: () =>
    api.get('/payments/history'),
};

// ==================== MEDIA ====================
export const mediaApi = {
  getStreamUrl: (lessonId: string) =>
    api.get(`/media/video/${lessonId}/stream`),
  
  // 🔴 التعديل هنا: إرسال JSON بدلاً من FormData
  uploadVideo: (data: { lessonId: string; youtubeUrl: string }) =>
    api.post('/media/upload', data),
};

// ==================== AFFILIATE ====================
export const affiliateApi = {
  dashboard: () => api.get('/affiliate/dashboard'),
  
  trackings: () => api.get('/affiliate/my-referrals'), // مسار قائمة الإحالات
  
  requestWithdrawal: (data: { amount: number; method: string; accountDetails: string }) =>
    api.post('/affiliate/withdraw', data),
};

// ==================== ADMIN ====================
export const adminApi = {
  stats: () => api.get('/users/dashboard'),
  users: (page = 1) => api.get('/users', { params: { page } }),
  transactions: (page = 1) => api.get('/payments/history', { params: { page } }),
  
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/users/${userId}/role`, { role }),
  updateUserStatus: (userId: string, isActive: boolean) =>
    api.patch(`/users/${userId}/status`, { isActive }),
    
  createCourse: (data: object) => api.post('/courses', data),
  updateCourse: (courseId: string, data: object) =>
    api.patch(`/courses/${courseId}`, data),
  deleteCourse: (courseId: string) =>
    api.delete(`/courses/${courseId}`),
    
  approveWithdrawal: (trackingId: string) =>
    api.patch(`/affiliate/admin/approve/${trackingId}`),
    
  allCourses: () => api.get('/courses/admin/all'),
  pendingCourses: () => api.get('/courses/admin/pending'),
  publishCourse: (courseId: string) =>
    api.patch(`/courses/${courseId}/publish`),

  getCourse: (courseId: string) =>
    api.get(`/courses/admin/${courseId}`),

  createSection: (courseId: string, data: any) =>
    api.post(`/courses/${courseId}/sections`, data),

  createLesson: (sectionId: string, data: any) =>
    api.post(`/courses/sections/${sectionId}/lessons`, data),

  updateLesson: (lessonId: string, data: any) => 
    api.patch(`/courses/lessons/${lessonId}`, data),

  // 🔴 التعديل هنا: إرسال JSON بدلاً من FormData وبدون هيدر الـ multipart
  uploadLessonVideo: (data: { lessonId: string; youtubeUrl: string }) =>
    api.post('/media/upload', data),
  // ضيف دول جوه adminApi
  getWithdrawals: () => api.get('/affiliate/withdrawals'),
  processWithdrawal: (id: string, data: { status: string; adminNote?: string }) => 
    api.patch(`/affiliate/withdrawals/${id}`, data),
};

// ==================== PRESENTATIONS ====================
export const presentationApi = {
  myReferrals: () => api.get('/presentations/my-referrals'),
  inspectors: () => api.get('/presentations/inspectors'),
  sendInvite: (data: any) => api.post('/presentations/invite', data),
  mySentInvites: () => api.get('/presentations/sent'),
  myReceivedInvites: () => api.get('/presentations/received'),
  respond: (inviteId: string, data: { status: string; responseMessage?: string }) => 
    api.patch(`/presentations/invite/${inviteId}/respond`, data),
};

// ==================== MANAGER ====================
export const managerApi = {
  // البحث عن مستخدم بالاسم أو الإيميل
  searchUsers: (query: string) => api.get(`/manager/users/search?q=${query}`),
  
  // تفعيل كورس لمستخدم معين
  grantCourseAccess: (userId: string, courseId: string) => 
    api.post('/manager/grant-course', { userId, courseId }),
};