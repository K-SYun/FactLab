import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import boardService from '../services/boardService';
import '../styles/Common.css';

const Header = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [boards, setBoards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const { isLoggedIn, user, getWelcomeMessage, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // useLocation 훅 사용

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMypageClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/mypage');
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
      <div className="header-wrapper">
      <header className="news-header">
        <div className="news-header-content">
          <Link to="/" className="news-logo">
            <img src="/Logo.png" alt="PolRadar Icon" className="news-logo-icon" />
            <img src="/Logo2.png" alt="PolRadar" className="news-logo-text" />
          </Link>
          {/* Desktop Auth Buttons */}
          <div className="news-auth-buttons desktop-auth">
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

          {/* Mobile Auth Button */}
          <div className="mobile-auth">
            {isLoggedIn ? (
              <button
                onClick={toggleMobileMenu}
                className="mobile-menu-btn"
                aria-label="메뉴 열기"
              >
                <div className="hamburger-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            ) : (
              <button
                onClick={handleLoginClick}
                className="mobile-login-btn"
                aria-label="로그인"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </button>
            )}
          </div>
        </div>


      </header>

      {/* Mobile Menu Dropdown */}
      {isLoggedIn && isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="mobile-welcome-message">
                <span className="mobile-welcome-text">{getWelcomeMessage()}</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-menu-close"
                aria-label="메뉴 닫기"
              >
                ×
              </button>
            </div>
            <div className="mobile-menu-content">
              <button
                onClick={handleMypageClick}
                className="mobile-menu-item"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="menu-icon">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                마이페이지
              </button>
              <div className="mobile-menu-divider"></div>
              <div className="mobile-mypage-submenu">
                <Link 
                  to="/mypage" 
                  className="mobile-submenu-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  프로필 관리
                </Link>
                <Link 
                  to="/mypage?tab=posts" 
                  className="mobile-submenu-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  작성한 글
                </Link>
                <Link 
                  to="/mypage?tab=comments" 
                  className="mobile-submenu-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  작성한 댓글
                </Link>
                <Link 
                  to="/mypage?tab=bookmarks" 
                  className="mobile-submenu-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  즐겨찾기
                </Link>
                <Link 
                  to="/mypage?tab=settings" 
                  className="mobile-submenu-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  설정
                </Link>
              </div>
              <div className="mobile-menu-divider"></div>
              <button
                onClick={handleLogout}
                className="mobile-menu-item logout-item"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="menu-icon">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
      />
      {/* Navigation Menu (파란색 라인 아래에 위치) */}
      <div className="news-nav-menu">
        <div className="news-nav-content">
          <Link to={{ pathname: "/news_feed", search: "?category=정치" }} state={{ category: '정치' }} className={`news-nav-item ${location.pathname === '/news_feed' && new URLSearchParams(location.search).get('category') === '정치' ? 'active' : ''}`}>정치</Link>
          <Link to={{ pathname: "/news_feed", search: "?category=경제" }} state={{ category: '경제' }} className={`news-nav-item ${location.pathname === '/news_feed' && new URLSearchParams(location.search).get('category') === '경제' ? 'active' : ''}`}>경제</Link>
          <Link to={{ pathname: "/news_feed", search: "?category=사회" }} state={{ category: '사회' }} className={`news-nav-item ${location.pathname === '/news_feed' && new URLSearchParams(location.search).get('category') === '사회' ? 'active' : ''}`}>사회</Link>
          <Link to={{ pathname: "/news_feed", search: "?category=IT과학" }} state={{ category: 'IT과학' }} className={`news-nav-item ${location.pathname === '/news_feed' && new URLSearchParams(location.search).get('category') === 'IT과학' ? 'active' : ''}`}>IT/과학</Link>
          <Link to={{ pathname: "/news_feed", search: "?category=세계" }} state={{ category: '세계' }} className={`news-nav-item ${location.pathname === '/news_feed' && new URLSearchParams(location.search).get('category') === '세계' ? 'active' : ''}`}>세계</Link>
          <Link to={{ pathname: "/news_feed", search: "?category=기후환경" }} state={{ category: '기후환경' }} className={`news-nav-item ${location.pathname === '/news_feed' && new URLSearchParams(location.search).get('category') === '기후환경' ? 'active' : ''}`}>기후/환경</Link>
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
      </div>
    </>
  );
};

export default Header;
