import axios from 'axios';

const API_BASE_URL = '/api';

const userApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT 토큰을 헤더에 자동으로 추가
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const mypageApi = {
  // 사용자 프로필 정보 조회 - 기존 백엔드 API 사용
  getUserProfile: (userId) => userApi.get(`/users/${userId}`),
  
  // 사용자 프로필 정보 업데이트 - 기존 백엔드 API 사용
  updateUserProfile: (userId, profileData) => userApi.put(`/users/${userId}`, profileData),
  
  // 사용자가 작성한 게시글 조회
  getUserPosts: (userId, page = 0, size = 10) => 
    userApi.get(`/posts/user/${userId}?page=${page}&size=${size}`),
  
  // 사용자가 작성한 게시판 댓글 조회
  getUserComments: (userId, page = 0, size = 10) => 
    userApi.get(`/comments/user/${userId}?page=${page}&size=${size}`),
  
  // 사용자가 좋아요 표시한 게시글 조회
  getUserLikedPosts: (userId, page = 0, size = 10) => 
    userApi.get(`/user/${userId}/liked-posts?page=${page}&size=${size}`),
  
  // 사용자의 뉴스 투표 기록 조회
  getUserVoteHistory: (userId, page = 0, size = 10) => 
    userApi.get(`/user/${userId}/vote-history?page=${page}&size=${size}`),
  
  // 사용자 활동 통계 조회
  getUserStats: (userId) => userApi.get(`/user/${userId}/stats`),
  
  // 비밀번호 변경
  changePassword: (userId, passwordData) => 
    userApi.put(`/user/${userId}/password`, passwordData),
  
  // 프로필 이미지 업로드
  uploadProfileImage: (userId, formData) => 
    userApi.post(`/user/${userId}/profile-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  // 소셜 계정 연동 관리
  getSocialAccounts: (userId) => userApi.get(`/user/${userId}/social-accounts`),
  
  // 소셜 계정 연결 해제
  disconnectSocialAccount: (userId, provider) => 
    userApi.delete(`/user/${userId}/social-accounts/${provider}`),
  
  // 소셜 계정 프로필 이미지 동기화
  syncSocialProfileImage: (userId, provider) => 
    userApi.post(`/user/${userId}/social-accounts/${provider}/sync-profile`),
};

export default userApi;