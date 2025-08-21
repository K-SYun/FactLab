// Board Comment API 서비스
class BoardCommentApi {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8080/api' 
      : '/api';
  }

  // 게시판 댓글 목록 조회
  async getComments(postId) {
    try {
      const response = await fetch(`${this.baseUrl}/comments?postId=${postId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '댓글을 가져오는데 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('게시판 댓글 조회 오류:', error);
      throw error;
    }
  }

  // 게시판 댓글 작성
  async createComment(postId, content, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userId || '1'
        },
        body: JSON.stringify({
          postId: postId,
          content: content
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '댓글 작성에 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('게시판 댓글 작성 오류:', error);
      throw error;
    }
  }

  // 게시판 답글 작성
  async createReply(postId, parentCommentId, content, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userId || '1'
        },
        body: JSON.stringify({
          postId: postId,
          parentCommentId: parentCommentId,
          content: content
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '답글 작성에 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('게시판 답글 작성 오류:', error);
      throw error;
    }
  }

  // 게시판 댓글 삭제
  async deleteComment(commentId, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userId || '1'
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '댓글 삭제에 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('게시판 댓글 삭제 오류:', error);
      throw error;
    }
  }

  // 게시판 댓글 좋아요
  async likeComment(commentId, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '좋아요 처리에 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('게시판 댓글 좋아요 오류:', error);
      throw error;
    }
  }

  // 사용자 게시판 댓글 목록 조회 (마이페이지용)
  async getUserComments(userId, page = 0, size = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/comments/user/${userId}?page=${page}&size=${size}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '댓글 목록을 가져오는데 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('사용자 게시판 댓글 조회 오류:', error);
      throw error;
    }
  }
}

export const boardCommentApi = new BoardCommentApi();
export default boardCommentApi;