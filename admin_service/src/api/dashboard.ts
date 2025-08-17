import axiosInstance from './axiosInstance';

export interface DashboardStats {
  totalNews: number;
  todayNews: number;
  pendingNews: number;
  totalUsers: number;
  todayUsers: number;
  activeUsers: number;
  totalComments: number;
  todayComments: number;
  totalVotes: number;
  systemUptimeMinutes: number;
}

export interface RecentActivity {
  type: string;
  message: string;
  level: string;
  timestamp: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  averageSessionTime: number;
  totalSessions: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 대시보드 통계 조회
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await axiosInstance.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.error || '대시보드 통계 조회 실패');
};

// 최근 활동 조회
export const getRecentActivities = async (limit: number = 10): Promise<RecentActivity[]> => {
  const response = await axiosInstance.get<ApiResponse<RecentActivity[]>>(`/admin/dashboard/recent-activities?limit=${limit}`);
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.error || '최근 활동 조회 실패');
};

// 대기 중인 뉴스 조회
export const getPendingNews = async (limit: number = 10): Promise<any[]> => {
  const response = await axiosInstance.get<ApiResponse<any[]>>(`/admin/dashboard/news/pending?limit=${limit}`);
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.error || '대기 뉴스 조회 실패');
};

// 사용자 통계 조회
export const getUserStats = async (): Promise<UserStats> => {
  const response = await axiosInstance.get<ApiResponse<UserStats>>('/admin/dashboard/users/stats');
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.error || '사용자 통계 조회 실패');
};