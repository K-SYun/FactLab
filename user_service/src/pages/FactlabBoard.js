import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import boardService from '../services/boardService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Common.css';
import '../styles/News.css';

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
  }, [boardId, currentPage]);

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
      const response = await boardService.getBestPosts(currentPage, 20);
      if (response.success && response.data) {
        setPosts(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('BEST 게시글 목록 로드 실패:', error);
      setError('BEST 게시글을 불러오는데 실패했습니다.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await boardService.getPosts(boardId, currentPage, 20);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
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
        <main className="news-main">
          <div className="news-container">
            <div className="error-message">
              <h2>오류가 발생했습니다</h2>
              <p>{error}</p>
              <button onClick={() => navigate('/')} className="news-btn news-btn-primary">
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="news-main">
        <div className="news-container">
          {/* 게시판 헤더 */}
          <div className="news-board-header">
            <h1 className="news-page-title">
              {board ? board.name : '게시판'}
            </h1>
            {board && board.description && (
              <p className="news-board-description">{board.description}</p>
            )}
          </div>

          {/* 게시글 목록 */}
          <div className="news-post-list">
            {loading ? (
              <div className="news-loading">게시글을 불러오는 중...</div>
            ) : posts.length > 0 ? (
              <>
                <div className="news-post-table">
                  <div className="news-post-header">
                    <div className="news-post-col-title">제목</div>
                    <div className="news-post-col-author">작성자</div>
                    <div className="news-post-col-date">작성일</div>
                    <div className="news-post-col-views">조회</div>
                    <div className="news-post-col-likes">추천</div>
                  </div>
                  
                  {posts.map((post) => (
                    <div 
                      key={post.id} 
                      className={`news-post-row ${post.isNotice ? 'news-post-notice' : ''}`}
                      onClick={() => handlePostClick(post.id)}
                    >
                      <div className="news-post-col-title">
                        {post.isNotice && <span className="news-notice-badge">공지</span>}
                        <span className="news-post-title">{post.title}</span>
                        {post.commentCount > 0 && (
                          <span className="news-comment-count">[{post.commentCount}]</span>
                        )}
                      </div>
                      <div className="news-post-col-author">
                        {post.authorName}
                      </div>
                      <div className="news-post-col-date">
                        {formatDate(post.createdAt)}
                      </div>
                      <div className="news-post-col-views">
                        {post.viewCount}
                      </div>
                      <div className="news-post-col-likes">
                        {post.likeCount}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이징 */}
                {totalPages > 1 && (
                  <div className="news-pagination">
                    <button 
                      onClick={() => handlePageChange(0)}
                      disabled={currentPage === 0}
                      className="news-page-btn"
                    >
                      맨 처음
                    </button>
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="news-page-btn"
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
                          className={`news-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                    
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="news-page-btn"
                    >
                      &gt;
                    </button>
                    <button 
                      onClick={() => handlePageChange(totalPages - 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="news-page-btn"
                    >
                      맨 끝
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="news-no-posts">
                <p>등록된 게시글이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 작성 버튼 */}
          <div className="news-board-actions">
            <button 
              onClick={() => navigate(`/board/${boardId}/write`)}
              className="news-btn news-btn-primary"
            >
              글쓰기
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default FactlabBoard;