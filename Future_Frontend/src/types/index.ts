// ==================== AUTH ====================
export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'AFFILIATE' | 'USER';
  phone?: string;
  affiliateCode?: string;
  totalEarnings?: number;
  pendingEarnings?: number;
  profileImage?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

// ==================== COURSES ====================
export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  packageType: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  originalPrice: number;
  salePrice?: number;
  currency: string;
  duration?: number;
  totalLessons?: number;
  language: string;
  level: string;
  commissionRate: number;
  status?: string;
  sections?: Section[];
}

export interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  videoDuration?: number;
  isFreePreview: boolean;
  videoUrl?: string;
  description?: string;
}

// ==================== PURCHASES ====================
export interface UserCourse {
  id: string;
  courseId: string;
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED';
  amountPaid: number;
  currency: string;
  purchasedAt: string;
  course: {
    title: string;
    slug: string;
    thumbnailUrl?: string;
  };
}

// ==================== AFFILIATE ====================
export interface AffiliateTracking {
  id: string;
  referredUserId: string;
  commissionAmount: number;
  commissionRate: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  course?: { title: string };
  createdAt: string;
}

export interface AffiliateDashboard {
  affiliateCode: string;
  referralLink: string;
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  conversions: number;
  trackings: AffiliateTracking[];
}

// ==================== API RESPONSE ====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== ADMIN ====================
export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  pendingWithdrawals: number;
}

export interface Transaction {
  id: string;
  amountPaid: number;
  currency: string;
  purchasedAt: string;
  user: { firstName: string; lastName: string; email: string };
  course: { title: string };
}
