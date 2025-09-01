// Notice API 서비스
class NoticeApi {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8080/api' 
      : '/api';
  }

  // 활성화된 공지사항 목록 조회 (사용자용)
  async getActiveNotices(page = 0, size = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/posts/notices?page=${page}&size=${size}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '공지사항을 가져오는데 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('공지사항 조회 오류:', error);
      throw error;
    }
  }

  // 공지사항 상세 조회
  async getNotice(noticeId) {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${noticeId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '공지사항을 가져오는데 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('공지사항 상세 조회 오류:', error);
      throw error;
    }
  }

  // 푸터용 최신 공지사항 조회 (5개)
  async getFooterNotices() {
    try {
      const response = await fetch(`${this.baseUrl}/posts/notices/footer`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '푸터 공지사항을 가져오는데 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('푸터 공지사항 조회 오류:', error);
      throw error;
    }
  }

  // 특정 게시판의 공지사항 조회 (게시판 상단 표시용)
  async getBoardNotices(boardId, page = 0, size = 5) {
    try {
      const response = await fetch(`${this.baseUrl}/posts/notices/board/${boardId}?page=${page}&size=${size}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '게시판 공지사항을 가져오는데 실패했습니다.');
      }
      
      return result.data;
    } catch (error) {
      console.error('게시판 공지사항 조회 오류:', error);
      throw error;
    }
  }
}

export const noticeApi = new NoticeApi();
export default noticeApi;