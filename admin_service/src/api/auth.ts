import axiosInstance from './axiosInstance';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
  };
  message?: string;
  error?: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AdminUserRequest {
  username: string;
  email: string;
  password?: string;
  role: string;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 관리자 로그인
export const adminLogin = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/admin/auth/login', credentials);
  return response.data;
};

// 관리자 로그아웃
export const adminLogout = async (): Promise<void> => {
  await axiosInstance.post('/admin/auth/logout');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

// 관리자 사용자 목록 조회
export const getAdminUsers = async (): Promise<ApiResponse<AdminUser[]>> => {
  const response = await axiosInstance.get<ApiResponse<AdminUser[]>>('/admin/accounts');
  return response.data;
};

// 관리자 사용자 생성
export const createAdminUser = async (userData: AdminUserRequest): Promise<ApiResponse<AdminUser>> => {
  const response = await axiosInstance.post<ApiResponse<AdminUser>>('/admin/accounts', userData);
  return response.data;
};

// 관리자 사용자 수정
export const updateAdminUser = async (id: number, userData: AdminUserRequest): Promise<ApiResponse<AdminUser>> => {
  const response = await axiosInstance.put<ApiResponse<AdminUser>>(`/admin/accounts/${id}`, userData);
  return response.data;
};

// 관리자 사용자 삭제
export const deleteAdminUser = async (id: number): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete<ApiResponse<void>>(`/admin/accounts/${id}`);
  return response.data;
};

// 현재 로그인한 관리자 정보 조회
export const getCurrentAdmin = async (): Promise<ApiResponse<AdminUser>> => {
  const response = await axiosInstance.get<ApiResponse<AdminUser>>('/admin/auth/me');
  return response.data;
};

// 토큰 검증
export const verifyToken = async (): Promise<boolean> => {
  try {
    // 토큰이 없으면 API 호출하지 않고 바로 false 반환
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return false;
    }
    
    await getCurrentAdmin();
    return true;
  } catch (error) {
    // 토큰이 유효하지 않으면 제거
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    return false;
  }
};