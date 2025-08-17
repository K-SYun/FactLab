import axios from 'axios';

const API_BASE_URL = '/api';

const boardApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 사용자용 Board API
export const boardService = {
  // 활성화된 게시판 목록 조회 (사용자화면용)
  getActiveBoards: () => boardApi.get('/boards/active'),
  
  // 게시판 상세 정보 조회
  getBoardById: (id) => boardApi.get(`/boards/${id}`),
  
  // 게시판별 게시글 목록 조회 (향후 구현)
  getBoardPosts: (boardId, page = 0, size = 10) => 
    boardApi.get(`/boards/${boardId}/posts?page=${page}&size=${size}`),
};

export default boardApi;
