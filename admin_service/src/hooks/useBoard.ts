import { useState, useCallback } from 'react';
import { Board, BoardCreateRequest, BoardUpdateRequest } from '../types/board';
import { boardApi } from '../services/boardApi';

export const useBoard = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 모든 게시판 조회 (관리자용)
  const fetchAllBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const boardList = await boardApi.getAllBoards();
      setBoards(boardList);
    } catch (err: any) {
      const errorMessage = err.message || '게시판 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 활성화된 게시판 조회 (사용자용)
  const fetchActiveBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const boardList = await boardApi.getActiveBoards();
      setBoards(boardList);
    } catch (err: any) {
      setError(err.message);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 게시판 생성
  const createBoard = useCallback(async (boardData: BoardCreateRequest): Promise<Board | null> => {
    setLoading(true);
    setError(null);
    try {
      const newBoard = await boardApi.createBoard(boardData);
      // 새로운 게시판을 목록에 추가 (표시 순서에 따라 정렬)
      setBoards(prev => {
        const updated = [...prev, newBoard];
        return updated.sort((a, b) => a.displayOrder - b.displayOrder);
      });
      return newBoard;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 게시판 수정
  const updateBoard = useCallback(async (id: number, boardData: BoardUpdateRequest): Promise<Board | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedBoard = await boardApi.updateBoard(id, boardData);
      // 목록에서 수정된 게시판 업데이트
      setBoards(prev => {
        const updated = prev.map(board => 
          board.id === id ? updatedBoard : board
        );
        return updated.sort((a, b) => a.displayOrder - b.displayOrder);
      });
      return updatedBoard;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 게시판 활성화/비활성화 토글
  const toggleBoardStatus = useCallback(async (id: number): Promise<Board | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedBoard = await boardApi.toggleBoardStatus(id);
      // 목록에서 상태 업데이트
      setBoards(prev => 
        prev.map(board => 
          board.id === id ? updatedBoard : board
        )
      );
      return updatedBoard;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 게시판 삭제
  const deleteBoard = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await boardApi.deleteBoard(id);
      // 목록에서 삭제된 게시판 제거
      setBoards(prev => prev.filter(board => board.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 특정 게시판 조회
  const getBoardById = useCallback(async (id: number): Promise<Board | null> => {
    setLoading(true);
    setError(null);
    try {
      const board = await boardApi.getBoardById(id);
      return board;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 카테고리별 게시판 조회
  const fetchBoardsByCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const boardList = await boardApi.getBoardsByCategory(category);
      setBoards(boardList);
    } catch (err: any) {
      setError(err.message);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // 상태
    boards,
    loading,
    error,
    
    // 액션
    fetchAllBoards,
    fetchActiveBoards,
    createBoard,
    updateBoard,
    toggleBoardStatus,
    deleteBoard,
    getBoardById,
    fetchBoardsByCategory,
    clearError
  };
};
