import React, { useState } from 'react';
import { Board } from '../../types/board';

interface BoardListProps {
  boards: Board[];
  onEdit: (board: Board) => void;
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
}

const BoardList: React.FC<BoardListProps> = ({ boards, onEdit, onToggleStatus, onDelete, loading = false }) => {
  const [bestSettings, setBestSettings] = useState({ minViewCount: 100, minLikeCount: 10 });
  const [isEditingBest, setIsEditingBest] = useState(false);
  const [tempBestSettings, setTempBestSettings] = useState({ minViewCount: 100, minLikeCount: 10 });
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
        {isActive ? '활성' : '비활성'}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryClasses: Record<string, string> = {
      '공지': 'category-notice',
      '뉴스': 'category-news', 
      '일반': 'category-general',
      '질문답변': 'category-qna',
      '자유': 'category-free',
      '토론': 'category-discussion'
    };

    return (
      <span className={`category-badge ${categoryClasses[category] || 'category-default'}`}>
        {category}
      </span>
    );
  };

  // BEST 설정 편집 시작
  const handleEditBest = () => {
    setTempBestSettings({ ...bestSettings });
    setIsEditingBest(true);
  };

  // BEST 설정 저장
  const handleSaveBest = async () => {
    try {
      // API 호출하여 시스템 설정 저장
      const response = await fetch('/api/admin/system-settings/best', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          minViewCount: tempBestSettings.minViewCount,
          minLikeCount: tempBestSettings.minLikeCount,
        }),
      });

      if (response.ok) {
        setBestSettings({ ...tempBestSettings });
        setIsEditingBest(false);
        alert('BEST 기준이 성공적으로 업데이트되었습니다.');
      } else {
        throw new Error('업데이트 실패');
      }
    } catch (error) {
      console.error('BEST 설정 저장 실패:', error);
      alert('BEST 기준 저장에 실패했습니다.');
    }
  };

  // BEST 설정 편집 취소
  const handleCancelBest = () => {
    setTempBestSettings({ ...bestSettings });
    setIsEditingBest(false);
  };

  if (loading) {
    return (
      <div className="board-list-loading">
        <div className="loading-spinner"></div>
        <p>게시판 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="board-list-empty">
        <p>등록된 게시판이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="board-list">
      <div className="board-table-container">
        <table className="board-table">
          <thead>
            <tr>
              <th>순서</th>
              <th>게시판명</th>
              <th>카테고리</th>
              <th>상태</th>
              <th>게시글 수</th>
              <th>마지막 게시글</th>
              <th>생성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {/* BEST 설정 행 */}
            <tr className="best-settings-row">
              <td>
                <span className="best-icon">⭐</span>
              </td>
              <td>
                <div className="board-name-cell">
                  <div className="board-name best-board-name">BEST 게시판 기준 설정</div>
                  <div className="board-description">
                    조회수와 추천수 기준을 만족하는 게시글이 자동으로 BEST 게시판에 등록됩니다
                  </div>
                </div>
              </td>
              <td>
                <span className="category-badge category-special">BEST</span>
              </td>
              <td>
                <span className="status-badge active">활성</span>
              </td>
              <td>
                {isEditingBest ? (
                  <div className="best-settings-edit">
                    <div className="setting-group">
                      <label>조회수:</label>
                      <input
                        type="number"
                        value={tempBestSettings.minViewCount}
                        onChange={(e) => setTempBestSettings({
                          ...tempBestSettings,
                          minViewCount: parseInt(e.target.value) || 0
                        })}
                        min="0"
                        className="setting-input"
                      />
                    </div>
                    <div className="setting-group">
                      <label>추천수:</label>
                      <input
                        type="number"
                        value={tempBestSettings.minLikeCount}
                        onChange={(e) => setTempBestSettings({
                          ...tempBestSettings,
                          minLikeCount: parseInt(e.target.value) || 0
                        })}
                        min="0"
                        className="setting-input"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="best-settings-display">
                    <div>조회수 ≥ {bestSettings.minViewCount}</div>
                    <div>추천수 ≥ {bestSettings.minLikeCount}</div>
                  </div>
                )}
              </td>
              <td>-</td>
              <td>-</td>
              <td>
                <div className="board-actions">
                  {isEditingBest ? (
                    <>
                      <button
                        onClick={handleSaveBest}
                        className="btn btn-sm btn-success"
                        title="저장"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleCancelBest}
                        className="btn btn-sm btn-secondary"
                        title="취소"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditBest}
                      className="btn btn-sm btn-edit"
                      title="BEST 기준 수정"
                    >
                      설정
                    </button>
                  )}
                </div>
              </td>
            </tr>
            {boards.map((board) => (
              <tr key={board.id} className={!board.isActive ? 'inactive-row' : ''}>
                <td>
                  <span className="display-order">{board.displayOrder}</span>
                </td>
                <td>
                  <div className="board-name-cell">
                    <div className="board-name">{board.name}</div>
                    {board.description && (
                      <div className="board-description">{board.description}</div>
                    )}
                    <div className="board-options">
                      {board.allowAnonymous && <span className="option-tag">익명허용</span>}
                      {board.requireApproval && <span className="option-tag">승인필요</span>}
                    </div>
                  </div>
                </td>
                <td>
                  {getCategoryBadge(board.category)}
                </td>
                <td>
                  {getStatusBadge(board.isActive)}
                </td>
                <td>
                  <span className="post-count">{board.postCount}</span>
                </td>
                <td>
                  {board.lastPostAt ? (
                    <span className="last-post-date">
                      {formatDate(board.lastPostAt)}
                    </span>
                  ) : (
                    <span className="no-posts">게시글 없음</span>
                  )}
                </td>
                <td>
                  <span className="created-date">
                    {formatDate(board.createdAt)}
                  </span>
                  <div className="created-by">
                    by {board.createdByUsername}
                  </div>
                </td>
                <td>
                  <div className="board-actions">
                    <button
                      onClick={() => onEdit(board)}
                      className="btn btn-sm btn-edit"
                      title="수정"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => onToggleStatus(board.id)}
                      className={`btn btn-sm ${board.isActive ? 'btn-warning' : 'btn-success'}`}
                      title={board.isActive ? '비활성화' : '활성화'}
                    >
                      {board.isActive ? '비활성화' : '활성화'}
                    </button>
                    <button
                      onClick={() => onDelete(board.id)}
                      className="btn btn-sm btn-danger"
                      title="삭제"
                      disabled={board.postCount > 0}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BoardList;
