import axiosInstance from './axiosInstance';

// News Summary types
export interface NewsSummaryItem {
  id: number;
  newsId: number;
  summary?: string;
  claim?: string;
  keywords?: string;
  autoQuestion?: string;
  reliabilityScore?: number;
  aiConfidence?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  aiModel?: string;
  processingTime?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  // 뉴스 정보 (조인된 데이터)
  newsTitle?: string;
  newsCategory?: string;
  newsSource?: string;
}

export interface SummaryStatistics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime?: number;
  highConfidenceCount: number;
}

// Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Request types
export interface UpdateSummaryRequest {
  summary?: string;
  claim?: string;
  keywords?: string;
  autoQuestion?: string;
  reliabilityScore?: number;
  aiConfidence?: number;
  aiModel?: string;
  processingTime?: number;
}

export interface UpdateStatusRequest {
  status: string;
  errorMessage?: string;
}

export interface EditSummaryRequest {
  summary?: string;
  claim?: string;
  keywords?: string;
  autoQuestion?: string;
  reliabilityScore?: number;
}

export const newsSummaryApi = {
  // 모든 AI 요약 작업 조회
  getAllSummaries: (page = 0, size = 20): Promise<ApiResponse<NewsSummaryItem[]>> =>
    axiosInstance.get(`/news-summary?page=${page}&size=${size}`).then(res => res.data),

  // 상태별 AI 요약 작업 조회
  getSummariesByStatus: (status: string, page = 0, size = 20): Promise<ApiResponse<NewsSummaryItem[]>> =>
    axiosInstance.get(`/news-summary/status/${status}?page=${page}&size=${size}`).then(res => res.data),

  // 뉴스별 AI 요약 조회
  getSummaryByNewsId: (newsId: number): Promise<ApiResponse<NewsSummaryItem>> =>
    axiosInstance.get(`/news-summary/news/${newsId}`).then(res => res.data),

  // AI 요약 작업 생성
  createSummary: (newsId: number): Promise<ApiResponse<NewsSummaryItem>> =>
    axiosInstance.post(`/news-summary/create/${newsId}`).then(res => res.data),

  // AI 요약 결과 업데이트
  updateSummaryResult: (summaryId: number, request: UpdateSummaryRequest): Promise<ApiResponse<NewsSummaryItem>> =>
    axiosInstance.put(`/news-summary/${summaryId}/result`, request).then(res => res.data),

  // AI 요약 작업 상태 업데이트
  updateSummaryStatus: (summaryId: number, request: UpdateStatusRequest): Promise<ApiResponse<NewsSummaryItem>> =>
    axiosInstance.put(`/news-summary/${summaryId}/status`, request).then(res => res.data),

  // AI 요약 작업 재시도
  retrySummary: (summaryId: number): Promise<ApiResponse<NewsSummaryItem>> =>
    axiosInstance.post(`/news-summary/${summaryId}/retry`).then(res => res.data),

  // AI 요약 결과 수동 수정
  editSummaryResult: (summaryId: number, request: EditSummaryRequest): Promise<ApiResponse<NewsSummaryItem>> =>
    axiosInstance.put(`/news-summary/${summaryId}/edit`, request).then(res => res.data),

  // 일괄 AI 요약 작업 생성
  createBatchSummaries: (): Promise<ApiResponse<NewsSummaryItem[]>> =>
    axiosInstance.post('/news-summary/batch/create').then(res => res.data),

  // AI 요약 통계 조회
  getSummaryStatistics: (): Promise<ApiResponse<SummaryStatistics>> =>
    axiosInstance.get('/news-summary/statistics').then(res => res.data),

  // 타임아웃된 처리 중 작업 조회
  getStuckProcessingTasks: (timeoutMinutes = 30): Promise<ApiResponse<NewsSummaryItem[]>> =>
    axiosInstance.get(`/news-summary/stuck?timeoutMinutes=${timeoutMinutes}`).then(res => res.data),

  // 최근 완료된 작업 조회
  getRecentCompletedSummaries: (limit = 10): Promise<ApiResponse<NewsSummaryItem[]>> =>
    axiosInstance.get(`/news-summary/recent/completed?limit=${limit}`).then(res => res.data),
};