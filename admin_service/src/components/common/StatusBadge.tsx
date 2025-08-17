import React from 'react';

interface StatusBadgeProps {
  status: 'completed' | 'pending' | 'reviewing' | 'rejected' | 'processing' | 'failed' | 'cancelled' | 'scheduled' | 'retrying' | 'approved' | 'review_pending' | 'ai_completed' | 'draft';
  text?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const getStatusText = () => {
    if (text) return text;
    
    switch (status) {
      case 'completed': return '완료';
      case 'pending': return '대기중';
      case 'reviewing': return '처리중';
      case 'rejected': return '거부됨';
      case 'processing': return '처리중';
      case 'failed': return '실패';
      case 'cancelled': return '취소됨';
      case 'scheduled': return '스케줄됨';
      case 'retrying': return '재시도중';
      case 'approved': return '승인됨';
      case 'review_pending': return '검토 대기';
      case 'ai_completed': return 'AI 분석완료';
      case 'draft': return '임시저장';
      default: return '알 수 없음';
    }
  };

  return (
    <span className={`admin-status-badge ${status}`}>
      {getStatusText()}
    </span>
  );
};

export default StatusBadge;