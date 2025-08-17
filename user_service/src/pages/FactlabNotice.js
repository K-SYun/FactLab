import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Common.css';
import '../styles/Notice.css';

const FactlabNotice = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchType, setSearchType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 샘플 공지사항 데이터
  const [notices] = useState([
    {
      id: 1,
      type: 'important',
      category: 'important',
      title: 'FactLab 서비스 이용약관 개정 안내',
      author: '관리자',
      views: 1456,
      date: '2024-07-09',
      isImportant: true,
      isNew: true
    },
    {
      id: 2,
      type: 'important',
      category: 'important',
      title: '개인정보처리방침 변경 안내',
      author: '관리자',
      views: 987,
      date: '2024-07-08',
      isImportant: true,
      isNew: false
    },
    {
      id: 25,
      type: 'update',
      category: 'update',
      title: 'v2.1.3 업데이트 - 뉴스 투표 시스템 개선',
      author: '개발팀',
      views: 2134,
      date: '2024-07-09',
      isImportant: false,
      isNew: true
    },
    {
      id: 24,
      type: 'event',
      category: 'event',
      title: 'FactLab 오픈 기념 이벤트 - 레벨업 보상 2배!',
      author: '운영팀',
      views: 3567,
      date: '2024-07-08',
      isImportant: false,
      isNew: false
    },
    {
      id: 23,
      type: 'maintenance',
      category: 'maintenance',
      title: '정기 서버 점검 안내 (7월 10일 새벽 2시~4시)',
      author: '관리자',
      views: 1789,
      date: '2024-07-07',
      isImportant: false,
      isNew: false
    },
    {
      id: 22,
      type: 'update',
      category: 'update',
      title: '모바일 앱 베타 버전 출시 안내',
      author: '개발팀',
      views: 2456,
      date: '2024-07-06',
      isImportant: false,
      isNew: false
    },
    {
      id: 21,
      type: 'general',
      category: 'general',
      title: '커뮤니티 가이드라인 준수 협조 요청',
      author: '운영팀',
      views: 1234,
      date: '2024-07-05',
      isImportant: false,
      isNew: false
    },
    {
      id: 20,
      type: 'event',
      category: 'event',
      title: '베스트 팩트체커 선정 이벤트 결과 발표',
      author: '운영팀',
      views: 1678,
      date: '2024-07-04',
      isImportant: false,
      isNew: false
    }
  ]);

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

  // NEW 아이콘 표시 여부 (3일 이내)
  const isNewNotice = (date) => {
    const today = new Date();
    const noticeDate = new Date(date);
    const diffTime = today - noticeDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  return (
    <>
      <Header />
      <div className="main-top-banner-ad">
        🎯 상단 배너 광고 영역 (1200px x 90px)
      </div>
      <div className="news-notice-container">
        {/* 좌측 광고 */}
        <div className="main-side-ad">
          📢<br />좌측<br />광고<br />영역<br />(160px)
        </div>
        {/* Page Header */}
        <div className="news-notice-page-header">
          <div className="news-notice-page-title">📢 공지사항</div>
          <div className="news-notice-stats">총 {notices.length}개 공지사항</div>
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
        <table className="news-notice-list">
          <thead>
            <tr>
              <th width="60">번호</th>
              <th>제목</th>
              <th width="80">작성자</th>
              <th width="60">조회</th>
              <th width="80">작성일</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotices.map((notice) => (
              <tr
                key={notice.id}
                className={notice.isImportant ? 'news-notice-important-row' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  // 실제 구현에서는 공지사항 상세 페이지로 이동
                  console.log(`공지사항 ${notice.id} 상세 보기`);
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
                <td>{notice.author}</td>
                <td>{notice.views.toLocaleString()}</td>
                <td>{notice.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Empty State */}
        {isEmpty && (
          <div className="news-notice-empty-state">
            <p>검색 결과가 없습니다.</p>
            <p>다른 검색어 또는 필터 조건을 시도해보세요.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="news-notice-pagination">
          <button className="news-notice-page-btn">처음</button>
          <button className="news-notice-page-btn">이전</button>
          <button className="news-notice-page-btn current">1</button>
          <button className="news-notice-page-btn">2</button>
          <button className="news-notice-page-btn">3</button>
          <button className="news-notice-page-btn">4</button>
          <button className="news-notice-page-btn">5</button>
          <button className="news-notice-page-btn">다음</button>
          <button className="news-notice-page-btn">끝</button>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default FactlabNotice;