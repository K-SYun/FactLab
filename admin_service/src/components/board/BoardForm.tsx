import React, { useState, useEffect } from 'react';
import { Board, BoardCreateRequest, BoardUpdateRequest, BOARD_CATEGORIES, BoardCategory } from '../../types/board';
import { getBackendApiBase } from '../../utils/api';

interface BoardFormProps {
  board?: Board | null;
  onSubmit: (data: BoardCreateRequest | BoardUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const BoardForm: React.FC<BoardFormProps> = ({ board, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<BoardCreateRequest>({
    name: '',
    description: '',
    category: '',
    categoryId: undefined,
    displayOrder: 0,
    allowAnonymous: false,
    requireApproval: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<BoardCategory[]>([]);

  // 카테고리 목록 로드
  useEffect(() => {
    loadCategories();
  }, []);

  // 수정 모드일 때 폼 데이터 초기화
  useEffect(() => {
    if (board) {
      setFormData({
        name: board.name,
        description: board.description,
        category: board.category,
        categoryId: board.categoryId,
        displayOrder: board.displayOrder,
        allowAnonymous: board.allowAnonymous,
        requireApproval: board.requireApproval
      });
    }
  }, [board]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${getBackendApiBase()}/admin/board-categories`);
      if (response.ok) {
        const result = await response.json();
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
    }
  };

  // 입력값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : 
              name === 'categoryId' ? (value ? parseInt(value) : undefined) : value
    }));

    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '게시판 이름은 필수입니다.';
    } else if (formData.name.length > 100) {
      newErrors.name = '게시판 이름은 100자를 초과할 수 없습니다.';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = '카테고리는 필수입니다.';
    }

    if (formData.displayOrder < 0) {
      newErrors.displayOrder = '표시 순서는 0 이상이어야 합니다.';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = '게시판 설명은 1000자를 초과할 수 없습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('폼 제출 오류:', error);
    }
  };

  return (
    <div className="board-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">게시판 이름 *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
            placeholder="게시판 이름을 입력하세요"
            disabled={isLoading}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="categoryId">카테고리 *</label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId || ''}
            onChange={handleChange}
            className={errors.categoryId ? 'error' : ''}
            disabled={isLoading}
            required
          >
            <option value="">카테고리를 선택하세요</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <span className="error-message">{errors.categoryId}</span>}
          <div className="admin-category-info">Lab실, 취미, 먹고살기, 갤러리 중 선택</div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="displayOrder">표시 순서 *</label>
            <input
              type="number"
              id="displayOrder"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleChange}
              className={errors.displayOrder ? 'error' : ''}
              min="0"
              disabled={isLoading}
            />
            {errors.displayOrder && <span className="error-message">{errors.displayOrder}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">게시판 설명</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={errors.description ? 'error' : ''}
            placeholder="게시판에 대한 설명을 입력하세요"
            rows={3}
            disabled={isLoading}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-row">
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="allowAnonymous"
                checked={formData.allowAnonymous}
                onChange={handleChange}
                disabled={isLoading}
              />
              익명 게시 허용
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="requireApproval"
                checked={formData.requireApproval}
                onChange={handleChange}
                disabled={isLoading}
              />
              게시글 승인 필요
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            취소
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? '저장 중...' : (board ? '수정' : '생성')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BoardForm;
