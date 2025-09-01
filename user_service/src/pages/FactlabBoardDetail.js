import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { boardService } from '../services/boardApi';
import '../styles/Board.css';

const FactlabBoardDetail = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [sortType, setSortType] = useState('latest');
  const [searchType, setSearchType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [boardInfo, setBoardInfo] = useState({});
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const sortOptions = [
    { key: 'latest', label: '최신순' },
    { key: 'popular', label: '인기순' },
    { key: 'comments', label: '댓글순' },
    { key: 'views', label: '조회순' }
  ];

  // 게시판 정보 및 게시글 로드
  useEffect(() => {
    loadBoardInfo();
    loadPosts();
  }, [boardId, currentPage, sortType]);

  // 검색어 변경 시에만 재로드
  useEffect(() => {
    if (searchTerm) {
      loadPosts();
    }
  }, [searchTerm]);

  const loadBoardInfo = async () => {
    try {
      const response = await boardService.getBoardById(boardId);
      if (response.data.success) {
        setBoardInfo(response.data.data);
      } else {
        // 게시판 정보가 없으면 기본값 설정
        setBoardInfo({
          name: '게시판',
          description: '게시판 설명을 불러올 수 없습니다.',
          postCount: 0
        });
      }
    } catch (error) {
      console.error('게시판 정보 로드 실패:', error);
      setBoardInfo({
        name: '게시판',
        description: '게시판 설명을 불러올 수 없습니다.',
        postCount: 0
      });
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (searchTerm) {
        // 검색 모드
        response = await boardService.searchPosts(boardId, searchTerm, currentPage, 20);
      } else if (sortType === 'popular') {
        // 인기순 정렬
        response = await boardService.getPopularPosts(boardId, currentPage, 20);
      } else {
        // 기본 목록 (최신순, 공지사항 포함)
        response = await boardService.getBoardPosts(boardId, currentPage, 20);
      }
      
      if (response.data.success) {
        const data = response.data.data;
        setPosts(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else {
        setError(response.data.error || '게시글을 불러오는데 실패했습니다.');
        setPosts([]);
      }
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      setError('게시글을 불러오는데 실패했습니다.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSortClick = (sortKey) => {
    setSortType(sortKey);
    setCurrentPage(0);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      alert('검색어를 입력하세요.');
      return;
    }
    setCurrentPage(0);
    loadPosts();
  };

  const handlePageClick = (page) => {
    if (typeof page === 'number' && page >= 0 && page < totalPages) {
      setCurrentPage(page);
    } else if (page === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (page === 'next' && currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else if (page === 'first') {
      setCurrentPage(0);
    } else if (page === 'last') {
      setCurrentPage(Math.max(0, totalPages - 1));
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

  const renderPostIcon = (post) => {
    if (post.isNotice) {
      return <span className="notice-icon">📢</span>;
    }
    if (post.likeCount > 10) {
      return <span className="hot-icon">🔥</span>;
    }
    return null;
  };

  const renderPostNumber = (post, index) => {
    if (post.isNotice) {
      return '공지';
    }
    // 페이지별로 번호 계산
    return totalElements - (currentPage * 20) - index;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // 오늘이면 시간만 표시
      return date.toTimeString().slice(0, 5);
    } else if (diffDays < 7) {
      // 일주일 내이면 MM-DD 형식
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}-${day}`;
    } else {
      // 일주일 이상이면 YYYY-MM-DD 형식
      return date.toISOString().split('T')[0];
    }
  };

  const renderPagination = () => {
    const pages = [];
    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <a 
          key={i}
          href="#" 
          className={`page-btn ${currentPage === i ? 'current' : ''}`} 
          onClick={(e) => { 
            e.preventDefault(); 
            handlePageClick(i); 
          }}
        >
          {i + 1}
        </a>
      );
    }
    
    return pages;
  };

  return (
    <div className="factlab-board-detail">
      <Header />
      
      <div className="board-container">
        {/* Board Header */}
        <div className="board-header">
          <div className="board-title">{boardInfo.name || '게시판'}</div>
          <div className="board-info">
            <span>{boardInfo.description || '게시판 설명'}</span>
            <span>총 {(boardInfo.postCount || totalElements || 0).toLocaleString()}개 글</span>
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
        
        {/* Error Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Loading Display */}
        {loading ? (
          <div className="loading-message">
            게시글을 불러오는 중...
          </div>
        ) : (
          <>
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
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '50px' }}>
                      등록된 게시글이 없습니다.
                    </td>
                  </tr>
                ) : (
                  posts.map((post, index) => (
                    <tr 
                      key={post.id}
                      className={post.isNotice ? 'notice-row' : ''}
                      onClick={() => handlePostClick(post.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{renderPostNumber(post, index)}</td>
                      <td className="title-cell">
                        {renderPostIcon(post)}
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
                        {post.commentCount > 0 && (
                          <span className="comment-count">[{post.commentCount}]</span>
                        )}
                      </td>
                      <td className="author-cell">{post.author || '익명'}</td>
                      <td>{(post.viewCount || 0).toLocaleString()}</td>
                      <td className="date-cell">{formatDate(post.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick('first'); }}>처음</a>
                <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick('prev'); }}>이전</a>
                {renderPagination()}
                <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick('next'); }}>다음</a>
                <a href="#" className="page-btn" onClick={(e) => { e.preventDefault(); handlePageClick('last'); }}>끝</a>
              </div>
            )}
          </>
        )}
        
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