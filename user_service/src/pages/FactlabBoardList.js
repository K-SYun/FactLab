import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AdLayout } from '../components/ads';
import { useBoards } from '../hooks/useBoard';
import '../styles/Board.css';

const FactlabBoardList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchType, setSearchType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBoards, setFilteredBoards] = useState([]);
  
  // 실제 API 데이터 사용
  const { boards, loading, error, refetch } = useBoards();

  const formatToKST = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString.includes('Z') ? dateString : dateString + 'Z');
        
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstDate = new Date(date.getTime() + kstOffset);

        const year = kstDate.getUTCFullYear();
        const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(kstDate.getUTCDate()).padStart(2, '0');
        const hours = String(kstDate.getUTCHours()).padStart(2, '0');
        const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
        const seconds = String(kstDate.getUTCSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
        return dateString.replace('T', ' ').substring(0, 19);
    }
  };

  const categories = [
    { key: 'board', label: '게시판' },
    { key: 'hobby', label: '취미' },
    { key: 'life', label: '먹고살기' },
    { key: 'gallery', label: '갤러리' }
  ];

  useEffect(() => {
    // API 데이터가 로드되면 필터링된 게시판 설정
    if (boards && boards.length > 0) {
      // BEST 게시판을 맨 위에 추가
      const bestBoard = {
        id: 'best',
        name: 'BEST',
        description: '조회수 100 이상, 추천수 10 이상의 인기 게시글들을 모아놓은 게시판입니다.',
        category: 'board',
        status: 'ACTIVE',
        isActive: true,
        createdAt: new Date().toISOString(),
        postCount: 0,
        isBestBoard: true
      };
      
      setFilteredBoards([bestBoard, ...boards]);
    }
  }, [boards]);

  useEffect(() => {
    filterBoards();
  }, [activeTab, searchTerm, boards]);

  const filterBoards = () => {
    if (!boards || boards.length === 0) {
      setFilteredBoards([]);
      return;
    }
    
    // BEST 게시판 추가
    const bestBoard = {
      id: 'best',
      name: 'BEST',
      description: '조회수 100 이상, 추천수 10 이상의 인기 게시글들을 모아놓은 게시판입니다.',
      category: 'board',
      status: 'ACTIVE',
      isActive: true,
      createdAt: new Date().toISOString(),
      postCount: 0,
      isBestBoard: true
    };
    
    let allBoards = [bestBoard, ...boards];
    let filtered = allBoards;
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(board => board.category === activeTab);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(board => {
        if (searchType === 'all') {
          return board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 board.description.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (searchType === 'title') {
          return board.name.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (searchType === 'desc') {
          return board.description.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }
    
    setFilteredBoards(filtered);
  };

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      alert('검색어를 입력하세요.');
      return;
    }
    filterBoards();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBoardClick = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  const handleWriteClick = () => {
    navigate('/board/write');
  };

  return (
    <div className="factlab-board-list">
      <Header />
      <AdLayout>
        <div className="board-container">
        <div className="page-header">
          게시판 목록
        </div>
        
        {/* Popular Boards */}
        <div className="popular-boards">
          <div className="popular-title">🏆 인기 게시판</div>
          <div className="popular-list">
            {boards && boards.slice(0, 5).map(board => (
              <a 
                key={board.id}
                href="#" 
                className="popular-item"
                onClick={(e) => {
                  e.preventDefault();
                  handleBoardClick(board.id);
                }}
              >
                {board.name}
                <span className="board-count">(0)</span>
              </a>
            ))}
          </div>
        </div>
        
        {/* Search Area */}
        <div className="search-area">
          <div className="search-form">
            <select 
              className="search-select"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="title">게시판명</option>
              <option value="desc">설명</option>
            </select>
            <input 
              type="text" 
              className="search-input" 
              placeholder="검색어 입력"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="btn" onClick={handleSearch}>검색</button>
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="category-tabs">
          <a
            href="#"
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('all');
            }}
          >
            전체
          </a>
          {categories.map(category => (
            <a
              key={category.key}
              href="#"
              className={`tab ${activeTab === category.key ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick(category.key);
              }}
            >
              {category.label}
            </a>
          ))}
        </div>
        
        {/* Board List */}
        <div className="board-list">
          {loading && (
            <div style={{ padding: '50px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
              게시판을 불러오는 중...
            </div>
          )}
          {error && (
            <div style={{ padding: '50px', textAlign: 'center', fontSize: '14px', color: '#f56565' }}>
              {error}
              <button onClick={refetch} style={{ marginLeft: '10px', padding: '5px 10px' }}>
                다시 시도
              </button>
            </div>
          )}
          {!loading && !error && filteredBoards.map(board => (
            <div 
              key={board.id}
              className={`board-item ${board.isBestBoard ? 'best-board' : ''}`}
              onClick={() => handleBoardClick(board.id)}
            >
              <div className="board-title">
                {board.isBestBoard && <span className="best-badge">🏆</span>}
                {board.name}
              </div>
              <div className="board-desc">{board.description}</div>
              <div className="board-stats">
                <span>상태: {board.status === 'ACTIVE' ? '활성' : '비활성'}</span>
                <span>생성일: {formatToKST(board.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
        
        {!loading && !error && filteredBoards.length === 0 && (
          <div style={{ padding: '50px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
            {boards && boards.length === 0 ? '생성된 게시판이 없습니다.' : '검색 결과가 없습니다.'}
          </div>
        )}
        </div>

        {/* Write Button */}
        <button className="write-button" onClick={handleWriteClick}>
          글쓰기
        </button>
      </AdLayout>

      <Footer />
    </div>
  );
};

export default FactlabBoardList;