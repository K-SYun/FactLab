import axiosInstance from './axiosInstance';

export interface NoticeRequest {
  title: string;
  content: string;
  isActive: boolean;
  isPinned: boolean;
  category: 'ALL' | 'IMPORTANT' | 'EVENT' | 'UPDATE'; // 공지사항 카테고리 (백엔드 enum과 일치)
  selectedBoardIds?: number[]; // 중요 공지사항에서 선택된 게시판 ID 목록
  boardId?: number; // 특정 게시판 지정 시 사용 (레거시)
}

export interface NoticeResponse {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: string;
  authorName: string;
  boardId?: number;
  boardName?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isNotice: boolean;
  isAnonymous: boolean;
  excludedFromBest: boolean;
  status: string;
  comments: any[];
}

export interface NoticeListResponse {
  content: NoticeResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// 현재 로그인한 관리자 ID 가져오기
const getAdminId = (): string => {
  const adminUser = localStorage.getItem('adminUser');
  if (adminUser) {
    const user = JSON.parse(adminUser);
    return user.id.toString();
  }
  return '1'; // 기본값
};

export const noticeApi = {
  // 공지사항 목록 조회
  getNotices: async (page: number = 0, size: number = 20) => {
    const response = await axiosInstance.get(`/admin/notices`, {
      params: { page, size }
    });
    return response.data;
  },

  // 공지사항 상세 조회
  getNotice: async (noticeId: number) => {
    const response = await axiosInstance.get(`/admin/notices/${noticeId}`);
    return response.data;
  },

  // 공지사항 생성
  createNotice: async (data: NoticeRequest) => {
    const requestData: any = {
      boardId: 1, // validation 통과용 임시값 (백엔드에서 공지사항 게시판으로 변경됨)
      title: data.title,
      content: data.content,
      isNotice: true,
      isAnonymous: false,
      noticeCategory: data.category // 카테고리 정보 추가
    };

    // 중요 공지사항인 경우에만 selectedBoardIds 포함
    if (data.category === 'IMPORTANT' && data.selectedBoardIds) {
      requestData.selectedBoardIds = data.selectedBoardIds;
    }

    const response = await axiosInstance.post('/admin/notices', requestData, {
      headers: {
        'Admin-Id': getAdminId()
      }
    });
    return response.data;
  },

  // 공지사항 수정
  updateNotice: async (noticeId: number, data: NoticeRequest) => {
    const requestData: any = {
      boardId: 1, // validation 통과용 임시값 (백엔드에서 공지사항 게시판으로 변경됨)
      title: data.title,
      content: data.content,
      isNotice: true,
      noticeCategory: data.category // 카테고리 정보 추가
    };

    // 중요 공지사항인 경우에만 selectedBoardIds 포함
    if (data.category === 'IMPORTANT' && data.selectedBoardIds) {
      requestData.selectedBoardIds = data.selectedBoardIds;
    }

    const response = await axiosInstance.put(`/admin/notices/${noticeId}`, requestData, {
      headers: {
        'Admin-Id': getAdminId()
      }
    });
    return response.data;
  },

  // 공지사항 삭제
  deleteNotice: async (noticeId: number) => {
    const response = await axiosInstance.delete(`/admin/notices/${noticeId}`, {
      headers: {
        'Admin-Id': getAdminId()
      }
    });
    return response.data;
  },

  // 공지사항 상태 토글 (활성화/비활성화)
  toggleNoticeStatus: async (noticeId: number) => {
    const response = await axiosInstance.put(`/admin/notices/${noticeId}/toggle-status`, {}, {
      headers: {
        'Admin-Id': getAdminId()
      }
    });
    return response.data;
  },

  // 공지사항 고정 토글
  toggleNoticePin: async (noticeId: number) => {
    const response = await axiosInstance.put(`/admin/notices/${noticeId}/toggle-pin`, {}, {
      headers: {
        'Admin-Id': getAdminId()
      }
    });
    return response.data;
  },

  // 활성화된 공지사항 목록 조회 (사용자용)
  getActiveNotices: async (page: number = 0, size: number = 20) => {
    const response = await axiosInstance.get(`/admin/notices/active`, {
      params: { page, size }
    });
    return response.data;
  },

  // 게시판 목록 조회 (공지사항 등록 시 게시판 선택용)
  getBoards: async () => {
    const response = await axiosInstance.get('/admin/boards');
    return response.data;
  }
};

export default noticeApi;