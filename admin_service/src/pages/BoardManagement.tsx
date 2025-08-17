import React, { useEffect, useState } from 'react';
import { useBoard } from '../hooks/useBoard';
import { Board, BoardCreateRequest, BoardUpdateRequest } from '../types/board';
import BoardList from '../components/board/BoardList';
import BoardModal from '../components/board/BoardModal';
import { getBackendApiBase } from '../utils/api';
import '../styles/BoardManagement.css';

const BoardManagement: React.FC = () => {
  const {
    boards,
    loading,
    error,
    fetchAllBoards,
    createBoard,
    updateBoard,
    toggleBoardStatus,
    deleteBoard,
    clearError
  } = useBoard();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // 컴포넌트 마운트 시 카테고리 및 게시판 목록 조회
  useEffect(() => {
    fetchAllBoards();
    loadCategories();
  }, [fetchAllBoards]);

  // 카테고리 목록 로드
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await fetch(`${getBackendApiBase()}/admin/board-categories`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCategories(result.data);
        }
      }
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // 성공 메시지 자동 제거
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 에러 메시지 자동 제거
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // 새 게시판 생성 모달 열기
  const handleCreateBoard = () => {
    setEditingBoard(null);
    setIsModalOpen(true);
  };

  // 게시판 수정 모달 열기
  const handleEditBoard = (board: Board) => {
    setEditingBoard(board);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBoard(null);
  };

  // 폼 제출 처리
  const handleFormSubmit = async (data: BoardCreateRequest | BoardUpdateRequest) => {
    setActionLoading(true);
    try {
      let result;
      if (editingBoard) {
        // 수정
        result = await updateBoard(editingBoard.id, data);
        if (result) {
          setSuccessMessage('게시판이 성공적으로 수정되었습니다.');
        }
      } else {
        // 생성
        result = await createBoard(data);
        if (result) {
          setSuccessMessage('게시판이 성공적으로 생성되었습니다.');
        }
      }
      
      if (result) {
        handleCloseModal();
      }
    } catch (err) {
      console.error('폼 제출 오류:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 게시판 상태 토글
  const handleToggleStatus = async (id: number) => {
    const board = boards.find(b => b.id === id);
    if (!board) return;

    const confirmed = window.confirm(
      `게시판 "${board.name}"을 ${board.isActive ? '비활성화' : '활성화'}하시겠습니까?`
    );
    
    if (confirmed) {
      setActionLoading(true);
      try {
        const result = await toggleBoardStatus(id);
        if (result) {
          setSuccessMessage(
            `게시판이 ${result.isActive ? '활성화' : '비활성화'}되었습니다.`
          );
        }
      } catch (err) {
        console.error('상태 변경 오류:', err);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // 게시판 삭제
  const handleDeleteBoard = async (id: number) => {
    const board = boards.find(b => b.id === id);
    if (!board) return;

    if (board.postCount > 0) {
      alert('게시글이 있는 게시판은 삭제할 수 없습니다. 먼저 모든 게시글을 삭제해주세요.');
      return;
    }

    const confirmed = window.confirm(
      `게시판 "${board.name}"을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
    );
    
    if (confirmed) {
      setActionLoading(true);
      try {
        const success = await deleteBoard(id);
        if (success) {
          setSuccessMessage('게시판이 성공적으로 삭제되었습니다.');
        }
      } catch (err) {
        console.error('삭제 오류:', err);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // 카테고리별 게시판 필터링
  const getFilteredBoards = () => {
    if (selectedCategoryId === null) {
      return boards; // 전체 보기
    }
    return boards.filter(board => board.categoryId === selectedCategoryId);
  };

  // 카테고리 탭 클릭 핸들러
  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="board-management">
      <div className="page-header">
        <h1>게시판 관리</h1>
        <div className="header-actions">
          <button 
            onClick={handleCreateBoard}
            className="btn btn-primary"
            disabled={loading || actionLoading}
          >
            새 게시판 생성
          </button>
          <button
            onClick={fetchAllBoards}
            className="btn btn-secondary"
            disabled={loading || actionLoading}
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 알림 메시지 */}
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={clearError} className="alert-close">×</button>
        </div>
      )}

      {/* 게시판 통계 */}
      <div className="board-stats">
        <div className="stat-card">
          <div className="stat-number">{boards.length}</div>
          <div className="stat-label">전체 게시판</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{boards.filter(b => b.isActive).length}</div>
          <div className="stat-label">활성 게시판</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{boards.reduce((sum, b) => sum + b.postCount, 0)}</div>
          <div className="stat-label">전체 게시글</div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="category-tabs">
        <button
          className={`category-tab ${selectedCategoryId === null ? 'active' : ''}`}
          onClick={() => handleCategoryClick(null)}
        >
          전체 ({boards.length})
        </button>
        {categories.map((category) => {
          const categoryBoards = boards.filter(board => board.categoryId === category.id);
          return (
            <button
              key={category.id}
              className={`category-tab ${selectedCategoryId === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.name} ({categoryBoards.length})
            </button>
          );
        })}
      </div>

      {/* 게시판 목록 */}
      <div className="board-content">
        <BoardList
          boards={getFilteredBoards()}
          onEdit={handleEditBoard}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteBoard}
          loading={loading}
        />
      </div>

      {/* 게시판 생성/수정 모달 */}
      <BoardModal
        isOpen={isModalOpen}
        board={editingBoard}
        onSubmit={handleFormSubmit}
        onClose={handleCloseModal}
        isLoading={actionLoading}
      />

      {/* 로딩 오버레이 */}
      {actionLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>처리 중...</p>
        </div>
      )}
    </div>
  );
};

export default BoardManagement;
