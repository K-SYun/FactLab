import axios from './axiosInstance';

export interface User {
  id: number;
  email: string;
  nickname: string;
  level: number;
  activityScore: number;
  status: 'ACTIVE' | 'WARNED' | 'SUSPENDED' | 'BANNED' | 'INACTIVE';
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  postsCount: number;
  commentsCount: number;
  reportsCount: number;
}

export interface UserUpdateRequest {
  nickname?: string;
  level?: number;
  status?: string;
  role?: string;
  note?: string;
}

export interface BatchUpdateRequest {
  userIds: number[];
  status: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  warnedUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  recentActiveUsers: number;
  newUsersThisMonth: number;
}

export interface UsersResponse {
  content: User[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      direction: string;
      property: string;
    };
  };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
}

class UserApi {
  // 사용자 목록 조회
  async getUsers(params: {
    status?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
    direction?: string;
  } = {}) {
    const response = await axios.get<{
      success: boolean;
      data: UsersResponse;
      error?: string;
    }>('/admin/users', { params });
    return response.data;
  }

  // 사용자 상세 조회
  async getUserById(id: number) {
    const response = await axios.get<{
      success: boolean;
      data: User;
      error?: string;
    }>(`/admin/users/${id}`);
    return response.data;
  }

  // 사용자 정보 수정
  async updateUser(id: number, updateData: UserUpdateRequest) {
    const response = await axios.put<{
      success: boolean;
      data: User;
      error?: string;
    }>(`/admin/users/${id}`, updateData);
    return response.data;
  }

  // 사용자 삭제 (soft delete)
  async deleteUser(id: number) {
    const response = await axios.delete<{
      success: boolean;
      data: null;
      error?: string;
    }>(`/admin/users/${id}`);
    return response.data;
  }

  // 여러 사용자 상태 일괄 수정
  async updateUsersStatus(data: BatchUpdateRequest) {
    const response = await axios.put<{
      success: boolean;
      data: null;
      error?: string;
    }>('/admin/users/batch-status', data);
    return response.data;
  }

  // 사용자 통계 조회
  async getUserStats() {
    const response = await axios.get<{
      success: boolean;
      data: UserStats;
      error?: string;
    }>('/admin/users/stats');
    return response.data;
  }
}

export const userApi = new UserApi();
export default userApi;