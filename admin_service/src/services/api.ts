import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// News types
interface NewsItem {
  id: number;
  title: string;
  content: string;
  url: string;
  source: string;
  publishDate: string;
  category: string;
  status: string;
}

export const newsApi = {
  getAllNews: (page = 0, size = 20): Promise<ApiResponse<NewsItem[]>> => 
    api.get(`/news?page=${page}&size=${size}`).then(res => res.data),
  
  getNewsByCategory: (category: string, page = 0, size = 20): Promise<ApiResponse<NewsItem[]>> => 
    api.get(`/news/category/${encodeURIComponent(category)}?page=${page}&size=${size}`).then(res => res.data),
  
  getNewsById: (id: number): Promise<ApiResponse<NewsItem>> => 
    api.get(`/news/${id}`).then(res => res.data),
  
  getLatestNews: (limit = 10): Promise<ApiResponse<NewsItem[]>> => 
    api.get(`/news/latest?limit=${limit}`).then(res => res.data),

  // 뉴스 승인/거부 API
  approveNews: (id: number): Promise<ApiResponse<NewsItem>> =>
    api.put(`/news/${id}/approve`).then(res => res.data),

  rejectNews: (id: number): Promise<ApiResponse<NewsItem>> =>
    api.put(`/news/${id}/reject`).then(res => res.data),

  // 일괄 작업 API
  bulkApproveNews: (newsIds: number[]): Promise<ApiResponse<string>> =>
    api.post('/news/bulk/approve', { newsIds }).then(res => res.data),

  bulkRejectNews: (newsIds: number[]): Promise<ApiResponse<string>> =>
    api.post('/news/bulk/reject', { newsIds }).then(res => res.data),

  approveAllPendingNews: (): Promise<ApiResponse<string>> =>
    api.post('/news/pending/approve-all').then(res => res.data),
};

export default api;
export type { NewsItem, ApiResponse };