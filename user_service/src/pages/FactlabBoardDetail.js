import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Board.css';

const FactlabBoardDetail = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [sortType, setSortType] = useState('latest');
  const [searchType, setSearchType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(3);
  const [boardInfo, setBoardInfo] = useState({});
  const [posts, setPosts] = useState([]);

  // 게시판 정보
  const boardData = {
    1: { title: '정치토론', desc: '정치 관련 이슈와 정책에 대해 토론하는 공간입니다.', postCount: 1234, todayCount: 45 },
    2: { title: '정책분석', desc: '정부 정책의 효과와 문제점을 분석합니다.', postCount: 567, todayCount: 12 },
    3: { title: '사회이슈', desc: '사회 전반의 이슈와 현상에 대해 논의합니다.', postCount: 987, todayCount: 33 },
    4: { title: '교육문제', desc: '교육 정책과 제도에 대한 토론 공간입니다.', postCount: 456, todayCount: 18 },
    5: { title: '경제뉴스', desc: '경제 동향과 시장 분석 정보를 공유합니다.', postCount: 756, todayCount: 29 }
  };

  const postsData = [
    {
      id: 'notice1',
      type: 'notice',
      title: '📢 게시판 이용 규칙 안내',
      author: '관리자',
      views: 1245,
      date: '2024-07-01',
      comments: 0
    },
    {
      id: 1234,
      type: 'hot',
      title: '새로운 정부 정책에 대한 여러분의 의견은?',
      author: '정치관심러',
      views: 2156,
      date: '07-09 14:23',
      comments: 67
    },
    {
      id: 1233,
      type: 'new',
      title: '오늘 발표된 경제 정책 분석해보겠습니다',
      author: '경제분석가',
      views: 892,
      date: '07-09 13:45',
      comments: 23
    },
    {
      id: 1232,
      type: 'normal',
      title: '선거제도 개편안에 대한 토론',
      author: '민주주의자',
      views: 3427,
      date: '07-09 12:18',
      comments: 156
    },
    {
      id: 1231,
      type: 'hot',
      title: '지방자치단체 예산 편성 방향에 대해',
      author: '시민1234',
      views: 1756,
      date: '07-09 11:32',
      comments: 89
    },
    {
      id: 1230,
      type: 'normal',
      title: '외교 정책의 변화가 미치는 영향',
      author: '외교전문가',
      views: 654,
      date: '07-09 10:45',
      comments: 34
    },
    {
      id: 1229,
      type: 'normal',
      title: '국정감사 결과에 대한 시민들의 반응',
      author: '국감지켜보기',
      views: 1234,
      date: '07-09 09:15',
      comments: 78
    },
    {
      id: 1228,
      type: 'new',
      title: '정당 개편 논의 현황 정리',
      author: '정치분석러',
      views: 432,
      date: '07-09 08:30',
      comments: 12
    },
    {
      id: 1227,
      type: 'normal',
      title: '청년 정책의 실효성에 대한 의견',
      author: '청년대표',
      views: 876,
      date: '07-08 22:45',
      comments: 45
    },
    {
      id: 1226,
      type: 'normal',
      title: '국회 의정활동 모니터링 결과',
      author: '시민감시단',
      views: 1098,
      date: '07-08 21:12',
      comments: 67
    },
    {
      id: 1225,
      type: 'normal',
      title: '시민참여 예산제도 개선 방안',
      author: '예산지킴이',
      views: 567,
      date: '07-08 19:45',
      comments: 23
    }
  ];

  const sortOptions = [
    { key: 'latest', label: '최신순' },
    { key: 'popular', label: '인기순' },
    { key: 'comments', label: '댓글순' },
    { key: 'views', label: '조회순' }
  ];

  useEffect(() => {
    const board = boardData[boardId] || boardData[1];
    setBoardInfo(board);
    setPosts(postsData);
  }, [boardId]);

  const handleSortClick = (sortKey) => {
    setSortType(sortKey);
    // 실제로는 API 호출하여 정렬된 데이터 로드
    alert(`${sortOptions.find(opt => opt.key === sortKey).label}로 정렬합니다.`);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      alert('검색어를 입력하세요.');
      return;
    }
    // 실제로는 API 호출하여 검색 결과 로드
    alert(`${searchTerm}로 검색합니다.`);
  };

  const handlePageClick = (page) => {
    if (typeof page === 'number') {
      setCurrentPage(page);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/board/${boardId}/post/${postId}`);
  };

  const handleWriteClick = () => {
    navigate('/board/write');
  };

  const handleListClick = () => {
    navigate('/board');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const renderPostIcon = (type) => {
    switch (type) {
      case 'hot':
        return <span className="hot-icon">🔥</span>;
      case 'new':
        return <span className="new-icon">🆕</span>;
      default:
        return null;
    }
  };

  const renderPostNumber = (post, index) => {
    if (post.type === 'notice') {
      return '공지';
    }
    return post.id;
  };

  return (
    <div className="factlab-board-detail">
      <Header />
      
      <div className="board-container">
        {/* Board Header */}
        <div className="board-header">
          <div className="board-title">{boardInfo.title}</div>
          <div className="board-info">
            <span>{boardInfo.desc}</span>
            <span>총 {boardInfo.postCount?.toLocaleString()}개 글 | 오늘 +{boardInfo.todayCount}개</span>
          </div>
        </div>
        
        {/* Control Area */}
        <div className="control-area">
          <div className="sort-options">
            {sortOptions.map(option => (
              <a 
                key={option.key}
                href="#" 
                className={`sort-btn ${sortType === option.key ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSortClick(option.key);
                }}
              >
                {option.label}
              </a>
            ))}
          </div>
          
          <div className="search-form">
            <select 
              className="search-select"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="title">제목</option>
              <option value="content">내용</option>
              <option value="author">작성자</option>
            </select>
            <input 
              type="text" 
              className="search-input" 
              placeholder="검색어"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="btn" onClick={handleSearch}>검색</button>
          </div>
        </div>
        
        {/* Post List */}
        <table className="post-list">
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
            {posts.map((post, index) => (
              <tr 
                key={post.id}
                className={post.type === 'notice' ? 'notice-row' : ''}
                onClick={() => handlePostClick(post.id)}
                style={{ cursor: 'pointer' }}
              >
                <td>{renderPostNumber(post, index)}</td>
                <td className="title-cell">
                  {renderPostIcon(post.type)}
                  <a 
                    href="#" 
                    className="post-title"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePostClick(post.id);
                    }}
                  >
                    {post.title}
                  </a>
                  {post.comments > 0 && (
                    <span className="comment-count">[{post.comments}]</span>
                  )}
                </td>
                <td className="author-cell">{post.author}</td>
                <td>{post.views.toLocaleString()}</td>
                <td className="date-cell">{post.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="pagination">
          <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick('first'); }}>처음</a>
          <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick('prev'); }}>이전</a>
          <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick(1); }}>1</a>
          <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick(2); }}>2</a>
          <a href="#" className={`page-btn ${currentPage === 3 ? 'current' : ''}`} onClick={(e) => { e.preventDefault(); handlePageClick(3); }}>3</a>
          <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick(4); }}>4</a>
          <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick(5); }}>5</a>
          <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick('next'); }}>다음</a>
          <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick('last'); }}>끝</a>
        </div>
        
        {/* Write Area */}
        <div className="write-area">
          <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); handleWriteClick(); }}>글쓰기</a>
          <a href="#" className="btn" onClick={(e) => { e.preventDefault(); handleListClick(); }}>목록</a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FactlabBoardDetail;