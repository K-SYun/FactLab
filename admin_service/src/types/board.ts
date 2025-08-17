export interface Board {
  id: number;
  name: string;
  description: string;
  category: string;
  categoryId?: number;
  categoryName?: string;
  isActive: boolean;
  displayOrder: number;
  allowAnonymous: boolean;
  requireApproval: boolean;
  postCount: number;
  lastPostAt: string | null;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardCreateRequest {
  name: string;
  description: string;
  category: string;
  categoryId?: number;
  displayOrder: number;
  allowAnonymous: boolean;
  requireApproval: boolean;
}

export interface BoardUpdateRequest {
  name: string;
  description: string;
  category: string;
  categoryId?: number;
  displayOrder: number;
  allowAnonymous: boolean;
  requireApproval: boolean;
}

export interface BoardApiResponse {
  success: boolean;
  data?: Board | Board[];
  message: string;
}

export const BOARD_CATEGORIES = [
  // Lab실 
  { value: 'Best', label: 'Best', category: 'Lab실' },
  { value: '자유Lab', label: '자유Lab', category: 'Lab실' },
  { value: '정치Lab', label: '정치Lab', category: 'Lab실' },
  { value: '경제Lab', label: '경제Lab', category: 'Lab실' },
  { value: '사회Lab', label: '사회Lab', category: 'Lab실' },
  
  // 취미
  { value: '골프', label: '골프', category: '취미' },
  { value: '낚시', label: '낚시', category: '취미' },
  { value: '축구', label: '축구', category: '취미' },
  { value: '야구', label: '야구', category: '취미' },
  { value: '등산', label: '등산', category: '취미' },
  { value: '건강/헬스', label: '건강/헬스', category: '취미' },
  { value: '여행', label: '여행', category: '취미' },
  { value: '게임', label: '게임', category: '취미' },
  { value: '영화', label: '영화', category: '취미' },
  
  // 먹고살기
  { value: '주식(국장)', label: '주식(국장)', category: '먹고살기' },
  { value: '주식(미장/기타)', label: '주식(미장/기타)', category: '먹고살기' },
  { value: '가상화폐', label: '가상화폐', category: '먹고살기' },
  { value: '자동차', label: '자동차', category: '먹고살기' },
  { value: '부동산', label: '부동산', category: '먹고살기' },
  { value: '육아', label: '육아', category: '먹고살기' },
  
  // 갤러리
  { value: '그림', label: '그림', category: '갤러리' },
  { value: '사진', label: '사진', category: '갤러리' },
  { value: '바탕화면', label: '바탕화면', category: '갤러리' },
  { value: 'AI이미지', label: 'AI이미지', category: '갤러리' },
  { value: '애들은가라(성인)', label: '애들은가라(성인)', category: '갤러리' }
] as const;

export interface BoardCategory {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  boardCount: number;
  createdAt: string;
  updatedAt: string;
}
