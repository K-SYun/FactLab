import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/AdminCommon.css';
import '../styles/NoticeManagement.css';
import { noticeApi, NoticeResponse } from '../api/noticeApi';
import { formatToKST } from '../utils/dateFormatter';

type Notice = NoticeResponse & {
  category?: 'ALL' | 'IMPORTANT' | 'UPDATE' | 'EVENT';
};

const NoticeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadNoticeDetail();
    }
  }, [id]);

  const loadNoticeDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await noticeApi.getNotice(Number(id));
      if (response.success && response.data) {
        setNotice(response.data);
      } else {
        setError('공지사항을 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('공지사항 상세 로드 실패:', err);
      setError('공지사항을 불러오는데 실패했습니다.');
      
      // API 연결 실패 시 에러 상태 유지
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels = {
    ALL: { label: '전체', color: 'info' },
    IMPORTANT: { label: '중요', color: 'danger' },
    UPDATE: { label: '업데이트', color: 'primary' },
    EVENT: { label: '이벤트', color: 'success' }
  };

  const getCategoryInfo = (category?: string) => {
    return categoryLabels[category as keyof typeof categoryLabels] || categoryLabels.ALL;
  };

  if (loading) {
    return (
      <div className="notice-detail">
        <div className="admin-loading">공지사항을 불러오는 중...</div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="notice-detail">
        <div className="admin-card">
          <div className="admin-error-message">
            <h3>오류가 발생했습니다</h3>
            <p>{error || '공지사항을 찾을 수 없습니다.'}</p>
            <button 
              className="admin-btn admin-btn-primary"
              onClick={() => navigate('/notices')}
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(notice.category);

  return (
    <div className="notice-detail">
      <div className="admin-header-section">
        <div className="admin-header-content">
          <h1 className="admin-title">공지사항 상세</h1>
          <p className="admin-subtitle">공지사항 내용을 확인하고 관리할 수 있습니다.</p>
        </div>
        <div className="admin-actions">
          <button 
            className="admin-btn admin-btn-secondary"
            onClick={() => navigate('/notices')}
          >
            ← 목록으로
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="notice-detail-header">
          <div className="notice-detail-meta">
            <span className={`admin-badge admin-badge-${categoryInfo.color}`}>
              {categoryInfo.label}
            </span>
            {notice.isPinned && (
              <span className="admin-badge admin-badge-warning">📌 고정</span>
            )}
            <span className={`admin-badge ${notice.isActive ? 'admin-badge-success' : 'admin-badge-secondary'}`}>
              {notice.isActive ? '활성' : '비활성'}
            </span>
          </div>
          
          <h1 className="notice-detail-title">{notice.title}</h1>
          
          <div className="notice-detail-info">
            <div className="detail-info-item">
              <span className="info-label">작성자:</span>
              <span className="info-value">{notice.authorName}</span>
            </div>
            <div className="detail-info-item">
              <span className="info-label">작성일:</span>
              <span className="info-value">{formatToKST(notice.createdAt)}</span>
            </div>
            {notice.updatedAt !== notice.createdAt && (
              <div className="detail-info-item">
                <span className="info-label">수정일:</span>
                <span className="info-value">{formatToKST(notice.updatedAt)}</span>
              </div>
            )}
            <div className="detail-info-item">
              <span className="info-label">조회수:</span>
              <span className="info-value">{notice.viewCount?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        <div className="notice-detail-content">
          <div className="content-body" dangerouslySetInnerHTML={{ __html: notice.content }} />
        </div>

        <div className="notice-detail-actions">
          <button 
            className="admin-btn admin-btn-secondary"
            onClick={() => navigate('/notices')}
          >
            목록으로
          </button>
          <button 
            className="admin-btn admin-btn-primary"
            onClick={() => navigate(`/notices/${notice.id}/edit`)}
          >
            수정하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetail;
