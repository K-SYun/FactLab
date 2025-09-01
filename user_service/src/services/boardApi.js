import axios from 'axios';

const API_BASE_URL = '/api';

const boardApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT 토큰을 헤더에 자동으로 추가
boardApi.interceptors.request.use(
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

// 사용자용 Board API
export const boardService = {
  // 활성화된 게시판 목록 조회 (사용자화면용)
  getActiveBoards: () => boardApi.get('/boards/active'),
  
  // 게시판 상세 정보 조회
  getBoardById: (id) => boardApi.get(`/boards/${id}`),
  
  // 게시판별 게시글 목록 조회 (공지사항 포함)
  getBoardPosts: (boardId, page = 0, size = 10) => 
    boardApi.get(`/posts?boardId=${boardId}&page=${page}&size=${size}`),
  
  // 게시글 검색
  searchPosts: (boardId, keyword, page = 0, size = 10) =>
    boardApi.get(`/posts/search?boardId=${boardId}&keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`),
  
  // 인기 게시글 조회
  getPopularPosts: (boardId, page = 0, size = 10) =>
    boardApi.get(`/posts/popular?boardId=${boardId}&page=${page}&size=${size}`),
  
  // 사용자가 작성한 게시글 조회
  getUserPosts: (userId, page = 0, size = 10) =>
    boardApi.get(`/posts/user/${userId}?page=${page}&size=${size}`),
  
  // 게시글 상세 정보 조회
  getPostById: (postId) =>
    boardApi.get(`/posts/${postId}`),
  
  // 게시글 좋아요/좋아요 취소
  likePost: (postId) => 
    boardApi.post(`/posts/${postId}/like`),
    
  unlikePost: (postId) =>
    boardApi.delete(`/posts/${postId}/like`),
};

export default boardApi;
