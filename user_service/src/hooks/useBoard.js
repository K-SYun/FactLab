import { useState, useEffect } from 'react';
import { boardService } from '../services/boardApi';

export const useBoards = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await boardService.getActiveBoards();
      setBoards(response.data);
    } catch (err) {
      setError(err.response?.data?.message || '게시판 목록을 불러오는데 실패했습니다.');
      console.error('게시판 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  return {
    boards,
    loading,
    error,
    refetch: fetchBoards,
  };
};

export const useBoard = (boardId) => {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBoard = async () => {
    if (!boardId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await boardService.getBoardById(boardId);
      setBoard(response.data);
    } catch (err) {
      setError(err.response?.data?.message || '게시판 정보를 불러오는데 실패했습니다.');
      console.error('게시판 상세 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  return {
    board,
    loading,
    error,
    refetch: fetchBoard,
  };
};
