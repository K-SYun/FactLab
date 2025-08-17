import axiosInstance from './axiosInstance';
import { Popup, PopupCreateRequest, PopupStats } from '../types/popup';

export const popupApi = {
  // 전체 팝업 목록 조회
  getAllPopups: async (page = 0, size = 20): Promise<Popup[]> => {
    const response = await axiosInstance.get(`/popups?page=${page}&size=${size}`);
    return response.data.data;
  },

  // 활성화된 팝업 목록 조회
  getActivePopups: async (): Promise<Popup[]> => {
    const response = await axiosInstance.get('/popups/active');
    return response.data.data;
  },

  // 현재 표시할 팝업 목록 조회
  getDisplayPopups: async (): Promise<Popup[]> => {
    const response = await axiosInstance.get('/popups/display');
    return response.data.data;
  },

  // 팝업 상세 조회
  getPopupById: async (id: number): Promise<Popup> => {
    const response = await axiosInstance.get(`/popups/${id}`);
    return response.data.data;
  },

  // 팝업 생성
  createPopup: async (popup: PopupCreateRequest): Promise<Popup> => {
    const response = await axiosInstance.post('/popups', popup);
    return response.data.data;
  },

  // 팝업 수정
  updatePopup: async (id: number, popup: PopupCreateRequest): Promise<Popup> => {
    const response = await axiosInstance.put(`/popups/${id}`, popup);
    return response.data.data;
  },

  // 팝업 활성화/비활성화 토글
  togglePopupActive: async (id: number): Promise<Popup> => {
    const response = await axiosInstance.put(`/popups/${id}/toggle`);
    return response.data.data;
  },

  // 팝업 삭제
  deletePopup: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/popups/${id}`);
  },

  // 팝업 통계 조회
  getPopupStats: async (): Promise<PopupStats> => {
    const response = await axiosInstance.get('/popups/stats');
    return response.data.data;
  }
};