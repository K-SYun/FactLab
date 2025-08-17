// News 상태 및 카테고리 라벨 정의
export const NEWS_STATUS_LABELS = {
  // 소문자 상태값 (백엔드에서 받는 실제 값)
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거부됨',
  draft: '임시저장',
  ai_completed: 'AI 분석완료',
  review_pending: '검토 대기',
  processing: '처리 중',
  
  // 대문자 상태값 (호환성)
  PENDING: '승인 대기',
  APPROVED: '승인됨',
  REJECTED: '거부됨',
  DRAFT: '임시저장',
  AI_COMPLETED: 'AI 분석완료',
  REVIEW_PENDING: '검토 대기',
  PROCESSING: '처리 중'
} as const;

export const NEWS_CATEGORY_LABELS = {
  politics: '정치',
  economy: '경제',
  society: '사회',
  culture: '문화',
  sports: '스포츠',
  international: '국제',
  technology: '기술/IT',
  science: '과학',
  health: '건강',
  environment: '환경',
  education: '교육',
  entertainment: '연예',
  opinion: '오피니언',
  others: '기타',
  
  // 영어 카테고리
  POLITICS: '정치',
  ECONOMY: '경제',
  SOCIETY: '사회',
  CULTURE: '문화',
  SPORTS: '스포츠',
  INTERNATIONAL: '국제',
  TECHNOLOGY: '기술/IT',
  SCIENCE: '과학',
  HEALTH: '건강',
  ENVIRONMENT: '환경',
  EDUCATION: '교육',
  ENTERTAINMENT: '연예',
  OPINION: '오피니언',
  OTHERS: '기타'
} as const;

// 상태값 타입 정의
export type NewsStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'draft' 
  | 'ai_completed' 
  | 'review_pending' 
  | 'processing';

export type NewsCategory = keyof typeof NEWS_CATEGORY_LABELS;
