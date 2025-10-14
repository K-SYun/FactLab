import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Common.css';
import '../styles/Notice.css';
import { noticeApi } from '../services/noticeApi';
import { formatToKST } from '../utils/dateFormatter';

const FactlabNoticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadNoticeDetail();
    }
  }, [id]);

  const loadNoticeDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await noticeApi.getNotice(id);
      setNotice(response);
    } catch (err) {
      console.error('공지사항 상세 로드 실패:', err);
      setError('공지사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="main-top-banner-ad">
          🎯 상단 배너 광고 영역 (1200px x 90px)
        </div>
        <div className="main-container">
          <div className="main-side-ad">
            
          </div>
          <div className="main-content">
            <div className="loading" style={{ textAlign: 'center', padding: '100px 0' }}>
              공지사항을 불러오는 중...
            </div>
          </div>
          <div className="main-side-ad">
            
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !notice) {
    return (
      <>
        <Header />
        <div className="main-top-banner-ad">
          🎯 상단 배너 광고 영역 (1200px x 90px)
        </div>
        <div className="main-container">
          <div className="main-side-ad">
            
          </div>
          <div className="main-content">
            <div className="error" style={{ textAlign: 'center', padding: '100px 0' }}>
              <h2>오류가 발생했습니다</h2>
              <p>{error || '공지사항을 찾을 수 없습니다.'}</p>
              <button 
                onClick={() => navigate('/notice')} 
                className="news-btn"
                style={{ marginTop: '20px' }}
              >
                공지사항 목록으로
              </button>
            </div>
          </div>
          <div className="main-side-ad">
            
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="main-top-banner-ad">
        🎯 상단 배너 광고 영역 (1200px x 90px)
      </div>
      <div className="main-container">
        <div className="main-side-ad">
          
        </div>
        <div className="main-content">
          <div className="news-notice-detail-container">
            <div className="news-notice-detail-header">
              <div className="news-notice-detail-category">
                <span className="news-notice-type important">공지</span>
              </div>
              <h1 className="news-notice-detail-title">{notice.title}</h1>
              <div className="news-notice-detail-meta">
                <span>작성자: 관리자</span>
                <span>작성일: {formatToKST(notice.createdAt)}</span>
                <span>조회수: {(notice.viewCount || 0).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="news-notice-detail-content">
              <div dangerouslySetInnerHTML={{ __html: notice.content.replace(/\n/g, '<br>') }} />
            </div>
            
            <div className="news-notice-detail-actions">
              <button 
                onClick={() => navigate('/notice')} 
                className="news-btn"
              >
                목록으로
              </button>
            </div>
          </div>
        </div>
        <div className="main-side-ad">
          
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FactlabNoticeDetail;