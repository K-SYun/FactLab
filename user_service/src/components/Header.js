import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import boardService from '../services/boardService';
import '../styles/Common.css';

const Header = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [boards, setBoards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const { isLoggedIn, user, getWelcomeMessage, logout } = useAuth();
  const navigate = useNavigate();

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 카테고리와 게시판 목록 로드
  useEffect(() => {
    const loadCategoriesAndBoards = async () => {
      try {
        // 카테고리 목록 로드
        const categoriesResponse = await fetch('/api/boards/categories');
        if (categoriesResponse.ok) {
          const categoriesResult = await categoriesResponse.json();
          if (categoriesResult.success && categoriesResult.data) {
            setCategories(categoriesResult.data);
          }
        }

        // 게시판 목록 로드
        const boardsResponse = await boardService.getBoards();

        if (boardsResponse.success && boardsResponse.data) {
          // 활성 게시판만 필터링하고 display_order로 정렬
          const activeBoards = boardsResponse.data.filter(board => board.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder);
          setBoards(activeBoards);
        }
      } catch (error) {
        // 에러 시 빈 배열 유지
        setBoards([]);
        setCategories([]);
      } finally {
        setIsLoadingBoards(false);
      }
    };

    loadCategoriesAndBoards();
  }, []);

  // 게시판을 카테고리별로 그룹화
  const groupBoardsByCategory = (boards) => {
    const grouped = boards.reduce((acc, board) => {
      // 새로운 카테고리 시스템 사용 (categoryName 우선, 없으면 기존 category 사용)
      const category = board.categoryName || board.category || '기타';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(board);
      return acc;
    }, {});

    return grouped;
  };

  return (
    <>
      <header className="news-header">
        <div className="news-header-content">
          <Link to="/" className="news-logo">
            <img src="/Logo.png" alt="PolRadar Icon" className="news-logo-icon" />
            <img src="/Logo2.png" alt="PolRadar" className="news-logo-text" />
          </Link>
          <div className="news-auth-buttons">
            {isLoggedIn ? (
              <>
                <div className="welcome-message">
                  <span className="welcome-text">{getWelcomeMessage()}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="news-btn news-btn-primary"
                >
                  로그아웃
                </button>
                <Link to="/mypage" className="news-btn">마이페이지</Link>
              </>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="news-btn news-btn-primary"
                >
                  로그인
                </button>
                <Link to="/register" className="news-btn">회원가입</Link>
              </>
            )}
          </div>
        </div>


      </header>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
      />
      {/* Navigation Menu (파란색 라인 아래에 위치) */}
      <div className="news-nav-menu">
        <div className="news-nav-content">
          <Link to="/news_feed" state={{ category: '정치' }} className="news-nav-item">정치</Link>
          <Link to="/news_feed" state={{ category: '경제' }} className="news-nav-item">경제</Link>
          <Link to="/news_feed" state={{ category: '사회' }} className="news-nav-item">사회</Link>
          <Link to="/news_feed" state={{ category: 'IT과학' }} className="news-nav-item">IT/과학</Link>
          <Link to="/news_feed" state={{ category: '세계' }} className="news-nav-item">세계</Link>
          <Link to="/news_feed" state={{ category: '기후환경' }} className="news-nav-item">기후/환경</Link>
          <Link to="/bill/list" className="news-nav-item">법안</Link>
          {/* <Link to="/news_feed" state={{ category: '연예' }} className="news-nav-item">연예</Link>
        <Link to="/news_feed" state={{ category: '스포츠' }} className="news-nav-item">스포츠</Link> */}
          <div className="news-nav-item community-lab" id="communityNav" style={{ position: 'relative' }}>
            커뮤니티Lab
            <div className="community-dropdown" id="communityDropdown">
              {isLoadingBoards ? (
                <div className="dropdown-loading">게시판 로딩 중...</div>
              ) : (
                <div className="dropdown-grid">
                  {/* BEST Lab을 가장 위에 고정 표시 */}
                  <div className="dropdown-column">
                    <div className="column-title">인기</div>
                    <Link
                      to="/board/best"
                      className="board-link best-board-link"
                    >
                      🏆 BEST Lab
                    </Link>
                  </div>

                  {categories.length > 0 ? (
                    categories
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((category) => {
                        // 해당 카테고리에 속한 게시판들 찾기
                        const categoryBoards = boards.filter(board =>
                          board.categoryId === category.id ||
                          (board.categoryName === category.name)
                        );

                        return (
                          <div key={category.id} className="dropdown-column">
                            <div className="column-title">{category.name}</div>
                            {categoryBoards.length > 0 ? (
                              categoryBoards
                                .sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999))
                                .map((board) => (
                                  <Link
                                    key={board.id}
                                    to={`/board/${board.id}`}
                                    className="board-link"
                                  >
                                    {board.name}
                                  </Link>
                                ))
                            ) : (
                              <div className="no-boards">게시판이 없습니다.</div>
                            )}
                          </div>
                        );
                      })
                  ) : (
                    <div className="dropdown-column">
                      <div className="column-title">Lab 실</div>
                      <div className="no-boards">게시판 로딩 중...</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
