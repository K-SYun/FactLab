import React from 'react';
import BoardForm from './BoardForm';
import { Board, BoardCreateRequest, BoardUpdateRequest } from '../../types/board';

interface BoardModalProps {
  isOpen: boolean;
  board?: Board | null;
  onSubmit: (data: BoardCreateRequest | BoardUpdateRequest) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const BoardModal: React.FC<BoardModalProps> = ({ 
  isOpen, 
  board, 
  onSubmit, 
  onClose, 
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container board-modal">
        <div className="modal-header">
          <h2>{board ? '게시판 수정' : '새 게시판 생성'}</h2>
          <button 
            className="modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <BoardForm
            board={board}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default BoardModal;
