export interface Popup {
  id: number;
  title: string;
  content: string;
  linkUrl?: string;
  linkText?: string;
  startDate: string;
  endDate: string;
  position: 'center' | 'custom';
  positionX?: number;
  positionY?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface PopupCreateRequest {
  title: string;
  content: string;
  linkUrl?: string;
  linkText?: string;
  startDate: string;
  endDate: string;
  position: 'center' | 'custom';
  positionX?: number;
  positionY?: number;
  active?: boolean;
}

export interface PopupStats {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  displayingCount: number;
}