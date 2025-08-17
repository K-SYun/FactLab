export interface NewsItem {
  id: number;
  title: string;
  content: string;
  url: string;
  source: string;
  publisher: string;
  category: string;
  publishDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  aiSummary: string;
  aiKeywords: string[];
  reliabilityScore: number;
  confidenceScore: number;
  aiAnalysisResult: {
    summary: string;
    keywords: string[];
    sentiment: string;
    factCheck: string;
    reliability: number;
  };
  comments: number;
  votes: { fact: number; doubt: number };
  createdAt: string;
  updatedAt: string;
  rejectReason?: string;
}

export type TabType = 'all' | 'pending' | 'approved' | 'rejected';

export interface NewsFilters {
  search: string;
  category: string;
  source: string;
  minReliability: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface NewsState {
  selectedTab: TabType;
  selectedNews: NewsItem | null;
  newsItems: NewsItem[];
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  selectedNewsIds: number[];
  isSelectMode: boolean;
  filters: NewsFilters;
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}