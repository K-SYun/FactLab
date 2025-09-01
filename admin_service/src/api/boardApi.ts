import axiosInstance from './axiosInstance';

export interface BoardResponse {
  id: number;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  displayOrder: number;
  postCount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const boardApi = {
  // 모든 활성화된 게시판 조회
  getAllActiveBoards: async (): Promise<ApiResponse<BoardResponse[]>> => {
    try {
      const response = await axiosInstance.get('/admin/boards/active');
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || '게시판 목록 조회 실패'
      };
    }
  },

  // 게시판 목록 조회 (페이징)
  getBoards: async (page: number = 0, size: number = 20): Promise<ApiResponse<any>> => {
    try {
      const response = await axiosInstance.get(`/admin/boards?page=${page}&size=${size}`);
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || '게시판 목록 조회 실패'
      };
    }
  }
};