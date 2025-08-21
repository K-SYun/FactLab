import React, { useState, useEffect } from 'react';
import '../styles/AdminCommon.css';
import '../styles/NoticeManagement.css';

interface Notice {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: string;
}

const NoticeManagement: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotices, setSelectedNotices] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isActive: true,
    isPinned: false
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      // TODO: API 연결 후 실제 데이터 로드
      // const response = await noticeApi.getNotices();
      // setNotices(response.data.data || []);
      
      // 임시 데이터
      const mockNotices: Notice[] = [
        {
          id: 1,
          title: '사이트 정기점검 안내',
          content: '2024년 8월 16일 새벽 2시~5시까지 정기점검이 예정되어 있습니다.',
          isActive: true,
          isPinned: true,
          createdAt: '2024-08-15T10:00:00',
          updatedAt: '2024-08-15T10:00:00',
          author: '관리자'
        },
        {
          id: 2,
          title: '새로운 기능 업데이트',
          content: 'AI 뉴스 분석 기능이 개선되었습니다.',
          isActive: true,
          isPinned: false,
          createdAt: '2024-08-14T15:30:00',
          updatedAt: '2024-08-14T15:30:00',
          author: '관리자'
        }
      ];
      setNotices(mockNotices);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNotice) {
        // 수정
        console.log('공지사항 수정:', { id: editingNotice.id, ...formData });
      } else {
        // 생성
        console.log('공지사항 생성:', formData);
      }
      
      setShowForm(false);
      setEditingNotice(null);
      setFormData({ title: '', content: '', isActive: true, isPinned: false });
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
      isActive: notice.isActive,
      isPinned: notice.isPinned
    });
    setShowForm(true);
  };

  const handleDelete = async (noticeIds: number[]) => {
    if (!window.confirm(`선택한 ${noticeIds.length}개의 공지사항을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      console.log('공지사항 삭제:', noticeIds);
      // TODO: API 호출
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
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="notice-management">
      <div className="admin-header-section">
        <div className="admin-header-content">
          <h1 className="admin-title">공지사항 관리</h1>
          <p className="admin-subtitle">사용자에게 표시되는 공지사항을 관리합니다.</p>
        </div>
        <div className="admin-actions">
          <button 
            className="admin-btn admin-btn-primary"
            onClick={() => {
              setEditingNotice(null);
              setFormData({ title: '', content: '', isActive: true, isPinned: false });
              setShowForm(true);
            }}
          >
            + 공지사항 추가
          </button>
          {selectedNotices.length > 0 && (
            <button 
              className="admin-btn admin-btn-danger"
              onClick={() => handleDelete(selectedNotices)}
            >
              선택 삭제 ({selectedNotices.length})
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="admin-form-container">
          <div className="admin-form-header">
            <h3>{editingNotice ? '공지사항 수정' : '공지사항 추가'}</h3>
            <button 
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setShowForm(false);
                setEditingNotice(null);
                setFormData({ title: '', content: '', isActive: true, isPinned: false });
              }}
            >
              취소
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
              <label className="admin-label">내용</label>
              <textarea
                className="admin-textarea"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                required
                rows={5}
                placeholder="공지사항 내용을 입력하세요"
              />
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
              </div>
              <div className="admin-checkbox-group">
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
              <button type="submit" className="admin-btn admin-btn-primary">
                {editingNotice ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-container">
        <div className="admin-table-header">
          <div className="admin-table-controls">
            <div className="admin-checkbox-group">
              <input
                type="checkbox"
                id="selectAll"
                checked={notices.length > 0 && selectedNotices.length === notices.length}
                onChange={handleSelectAll}
              />
              <label htmlFor="selectAll">전체 선택</label>
            </div>
          </div>
          <div className="admin-table-info">
            총 {notices.length}개 공지사항
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
                  <th>제목</th>
                  <th className="notice-table-col-author">작성자</th>
                  <th className="notice-table-col-date">작성일</th>
                  <th className="notice-table-col-actions">작업</th>
                </tr>
              </thead>
              <tbody>
                {notices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-no-data">
                      등록된 공지사항이 없습니다.
                    </td>
                  </tr>
                ) : (
                  notices.map((notice) => (
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
                        <div className="admin-text-truncate">{notice.title}</div>
                      </td>
                      <td>{notice.author}</td>
                      <td className="admin-text-sm admin-text-gray-600">
                        {formatDate(notice.createdAt)}
                      </td>
                      <td>
                        <div className="admin-action-buttons">
                          <button
                            className="admin-btn admin-btn-sm admin-btn-secondary"
                            onClick={() => handleEdit(notice)}
                          >
                            수정
                          </button>
                          <button
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => handleDelete([notice.id])}
                          >
                            삭제
                          </button>
                        </div>
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