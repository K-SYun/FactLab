import { useState, useEffect, useCallback } from 'react';
import { boardService } from '../services/boardApi';

export const useBoards = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 활성화된 게시판 목록 조회
  const fetchActiveBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await boardService.getActiveBoards();
      if (response.data) {
        setBoards(response.data);
      }
    } catch (err) {
      console.error('게시판 목록 조회 실패:', err);
      setError(err.response?.data?.message || '게시판 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 게시판 상세 정보 조회
  const getBoardById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await boardService.getBoardById(id);
      return response.data;
    } catch (err) {
      console.error('게시판 상세 조회 실패:', err);
      setError(err.response?.data?.message || '게시판 정보를 불러오는데 실패했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 컴포넌트 마운트 시 자동으로 게시판 목록 조회
  useEffect(() => {
    fetchActiveBoards();
  }, [fetchActiveBoards]);

  return {
    boards,
    loading,
    error,
    fetchActiveBoards,
    getBoardById,
    clearError
  };
};
