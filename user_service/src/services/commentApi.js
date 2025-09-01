// Comment API 서비스
class CommentApi {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8080/api' 
      : '/api';
  }

  // 뉴스 댓글 목록 조회
  async getComments(newsId) {
    try {
      const response = await fetch(`${this.baseUrl}/news/${newsId}/comments`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '댓글을 가져오는데 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('댓글 조회 오류:', error);
      throw error;
    }
  }

  // 댓글 작성
  async createComment(newsId, content, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/news/${newsId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userId || '1' // 임시로 1을 기본값으로 설정
        },
        body: JSON.stringify({
          newsId: newsId, // newsId를 명시적으로 전송
          content: content
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '댓글 작성에 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      throw error;
    }
  }

  // 답글 작성
  async createReply(newsId, parentCommentId, content, userId) {
    try {
      const response = await fetch(`${this.baseUrl}/news/${newsId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userId || '1' // 임시로 1을 기본값으로 설정
        },
        body: JSON.stringify({
          newsId: newsId, // newsId를 명시적으로 전송
          parentCommentId: parentCommentId, // parentId → parentCommentId로 수정
          content: content
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '답글 작성에 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('답글 작성 오류:', error);
      throw error;
    }
  }

  // 뉴스 댓글 삭제
  async deleteComment(commentId, userId, newsId) {
    try {
      const response = await fetch(`${this.baseUrl}/news/${newsId}/comments/${commentId}`, {
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
      console.error('뉴스 댓글 삭제 오류:', error);
      throw error;
    }
  }

  // 뉴스 댓글 좋아요
  async likeComment(commentId, userId, newsId) {
    try {
      const response = await fetch(`${this.baseUrl}/news/${newsId}/comments/${commentId}/like`, {
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
      console.error('뉴스 댓글 좋아요 오류:', error);
      throw error;
    }
  }

  // 사용자 댓글 목록 조회 (마이페이지용) - 뉴스 제목 포함
  async getUserComments(userId, page = 0, size = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/news/comments/user/${userId}?page=${page}&size=${size}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '댓글 목록을 가져오는데 실패했습니다.');
      }
      
      // Page 객체에서 content 배열 추출
      const comments = result.data?.content || result.data || [];
      console.log('사용자 뉴스 댓글 API 응답 처리:', comments);
      
      return comments;
    } catch (error) {
      console.error('사용자 뉴스 댓글 조회 오류:', error);
      throw error;
    }
  }
}

export const commentApi = new CommentApi();
export default commentApi;