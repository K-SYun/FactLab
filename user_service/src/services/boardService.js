import axios from 'axios';

const API_BASE_URL = '/api';

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
  getPosts: async (boardId, page = 0, size = 20, searchParams = {}) => {
    try {
      const params = {
        boardId,
        page,
        size
      };

      // 검색 파라미터 추가
      if (searchParams.searchType && searchParams.searchKeyword) {
        params.searchType = searchParams.searchType;
        params.searchKeyword = searchParams.searchKeyword;
      }

      // 정렬 파라미터 추가
      if (searchParams.sortType) {
        params.sortType = searchParams.sortType;
      }

      const response = await axios.get(`${API_BASE_URL}/posts`, {
        params
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

  // 게시글 작성
  createPost: async (postData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/posts`, {
        boardId: postData.boardId,
        title: postData.title,
        content: postData.content,
        author: postData.author,
        tags: postData.tags || [],
        files: postData.files || []
      }, {
        headers: {
          'User-Id': postData.userId || postData.user?.id
        }
      });
      return response.data;
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      throw error;
    }
  },

  // BEST 게시글 목록 조회 (조회수 100 이상, 추천수 10 이상)
  getBestPosts: async (params) => {
    try {
      // params가 객체인 경우와 단순 숫자인 경우 모두 처리
      let requestParams;
      if (typeof params === 'object' && params !== null) {
        requestParams = {
          page: params.page || 0,
          size: params.size || 20,
          minViewCount: params.minViewCount || 100,
          minLikeCount: params.minLikeCount || 10,
          excludeBoards: params.excludeBoards || []
        };

        // 검색 파라미터 추가
        if (params.searchType && params.searchKeyword) {
          requestParams.searchType = params.searchType;
          requestParams.searchKeyword = params.searchKeyword;
        }

        // 정렬 파라미터 추가
        if (params.sortType) {
          requestParams.sortType = params.sortType;
        }
      } else {
        // 기존 호출 방식 지원 (page, size)
        requestParams = {
          page: params || 0,
          size: arguments[1] || 20,
          minViewCount: 100,
          minLikeCount: 10,
          excludeBoards: ['gallery']
        };
      }

      const response = await axios.get(`${API_BASE_URL}/posts/best`, {
        params: requestParams
      });
      return response.data;
    } catch (error) {
      console.error('BEST 게시글 목록 조회 실패:', error);
      throw error;
    }
  },

  // 게시글 댓글 목록 조회
  getPostComments: async (postId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error);
      throw error;
    }
  },

  // 게시글 댓글 작성
  createPostComment: async (postId, content, userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/comments`, {
        postId,
        content,
        userId
      });
      return response.data;
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      throw error;
    }
  },

  // 게시글 댓글 답글 작성
  createPostReply: async (postId, parentCommentId, content, userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/comments`, {
        postId,
        parentCommentId,
        content,
        userId
      });
      return response.data;
    } catch (error) {
      console.error('답글 작성 실패:', error);
      throw error;
    }
  },

  // 게시글 댓글 삭제
  deletePostComment: async (commentId, userId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/comments/${commentId}`, {
        headers: {
          'User-Id': userId
        }
      });
      return response.data;
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      throw error;
    }
  },

  // 게시글 추천/비추천
  votePost: async (postId, voteType, userId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/vote`, {
        voteType, // 'up' or 'down'
        userId
      });
      return response.data;
    } catch (error) {
      console.error('투표 실패:', error);
      throw error;
    }
  },

  // 게시글 조회수 증가
  increaseViewCount: async (postId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/view`);
      return response.data;
    } catch (error) {
      console.error('조회수 증가 실패:', error);
      throw error;
    }
  },

  // 공지사항 포함 게시글 목록 조회
  getPostsWithNotices: async (boardId, page = 0, size = 20) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts/boards/${boardId}/posts-with-notices`, {
        params: {
          page,
          size
        }
      });
      return response.data;
    } catch (error) {
      console.error('공지사항 포함 게시글 목록 조회 실패:', error);
      throw error;
    }
  }
};

export default boardService;