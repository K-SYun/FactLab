import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const boardService = {
  // 게시판 목록 조회
  getBoards: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/boards`);
      return response.data;
    } catch (error) {
      console.error('게시판 목록 조회 실패:', error);
      throw error;
    }
  },

  // 특정 게시판 조회
  getBoard: async (boardId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/boards/${boardId}`);
      return response.data;
    } catch (error) {
      console.error('게시판 조회 실패:', error);
      throw error;
    }
  },

  // 게시글 목록 조회
  getPosts: async (boardId, page = 0, size = 20) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts`, {
        params: {
          boardId,
          page,
          size
        }
      });
      return response.data;
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
      throw error;
    }
  },

  // 게시글 상세 조회
  getPost: async (postId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('게시글 조회 실패:', error);
      throw error;
    }
  },

  // BEST 게시글 목록 조회 (조회수 100 이상, 추천수 10 이상)
  getBestPosts: async (page = 0, size = 20) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/best`, {
        params: {
          page,
          size
        }
      });
      return response.data;
    } catch (error) {
      console.error('BEST 게시글 목록 조회 실패:', error);
      throw error;
    }
  }
};

export default boardService;