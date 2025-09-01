import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Common.css';
import '../styles/Notice.css';
import { noticeApi } from '../services/noticeApi';

// 샘플 공지사항 데이터
const sampleNotices = [
  {
    id: 1,
    type: 'important',
    category: 'important',
    title: '서비스 이용약관 및 개인정보처리방침 개정 안내',
    author: '관리자',
    views: 1247,
    date: '2024-12-30',
    isImportant: true,
    isNew: true
  },
  {
    id: 2,
    type: 'important',
    category: 'important',
    title: '2025년 신년 서비스 업데이트 안내',
    author: '관리자',
    views: 892,
    date: '2024-12-28',
    isImportant: true,
    isNew: true
  },
  {
    id: 3,
    type: 'general',
    category: 'general',
    title: '커뮤니티 운영정책 변경 안내',
    author: '운영팀',
    views: 456,
    date: '2024-12-25',
    isImportant: false,
    isNew: false
  },
  {
    id: 4,
    type: 'general',
    category: 'general',
    title: '정기 점검 일정 안내',
    author: '기술팀',
    views: 234,
    date: '2024-12-22',
    isImportant: false,
    isNew: false
  }
];

// NEW 아이콘 표시 여부 (3일 이내)
const isNewNotice = (date) => {
  const today = new Date();
  const noticeDate = new Date(date);
  const diffTime = today - noticeDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3;
};

const FactlabNotice = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchType, setSearchType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadNotices(1);
  }, []);

  const loadNotices = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const backendPage = page - 1; // 백엔드는 0부터 시작
      const response = await noticeApi.getActiveNotices(backendPage, ITEMS_PER_PAGE);

      if (response && response.content) {
        // 백엔드에서 PostResponseDto 형태로 오는 데이터를 공지사항 형태로 변환
        const transformedNotices = response.content.map(notice => ({
          id: notice.id,
          type: notice.isNotice ? 'important' : 'general',
          category: 'important',
          title: notice.title,
          author: notice.authorName || notice.user?.nickname || '관리자',
          views: notice.viewCount || 0,
          date: notice.createdAt ? notice.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          isImportant: notice.isNotice,
          isNew: isNewNotice(notice.createdAt)
        }));

        setNotices(transformedNotices);
        setTotalCount(response.totalElements || transformedNotices.length);
        setTotalPages(response.totalPages || Math.ceil((response.totalElements || transformedNotices.length) / ITEMS_PER_PAGE));
        setCurrentPage(page);
      } else {
        setNotices([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('공지사항 로드 실패:', err);
      setError('공지사항을 불러오는데 실패했습니다.');

      // API 실패 시 샘플 데이터 사용
      setNotices(sampleNotices);
      setTotalCount(sampleNotices.length);
      setTotalPages(Math.ceil(sampleNotices.length / ITEMS_PER_PAGE));
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별 필터링 (useMemo 사용하거나 직접 계산)
  let filteredNotices = notices;

  // 카테고리 필터
  if (activeCategory !== 'all') {
    if (activeCategory === 'important') {
      filteredNotices = filteredNotices.filter(notice => notice.isImportant);
    } else {
      filteredNotices = filteredNotices.filter(notice => !notice.isImportant && notice.category === activeCategory);
    }
  }

  // 검색 필터
  if (searchTerm) {
    filteredNotices = filteredNotices.filter(notice => {
      const title = notice.title.toLowerCase();
      const term = searchTerm.toLowerCase();

      if (searchType === 'all' || searchType === 'title' || searchType === 'content') {
        return title.includes(term);
      }
      return false;
    });
  }

  // 빈 상태 확인
  const isEmpty = filteredNotices.length === 0;

  // 카테고리 변경
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  // 검색
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      alert('검색어를 입력하세요.');
      return;
    }
    setCurrentPage(1);
  };

  // 엔터키 검색
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 페이지 변경 함수
  const changePage = async (page) => {
    if (page < 1 || page > totalPages || page === currentPage || loading) return;

    await loadNotices(page);

    // 페이지 변경 시 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 공지사항 타입별 스타일
  const getTypeClassName = (type) => {
    switch (type) {
      case 'important': return 'news-notice-type important';
      case 'event': return 'news-notice-type event';
      case 'update': return 'news-notice-type update';
      case 'maintenance': return 'news-notice-type';
      default: return 'news-notice-type';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'important': return '중요';
      case 'event': return '이벤트';
      case 'update': return '업데이트';
      case 'maintenance': return '점검';
      default: return '일반';
    }
  };

  // isNewNotice 함수는 컴포넌트 외부에서 정의됨

  return (
    <>
      <Header />
      <div className="main-top-banner-ad">
        🎯 상단 배너 광고 영역 (1200px x 90px)
      </div>
      <div className="main-container">
        {/* 좌측 광고 */}
        <div className="main-side-ad">
          
        </div>
        {/* 메인 컨텐츠 */}
        <div className="main-content">
          <div className="news-notice-container">
            {/* Page Header */}
            <div className="news-notice-page-header">
              <div className="news-notice-page-title">📢 공지사항</div>
              <div className="news-notice-stats">총 {totalCount}개 공지사항</div>
            </div>

            {/* Category Tabs */}
            <div className="news-notice-category-tabs">
              {[
                { key: 'all', label: '전체' },
                { key: 'important', label: '중요' },
                { key: 'update', label: '업데이트' },
                { key: 'event', label: '이벤트' },
                { key: 'maintenance', label: '점검' }
              ].map(tab => (
                <div
                  key={tab.key}
                  className={`news-notice-category-tab ${activeCategory === tab.key ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(tab.key)}
                >
                  {tab.label}
                </div>
              ))}
            </div>

            {/* Search Area */}
            <div className="news-notice-search-area">
              <div className="news-notice-search-form">
                <select
                  className="news-notice-search-select"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <option value="all">전체</option>
                  <option value="title">제목</option>
                  <option value="content">내용</option>
                </select>
                <input
                  type="text"
                  className="news-notice-search-input"
                  placeholder="검색어 입력"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button className="news-btn" onClick={handleSearch}>검색</button>
              </div>
            </div>

            {/* Notice List */}
            {loading ? (
              <div className="loading" style={{ textAlign: 'center', padding: '50px 0' }}>
                공지사항을 불러오는 중...
              </div>
            ) : error ? (
              <div className="error" style={{ textAlign: 'center', padding: '50px 0', color: 'red' }}>
                {error}
              </div>
            ) : (
              <table className="news-notice-list">
                <thead>
                  <tr>
                    <th width="80">번호</th>
                    <th>제목</th>
                    <th width="100">작성자</th>
                    <th width="80">조회</th>
                    <th width="120">작성일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotices.map((notice) => (
                    <tr
                      key={notice.id}
                      className={notice.isImportant ? 'news-notice-important-row' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        // 공지사항 상세 페이지로 이동
                        window.location.href = `/notice/${notice.id}`;
                      }}
                    >
                      <td>{notice.isImportant ? '공지' : notice.id}</td>
                      <td className="news-notice-title-cell">
                        <span className={getTypeClassName(notice.type)}>
                          {getTypeText(notice.type)}
                        </span>
                        <span className="news-notice-title">
                          {notice.title}
                        </span>
                        {(notice.isNew || isNewNotice(notice.date)) && (
                          <span className="news-notice-new-icon">NEW</span>
                        )}
                      </td>
                      <td>관리자</td>
                      <td>{notice.views ? notice.views.toLocaleString() : 0}</td>
                      <td>{new Date(notice.date).toLocaleDateString('ko-KR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Empty State */}
            {!loading && !error && isEmpty && (
              <div className="news-notice-empty-state">
                <p>검색 결과가 없습니다.</p>
                <p>다른 검색어 또는 필터 조건을 시도해보세요.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="news-notice-pagination">
                {/* 맨 처음 버튼 */}
                <button
                  className="news-notice-page-btn"
                  onClick={() => changePage(1)}
                  disabled={currentPage === 1 || loading}
                >
                  처음
                </button>

                {/* 이전 버튼 */}
                <button
                  className="news-notice-page-btn"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  이전
                </button>

                {/* 페이지 번호들 */}
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                  const startPage = Math.max(1, Math.min(currentPage - 5, totalPages - 9));
                  const pageNum = startPage + i;
                  if (pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      className={`news-notice-page-btn ${pageNum === currentPage ? 'current' : ''}`}
                      onClick={() => changePage(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* 다음 버튼 */}
                <button
                  className="news-notice-page-btn"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  다음
                </button>

                {/* 맨 끝 버튼 */}
                <button
                  className="news-notice-page-btn"
                  onClick={() => changePage(totalPages)}
                  disabled={currentPage === totalPages || loading}
                >
                  끝
                </button>
              </div>
            )}
          </div>
        </div>
        {/* 우측 광고 */}
        <div className="main-side-ad">
          
        </div>
      </div>

      <Footer />
    </>
  );
};

export default FactlabNotice;