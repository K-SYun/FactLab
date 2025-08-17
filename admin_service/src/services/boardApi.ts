import axiosInstance from '../api/axiosInstance';
import { Board, BoardCreateRequest, BoardUpdateRequest, BoardApiResponse } from '../types/board';

export const boardApi = {
  // 모든 게시판 조회 (관리자용)
  getAllBoards: async (): Promise<Board[]> => {
    try {
      const response = await axiosInstance.get<BoardApiResponse>(`/admin/boards`);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      throw new Error(response.data.message || '게시판 목록 조회에 실패했습니다.');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '게시판 목록 조회에 실패했습니다.');
    }
  },

  // 활성화된 게시판 조회 (사용자용)
  getActiveBoards: async (): Promise<Board[]> => {
    try {
      const response = await axiosInstance.get<BoardApiResponse>(`/boards`);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      throw new Error(response.data.message || '게시판 목록 조회에 실패했습니다.');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '게시판 목록 조회에 실패했습니다.');
    }
  },

  // 게시판 상세 조회
  getBoardById: async (id: number): Promise<Board> => {
    try {
      const response = await axiosInstance.get<BoardApiResponse>(`/boards/${id}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data as Board;
      }
      throw new Error(response.data.message || '게시판 조회에 실패했습니다.');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '게시판 조회에 실패했습니다.');
    }
  },

  // 게시판 생성
  createBoard: async (boardData: BoardCreateRequest): Promise<Board> => {
    try {
      const response = await axiosInstance.post<BoardApiResponse>(
        `/admin/boards`,
        boardData
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data as Board;
      }
      throw new Error(response.data.message || '게시판 생성에 실패했습니다.');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '게시판 생성에 실패했습니다.');
    }
  },

  // 게시판 수정
  updateBoard: async (id: number, boardData: BoardUpdateRequest): Promise<Board> => {
    try {
      const response = await axiosInstance.put<BoardApiResponse>(
        `/admin/boards/${id}`,
        boardData
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data as Board;
      }
      throw new Error(response.data.message || '게시판 수정에 실패했습니다.');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '게시판 수정에 실패했습니다.');
    }
  },

  // 게시판 활성화/비활성화 토글
  toggleBoardStatus: async (id: number): Promise<Board> => {
    try {
      const response = await axiosInstance.post<BoardApiResponse>(
        `/admin/boards/${id}/toggle`,
        {}
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data as Board;
      }
      throw new Error(response.data.message || '게시판 상태 변경에 실패했습니다.');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '게시판 상태 변경에 실패했습니다.');
    }
  },

  // 게시판 삭제
  deleteBoard: async (id: number): Promise<void> => {
    try {
      const response = await axiosInstance.delete<BoardApiResponse>(
        `/admin/boards/${id}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || '게시판 삭제에 실패했습니다.');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '게시판 삭제에 실패했습니다.');
    }
  },

  // 카테고리별 게시판 조회
  getBoardsByCategory: async (category: string): Promise<Board[]> => {
    try {
      const response = await axiosInstance.get<BoardApiResponse>(`/boards/category/${category}`);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      throw new Error(response.data.message || '카테고리별 게시판 조회에 실패했습니다.');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '카테고리별 게시판 조회에 실패했습니다.');
    }
  }
};
