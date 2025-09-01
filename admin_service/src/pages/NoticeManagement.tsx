import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '../styles/AdminCommon.css';
import '../styles/NoticeManagement.css';
import { noticeApi, NoticeResponse } from '../api/noticeApi';
import { boardApi, BoardResponse } from '../api/boardApi';

// 로컬 Notice 인터페이스를 NoticeResponse로 대체
type Notice = NoticeResponse & {
  category?: 'ALL' | 'IMPORTANT' | 'UPDATE' | 'EVENT';
};


const NoticeManagement: React.FC = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [boards, setBoards] = useState<BoardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotices, setSelectedNotices] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedBoards, setSelectedBoards] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'ALL' as 'ALL' | 'IMPORTANT' | 'UPDATE' | 'EVENT',
    isActive: true,
    isPinned: false
  });


  useEffect(() => {
    loadNotices();
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      console.log('게시판 목록 로딩 시작...');
      const response = await boardApi.getAllActiveBoards();
      console.log('게시판 API 응답:', response);

      if (response.success && response.data && Array.isArray(response.data)) {
        console.log('게시판 데이터:', response.data);
        setBoards(response.data);
      } else {
        console.warn('게시판 API 응답이 올바르지 않음:', response);
        setBoards([]);
      }
    } catch (error) {
      console.error('게시판 목록 로드 실패:', error);
      setBoards([]);
    }
  };

  const loadNotices = async () => {
    try {
      setLoading(true);
      const response = await noticeApi.getNotices();
      if (response.success && response.data) {
        if (response.data.content) {
          // Page<T> 형식 응답
          setNotices(response.data.content);
        } else if (Array.isArray(response.data)) {
          // 직접 배열 응답
          setNotices(response.data);
        } else {
          setNotices([]);
        }
      } else {
        setNotices([]);
      }
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
      setNotices([]);

      // API 연결 실패 시 빈 배열로 설정
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const noticeData = {
        ...formData,
        category: formData.category as 'ALL' | 'IMPORTANT' | 'EVENT' | 'UPDATE',
        selectedBoardIds: formData.category === 'IMPORTANT' ? selectedBoards : undefined
      };

      if (editingNotice) {
        // 수정
        const response = await noticeApi.updateNotice(editingNotice.id, noticeData);
        if (response.success) {
          alert('공지사항이 성공적으로 수정되었습니다.');
        } else {
          alert('공지사항 수정에 실패했습니다: ' + (response.error || '알 수 없는 오류'));
        }
      } else {
        // 생성
        const response = await noticeApi.createNotice(noticeData);
        if (response.success) {
          alert('공지사항이 성공적으로 생성되었습니다.');
        } else {
          alert('공지사항 생성에 실패했습니다: ' + (response.error || '알 수 없는 오류'));
        }
      }

      setShowModal(false);
      setEditingNotice(null);
      setFormData({ title: '', content: '', category: 'ALL', isActive: true, isPinned: false });
      setSelectedBoards([]);
      await loadNotices();
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      alert('공지사항 저장에 실패했습니다.');
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category || 'ALL',
      isActive: notice.isActive,
      isPinned: notice.isPinned
    });
    setShowModal(true);
  };

  const handleView = (notice: Notice) => {
    // 상세 페이지로 이동
    navigate(`/notices/${notice.id}`);
  };

  const handleDelete = async (noticeIds: number[]) => {
    if (!window.confirm(`선택한 ${noticeIds.length}개의 공지사항을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const noticeId of noticeIds) {
        try {
          const response = await noticeApi.deleteNotice(noticeId);
          if (response.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`공지사항 ${noticeId} 삭제 실패:`, response.error);
          }
        } catch (error) {
          errorCount++;
          console.error(`공지사항 ${noticeId} 삭제 오류:`, error);
        }
      }

      if (successCount > 0) {
        alert(`${successCount}개의 공지사항이 성공적으로 삭제되었습니다.`);
      }
      if (errorCount > 0) {
        alert(`${errorCount}개의 공지사항 삭제에 실패했습니다.`);
      }

      setSelectedNotices([]);
      await loadNotices();
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      alert('공지사항 삭제에 실패했습니다.');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedNotices(notices.map(notice => notice.id));
    } else {
      setSelectedNotices([]);
    }
  };

  const handleSelectNotice = (noticeId: number) => {
    setSelectedNotices(prev =>
      prev.includes(noticeId)
        ? prev.filter(id => id !== noticeId)
        : [...prev, noticeId]
    );
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 카테고리별 필터링
  const filteredNotices = activeTab === 'all'
    ? notices
    : notices.filter(notice => notice.category === activeTab);

  // 카테고리 라벨 및 설명
  const categoryLabels = {
    all: { label: '전체', desc: '모든 공지사항' },
    ALL: { label: '전체', desc: '모든 게시판에 표시' },
    IMPORTANT: { label: '중요', desc: '특정 게시판에만 표시' },
    EVENT: { label: '이벤트', desc: '이벤트 관련 공지' },
    UPDATE: { label: '업데이트', desc: '공지사항 페이지에만 표시' }
  };

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case 'IMPORTANT': return 'admin-badge admin-badge-danger';
      case 'UPDATE': return 'admin-badge admin-badge-primary';
      case 'EVENT': return 'admin-badge admin-badge-success';
      case 'ALL': return 'admin-badge admin-badge-info';
      default: return 'admin-badge admin-badge-secondary';
    }
  };

  return (
    <div className="notice-management">
      <div className="admin-header-section">
        <div className="admin-header-content">
          <h1 className="admin-title">공지사항 관리</h1>
          <p className="admin-subtitle">사용자에게 표시되는 공지사항을 관리합니다.</p>
        </div>
        <div className="admin-actions">
          {/* 버튼들을 탭 오른쪽으로 이동 */}
        </div>
      </div>

      {/* 카테고리 탭 및 버튼 */}
      <div className="notice-tabs-actions-container">
        <div className="notice-category-tabs">
          {Object.entries(categoryLabels).map(([key, { label, desc }]) => (
            <div
              key={key}
              className={`category-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className="tab-label">{label}</span>
              <span className="tab-count">({key === 'all' ? notices.length : notices.filter(n => n.category === key).length})</span>
            </div>
          ))}
        </div>

        <div className="notice-tab-actions">
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => {
              setEditingNotice(null);
              setFormData({ title: '', content: '', category: 'ALL', isActive: true, isPinned: false });
              setSelectedBoards([]);
              setShowModal(true);
            }}
          >
            + 공지사항 추가
          </button>
          <button
            className="admin-btn admin-btn-danger"
            onClick={() => handleDelete(selectedNotices)}
            disabled={selectedNotices.length === 0}
          >
            삭제 ({selectedNotices.length})
          </button>
        </div>
      </div>

      {showModal && (
        <div className="notice-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notice-modal-header">
              <h3>{editingNotice ? '공지사항 수정' : '공지사항 추가'}</h3>
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setEditingNotice(null);
                  setFormData({ title: '', content: '', category: 'ALL', isActive: true, isPinned: false });
                  setSelectedBoards([]);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-group">
                <label className="admin-label">제목</label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">카테고리</label>
                <select
                  className="admin-select"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  required
                >
                  <option value="ALL">전체 - 모든 게시판에 표시</option>
                  <option value="IMPORTANT">중요 - 특정 게시판에만 표시</option>
                  <option value="EVENT">이벤트 - 이벤트 관련 공지</option>
                  <option value="UPDATE">업데이트 - 공지사항 페이지에만 표시</option>
                </select>
              </div>

              {/* 중요 공지사항일 때만 게시판 선택 표시 */}
              {formData.category === 'IMPORTANT' && (
                <div className="admin-form-group">
                  <label className="admin-label">노출 게시판 선택</label>
                  <div className="admin-form-help-text">
                    이 공지사항이 표시될 게시판을 선택하세요. (복수 선택 가능)
                  </div>
                  <div className="board-selection-grid">
                    {boards && Array.isArray(boards) && boards.length > 0 ? (
                      boards.map((board) => (
                        <div key={board.id} className="admin-checkbox-group board-checkbox">
                          <input
                            type="checkbox"
                            id={`board-${board.id}`}
                            checked={selectedBoards.includes(board.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBoards(prev => [...prev, board.id]);
                              } else {
                                setSelectedBoards(prev => prev.filter(id => id !== board.id));
                              }
                            }}
                          />
                          <label htmlFor={`board-${board.id}`}>{board.name}</label>
                        </div>
                      ))
                    ) : (
                      <div className="admin-form-help-text">
                        게시판 목록을 불러오는 중이거나 사용 가능한 게시판이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-label">내용</label>
                <div className="editor-container">
                  <CKEditor
                    editor={ClassicEditor}
                    onChange={(_, editor) => {
                      const data = editor.getData();
                      setFormData(prev => ({ ...prev, content: data }));
                    }}
                    onReady={(editor) => {
                      editor.setData(formData.content);
                    }}
                    config={{
                      licenseKey: 'GPL',
                      toolbar: [
                        'heading', '|',
                        'bold', 'italic', 'underline', '|',
                        'link', 'bulletedList', 'numberedList', '|',
                        'blockQuote', 'insertTable', '|',
                        'undo', 'redo'
                      ],
                      placeholder: '공지사항 내용을 입력하세요...'
                    }}
                  />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-checkbox-group">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label htmlFor="isActive">활성 상태</label>
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                  />
                  <label htmlFor="isPinned">상단 고정</label>
                </div>
              </div>
              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingNotice(null);
                    setFormData({ title: '', content: '', category: 'ALL', isActive: true, isPinned: false });
                    setSelectedBoards([]);
                  }}
                >
                  취소
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editingNotice ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        <div className="admin-table-header">
          <div className="admin-table-controls-info">
            <div className="admin-checkbox-group">
              <input
                type="checkbox"
                id="selectAll"
                checked={notices.length > 0 && selectedNotices.length === notices.length}
                onChange={handleSelectAll}
              />
              <label htmlFor="selectAll">전체 선택</label>
            </div>
            <div className="admin-table-divider">|</div>
            <div className="admin-table-info">
              {activeTab === 'all' ? `총 ${notices.length}개 공지사항` : `${categoryLabels[activeTab as keyof typeof categoryLabels].label} ${filteredNotices.length}개`}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">공지사항을 불러오는 중...</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="notice-table-col-select">선택</th>
                  <th className="notice-table-col-pinned">고정</th>
                  <th className="notice-table-col-status">상태</th>
                  <th className="notice-table-col-category">카테고리</th>
                  <th>제목</th>
                  <th className="notice-table-col-author">작성자</th>
                  <th className="notice-table-col-date">작성일</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-no-data">
                      {activeTab === 'all' ? '등록된 공지사항이 없습니다.' : `${categoryLabels[activeTab as keyof typeof categoryLabels].label} 공지사항이 없습니다.`}
                    </td>
                  </tr>
                ) : (
                  filteredNotices.map((notice) => (
                    <tr key={notice.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedNotices.includes(notice.id)}
                          onChange={() => handleSelectNotice(notice.id)}
                        />
                      </td>
                      <td>
                        {notice.isPinned && (
                          <span className="admin-badge admin-badge-warning">📌</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-badge ${notice.isActive ? 'admin-badge-success' : 'admin-badge-secondary'}`}>
                          {notice.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td>
                        <span className={getCategoryBadgeClass(notice.category)}>
                          {categoryLabels[notice.category || 'ALL']?.label || '전체'}
                        </span>
                      </td>
                      <td>
                        <div
                          className="admin-text-truncate notice-title-clickable"
                          onClick={() => handleView(notice)}
                          title="상세 보기"
                        >
                          {notice.title}
                        </div>
                      </td>
                      <td>{notice.author}</td>
                      <td className="admin-text-sm admin-text-gray-600">
                        {formatDate(notice.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeManagement;