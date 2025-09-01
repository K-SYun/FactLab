import axiosInstance from './axiosInstance';

// 법안 상태 타입 정의
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PriorityCategory = 'NEWSWORTHY' | 'HIGH_IMPACT' | 'HIDDEN_GEM';

// 법안 카테고리 라벨 매핑
export const BILL_CATEGORY_LABELS: { [key: string]: string } = {
  'politics': '정치/행정',
  'economy': '경제/산업',
  'labor': '노동/복지',
  'education': '교육/문화',
  'environment': '환경/에너지',
  'digital': '디지털/AI/데이터'
};

// 법안 승인 상태 라벨 매핑
export const APPROVAL_STATUS_LABELS: { [key: string]: string } = {
  'PENDING': '승인대기',
  'APPROVED': '승인됨',
  'REJECTED': '거부됨',
};

// 우선순위 카테고리 라벨 매핑
export const PRIORITY_CATEGORY_LABELS: { [key: string]: string } = {
    'NEWSWORTHY': '이슈성 높은 법안',
    'HIGH_IMPACT': '영향도 높은 법안',
    'HIDDEN_GEM': '사람들은 모르지만 중요한 법안'
};


// 통과 가능성 라벨 매핑
export const PASSAGE_PROBABILITY_LABELS: { [key: string]: string } = {
  'HIGH': '높음',
  'MEDIUM': '보통',
  'LOW': '낮음'
};

// 긴급도 라벨 매핑
export const URGENCY_LEVEL_LABELS: { [key: string]: string } = {
  'URGENT': '긴급',
  'HIGH': '높음',
  'NORMAL': '보통',
  'LOW': '낮음'
};

// 법안 데이터 인터페이스
export interface BillItem {
  id: number;
  billNumber: string;
  title: string;
  summary: string;
  fullText?: string;
  proposerId?: number;
  proposerName: string;
  partyName: string;
  proposalDate: string;
  status: string;
  category: string;
  committee: string;
  stage: string;
  passageProbability: 'HIGH' | 'MEDIUM' | 'LOW';
  urgencyLevel: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  publicInterestScore: number;
  mediaAttentionScore: number;
  votingFor: number;
  votingAgainst: number;
  viewCount: number;
  isFeatured: boolean;
  approvalStatus: ApprovalStatus;
  priorityCategory?: PriorityCategory;
  adminNotes?: string;
  aiSummary?: string;
  aiImpactAnalysis?: string;
  aiKeywords?: string;
  aiReliabilityScore?: number;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 법안 생성/수정 DTO
export interface BillCreateDto {
  billNumber: string;
  title: string;
  summary: string;
  fullText?: string;
  proposerId?: number;
  proposerName: string;
  partyName: string;
  proposalDate: string;
  status: string;
  category: string;
  committee: string;
  stage: string;
  passageProbability?: string;
  urgencyLevel?: string;
  publicInterestScore?: number;
  mediaAttentionScore?: number;
  isFeatured?: boolean;
  approvalStatus?: ApprovalStatus;
  priorityCategory?: PriorityCategory;
  adminNotes?: string;
  aiSummary?: string;
  aiImpactAnalysis?: string;
  aiKeywords?: string;
  aiReliabilityScore?: number;
  sourceUrl?: string;
}

// 페이징된 응답 인터페이스
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// API 응답 인터페이스
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

// 법안 API 클래스
class BillApi {

  // === 사용자용 API ===

  /**
   * 승인된 법안 목록 조회
   */
  async getApprovedBills(page: number = 0, size: number = 20): Promise<ApiResponse<PagedResponse<BillItem>>> {
    const response = await axiosInstance.get('/bills', {
        params: { page, size }
      });
      return response.data;
  }

  // ... (other user-facing methods are omitted for brevity)

  // === 관리자용 API ===

  /**
   * 모든 법안 목록 조회 (관리자용)
   */
  async getAllBills(page: number = 0, size: number = 100): Promise<ApiResponse<PagedResponse<BillItem>>> {
    const response = await axiosInstance.get('/admin/bills', {
        params: { page, size },
      });
      return response.data;
  }

  /**
   * 승인 대기 중인 법안 목록 조회 (관리자용)
   */
  async getPendingBills(page: number = 0, size: number = 100): Promise<ApiResponse<PagedResponse<BillItem>>> {
    const response = await axiosInstance.get('/admin/bills/pending', {
        params: { page, size },
      });
      return response.data;
  }

  /**
   * 승인된 법안 목록 조회 (관리자용)
   */
  async getApprovedBillsAdmin(page: number = 0, size: number = 100): Promise<ApiResponse<PagedResponse<BillItem>>> {
    const response = await axiosInstance.get('/admin/bills/approved', {
        params: { page, size },
      });
      return response.data;
  }

  /**
   * 거부된 법안 목록 조회 (관리자용)
   */
  async getRejectedBills(page: number = 0, size: number = 100): Promise<ApiResponse<PagedResponse<BillItem>>> {
    const response = await axiosInstance.get('/admin/bills/rejected', {
        params: { page, size },
      });
      return response.data;
  }


  /**
   * 법안 생성 (관리자용)
   */
  async createBill(billData: BillCreateDto): Promise<ApiResponse<BillItem>> {
    const response = await axiosInstance.post('/admin/bills', billData);
      return response.data;
  }

  /**
   * 법안 수정 (관리자용)
   */
  async updateBill(billId: number, billData: BillCreateDto): Promise<ApiResponse<BillItem>> {
    const response = await axiosInstance.put(`/admin/bills/${billId}`, billData);
      return response.data;
  }

  /**
   * 법안 승인 상태 변경 (관리자용)
   */
  async setBillApprovalStatus(billId: number, status: ApprovalStatus, priorityCategory?: PriorityCategory): Promise<ApiResponse<BillItem>> {
    const response = await axiosInstance.post(`/admin/bills/${billId}/status`, { status, priorityCategory });
      return response.data;
  }

  /**
   * 법안 주요 설정 토글 (관리자용)
   */
  async toggleBillFeatured(billId: number): Promise<ApiResponse<BillItem>> {
    const response = await axiosInstance.post(`/admin/bills/${billId}/toggle-featured`, {});
      return response.data;
  }

  /**
   * 법안 삭제 (관리자용)
   */
  async deleteBill(billId: number): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete(`/admin/bills/${billId}`);
      return response.data;
  }

    /**
     * AI 분석 요청
     */
    async requestAiAnalysis(billId: number): Promise<ApiResponse<any>> {
        const response = await axiosInstance.post(`/admin/bills/${billId}/analyze`);
        return response.data;
    }


  /**
   * 법안 검색 (관리자용)
   */
  async searchBills(keyword: string, page: number = 0, size: number = 20): Promise<ApiResponse<PagedResponse<BillItem>>> {
    const response = await axiosInstance.get('/admin/bills/search', {
        params: { keyword, page, size }
      });
      return response.data;
  }

  /**
   * 법안 크롤링 트리거 (관리자용)
   */
  async triggerBillCrawl(): Promise<ApiResponse<string>> {
    const response = await axiosInstance.post('/admin/bills/crawl', {});
    return response.data;
  }
}

// 싱글톤 인스턴스 export
export const billApi = new BillApi();