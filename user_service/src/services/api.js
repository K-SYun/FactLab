import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 한글 카테고리명을 영어 카테고리명으로 매핑
const categoryMapping = {
  '정치': 'politics',
  '경제': 'economy',
  '사회': 'society',
  'IT과학': 'technology',
  '세계': 'world',
  '기후환경': 'environment',
  '연예': 'entertainment',
  '스포츠': 'sports'
};

export const newsApi = {
  // 사용자 화면용 - 승인된 뉴스만 조회
  getAllNews: (page = 0, size = 10) => api.get(`/news/approved?page=${page}&size=${size}`),
  getNewsByCategory: (category, page = 0, size = 10) => {
    // 한글 카테고리명을 영어로 변환 (데이터베이스는 영어 사용)
    const englishCategory = categoryMapping[category] || category;
    return api.get(`/news/approved/category/${encodeURIComponent(englishCategory)}?page=${page}&size=${size}`);
  },
  getNewsById: (id) => api.get(`/news/${id}`),
  getLatestNews: (limit = 10) => api.get(`/news/approved/latest?limit=${limit}`),
  
  // 트렌딩 키워드 조회 (뉴스 키워드 중 가장 많이 사용된 상위 10개)
  getTrendingKeywords: () => api.get('/trending/keywords'),
  
  // 투표 관련 API
  voteNews: (newsId, voteType, userId) => api.post(`/news/${newsId}/vote`, { voteType, userId }),
  getVoteResults: (newsId) => api.get(`/news/${newsId}/votes`),
  checkUserVote: (newsId, userId) => api.get(`/news/${newsId}/vote/user/${userId}`),
  
  // 베스트 뉴스 조회
  getBestNews: (period = 'daily', limit = 10) => api.get(`/news/best?period=${period}&limit=${limit}`),
  
  // 관리자용 - 모든 뉴스 조회 (향후 관리자 패널에서 사용)
  getAllNewsForAdmin: (page = 0, size = 10) => api.get(`/news?page=${page}&size=${size}`),
  getNewsByCategoryForAdmin: (category, page = 0, size = 10) => {
    const englishCategory = categoryMapping[category] || category;
    return api.get(`/news/category/${encodeURIComponent(englishCategory)}?page=${page}&size=${size}`);
  },
};

export default api;