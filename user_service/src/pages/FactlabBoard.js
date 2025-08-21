import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import boardService from '../services/boardService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Common.css';
import '../styles/Board.css';

const FactlabBoard = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 검색 관련 state
  const [searchType, setSearchType] = useState('title'); // title, content, author, titleAndContent
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortType, setSortType] = useState('latest'); // latest, oldest, views, likes

  useEffect(() => {
    if (boardId) {
      if (boardId === 'best') {
        loadBestBoardData();
        loadBestPosts();
      } else {
        loadBoardData();
        loadPosts();
      }
    }
  }, [boardId, currentPage, searchKeyword, searchType, sortType]);

  const loadBestBoardData = () => {
    // BEST 게시판은 가상 게시판이므로 고정 데이터 설정
    setBoard({
      id: 'best',
      name: 'BEST 게시판',
      description: '조회수 100 이상, 추천수 10 이상의 인기 게시글들을 모아놓은 게시판입니다.',
      category: '인기',
      isActive: true
    });
  };

  const loadBoardData = async () => {
    try {
      const response = await boardService.getBoard(boardId);
      if (response.success && response.data) {
        setBoard(response.data);
      } else {
        setError('게시판을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('게시판 정보 로드 실패:', error);
      setError('게시판 정보를 불러오는데 실패했습니다.');
    }
  };

  const loadBestPosts = async () => {
    try {
      setLoading(true);

      // BEST 게시판 기준: 조회수 ≥ 100, 추천수 ≥ 10, 갤러리 게시판 제외
      const response = await boardService.getBestPosts({
        page: currentPage,
        size: 20,
        minViewCount: 100,
        minLikeCount: 10,
        excludeBoards: ['gallery'], // 갤러리 하위 글 제외
        searchType: searchKeyword ? searchType : null,
        searchKeyword: searchKeyword || null,
        sortType: sortType
      });

      if (response.success && response.data) {
        setPosts(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('BEST 게시글 목록 로드 실패:', error);
      setPosts([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await boardService.getPosts(boardId, currentPage, 20, {
        searchType: searchKeyword ? searchType : null,
        searchKeyword: searchKeyword || null,
        sortType: sortType
      });
      if (response.success && response.data) {
        setPosts(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('게시글 목록 로드 실패:', error);
      setError('게시글을 불러오는데 실패했습니다.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/board/${boardId}/post/${postId}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 검색 실행
  const handleSearch = () => {
    setCurrentPage(0); // 검색 시 첫 페이지로
    // useEffect가 searchKeyword, searchType 변경을 감지하여 자동으로 재로드됨
  };

  // 검색 초기화
  const handleSearchReset = () => {
    setSearchKeyword('');
    setSearchType('title');
    setSortType('latest');
    setCurrentPage(0);
  };

  // Enter 키로 검색 실행
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: '2-digit',
        day: '2-digit'
      });
    }
  };

  if (error) {
    return (
      <>
        <Header />
        <div className="main-top-banner-ad">
          🎯 상단 배너 광고 영역 (1200px x 90px)
        </div>
        <div className="main-container">
          {/* 좌측 광고 */}
          <div className="main-side-ad">
            📢<br />좌측<br />광고<br />영역<br />(160px)
          </div>
          {/* 메인 컨텐츠 */}
          <div className="main-content">
            <div className="board-container">
              <div className="error-message">
                <h2>오류가 발생했습니다</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/')} className="board-btn board-btn-primary">
                  홈으로 돌아가기
                </button>
              </div>
            </div>
          </div>
          {/* 우측 광고 */}
          <div className="main-side-ad">
            📢<br />우측<br />광고<br />영역<br />(160px)
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
        {/* 좌측 광고 */}
        <div className="main-side-ad">
          📢<br />좌측<br />광고<br />영역<br />(160px)
        </div>
        {/* 메인 컨텐츠 */}
        <div className="main-content">
          <div className="board-container">
            {/* 게시판 헤더 */}
            <div className="board-header">
              <div className="board-title-description-row">
                <h1 className="board-page-title">
                  {board ? board.name : '게시판'}
                </h1>
                {board && board.description && (
                  <p className="board-description">{board.description}</p>
                )}
              </div>

              {/* 검색 영역 */}
              <div className="board-search-area">
                <div className="board-search-controls">
                  <div className="board-search-left">
                    <select
                      className="board-search-type"
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                    >
                      <option value="title">제목</option>
                      <option value="content">내용</option>
                      <option value="author">작성자</option>
                      <option value="titleAndContent">제목+내용</option>
                    </select>
                    <input
                      type="text"
                      className="board-search-input"
                      placeholder="검색어를 입력하세요"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                    />
                    <button
                      className="board-btn board-btn-primary board-search-btn"
                      onClick={handleSearch}
                    >
                      검색
                    </button>
                    <button
                      className="board-btn board-search-reset-btn"
                      onClick={handleSearchReset}
                    >
                      초기화
                    </button>
                  </div>
                  <div className="board-search-right">
                    <select
                      className="board-sort-type"
                      value={sortType}
                      onChange={(e) => setSortType(e.target.value)}
                    >
                      <option value="latest">최신순</option>
                      <option value="oldest">오래된순</option>
                      <option value="views">조회수순</option>
                      <option value="likes">추천수순</option>
                    </select>
                  </div>
                </div>

                {/* 검색 결과 정보 */}
                {searchKeyword && (
                  <div className="board-search-result-info">
                    <span className="board-search-keyword">'{searchKeyword}'</span> 검색 결과
                    <span className="board-search-count">{totalElements}건</span>
                  </div>
                )}
              </div>
            </div>

            {/* 게시글 목록 */}
            <div className="board-post-list">
              {loading ? (
                <div className="board-loading">게시글을 불러오는 중...</div>
              ) : posts.length > 0 ? (
                <>
                  <div className="board-post-table">
                    <div className="board-post-header">
                      <div className="board-post-col-no">{boardId === 'best' ? '구분' : 'No'}</div>
                      <div className="board-post-col-title">제목</div>
                      <div className="board-post-col-author">작성자</div>
                      <div className="board-post-col-date">작성일</div>
                      <div className="board-post-col-likes">추천</div>
                      <div className="board-post-col-views">조회</div>
                    </div>

                    {posts.map((post, index) => (
                      <div
                        key={post.id}
                        className={`board-post-row ${post.isNotice ? 'board-post-notice' : ''}`}
                        onClick={() => handlePostClick(post.id)}
                      >
                        <div className="board-post-col-no">
                          {boardId === 'best' ? (
                            post.boardName ? `[${post.boardName}]` : '-'
                          ) : (
                            // 일반 게시판은 역순으로 No 표시 (전체 게시글 수 - 현재 페이지 오프셋 - 현재 인덱스)
                            totalElements - (currentPage * 20) - index
                          )}
                        </div>
                        <div className="board-post-col-title">
                          {post.isNotice && <span className="board-notice-badge">공지</span>}
                          <span className="board-post-title">
                            {boardId === 'best' && post.boardName && (
                              <span className="board-name">[{post.boardName}] </span>
                            )}
                            {post.title}
                            {post.commentCount > 0 && (
                              <span className="board-comment-count"> [{post.commentCount}]</span>
                            )}
                          </span>
                        </div>
                        <div className="board-post-col-author">
                          {post.authorName}
                        </div>
                        <div className="board-post-col-date">
                          {formatDate(post.createdAt)}
                        </div>
                        <div className="board-post-col-likes">
                          {post.likeCount}
                        </div>
                        <div className="board-post-col-views">
                          {post.viewCount}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 페이징 */}
                  {totalPages > 1 && (
                    <div className="board-pagination">
                      <button
                        onClick={() => handlePageChange(0)}
                        disabled={currentPage === 0}
                        className="board-page-btn"
                      >
                        맨 처음
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="board-page-btn"
                      >
                        &lt;
                      </button>

                      {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                        const pageNum = Math.floor(currentPage / 10) * 10 + i;
                        if (pageNum >= totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`board-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="board-page-btn"
                      >
                        &gt;
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages - 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="board-page-btn"
                      >
                        맨 끝
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="board-no-posts">
                  <p>등록된 게시글이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 작성 버튼 */}
            {boardId !== 'best' && (
              <div className="board-actions">
                <button
                  onClick={() => navigate(`/board/${boardId}/write`)}
                  className="board-btn board-btn-primary"
                >
                  글쓰기
                </button>
              </div>
            )}
          </div>
        </div>
        {/* 우측 광고 */}
        <div className="main-side-ad">
          📢<br />우측<br />광고<br />영역<br />(160px)
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FactlabBoard;