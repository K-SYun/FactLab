import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { popupApi } from '../api/popup';
import { Popup, PopupCreateRequest, PopupStats } from '../types/popup';
import '../styles/PopupManagement.css';

const PopupManagement: React.FC = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [stats, setStats] = useState<PopupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [formData, setFormData] = useState<PopupCreateRequest>({
    title: '',
    content: '',
    linkUrl: '',
    linkText: '',
    startDate: '',
    endDate: '',
    position: 'center',
    positionX: undefined,
    positionY: undefined,
    active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [popupsData, statsData] = await Promise.all([
        popupApi.getAllPopups(),
        popupApi.getPopupStats()
      ]);
      setPopups(popupsData);
      setStats(statsData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (popup?: Popup) => {
    if (popup) {
      setEditingPopup(popup);
      setFormData({
        title: popup.title,
        content: popup.content,
        linkUrl: popup.linkUrl || '',
        linkText: popup.linkText || '',
        startDate: popup.startDate.slice(0, 16), // datetime-local format
        endDate: popup.endDate.slice(0, 16),
        position: popup.position,
        positionX: popup.positionX,
        positionY: popup.positionY,
        active: popup.active
      });
    } else {
      setEditingPopup(null);
      // 기본값 설정 (현재 시간 + 7일)
      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      setFormData({
        title: '',
        content: '',
        linkUrl: '',
        linkText: '',
        startDate: now.toISOString().slice(0, 16),
        endDate: weekLater.toISOString().slice(0, 16),
        position: 'center',
        positionX: undefined,
        positionY: undefined,
        active: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPopup(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용은 필수입니다.');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert('종료일시는 시작일시보다 나중이어야 합니다.');
      return;
    }

    try {
      if (editingPopup) {
        await popupApi.updatePopup(editingPopup.id, formData);
      } else {
        await popupApi.createPopup(formData);
      }
      
      await loadData();
      closeModal();
      alert(editingPopup ? '팝업이 수정되었습니다.' : '팝업이 생성되었습니다.');
    } catch (error) {
      console.error('팝업 저장 실패:', error);
      alert('팝업 저장에 실패했습니다.');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await popupApi.togglePopupActive(id);
      await loadData();
    } catch (error) {
      console.error('팝업 상태 변경 실패:', error);
      alert('팝업 상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`"${title}" 팝업을 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await popupApi.deletePopup(id);
      await loadData();
      alert('팝업이 삭제되었습니다.');
    } catch (error) {
      console.error('팝업 삭제 실패:', error);
      alert('팝업 삭제에 실패했습니다.');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (loading) {
    return <div className="admin-loading">로딩 중...</div>;
  }

  return (
    <div className="popup-management">
      <div className="admin-header">
        <h1>팝업 관리</h1>
        <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
          새 팝업 등록
        </button>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="popup-stats">
          <div className="stat-card">
            <h3>전체 팝업</h3>
            <div className="stat-number">{stats.totalCount}</div>
          </div>
          <div className="stat-card">
            <h3>활성 팝업</h3>
            <div className="stat-number">{stats.activeCount}</div>
          </div>
          <div className="stat-card">
            <h3>비활성 팝업</h3>
            <div className="stat-number">{stats.inactiveCount}</div>
          </div>
          <div className="stat-card">
            <h3>현재 표시중</h3>
            <div className="stat-number">{stats.displayingCount}</div>
          </div>
        </div>
      )}

      {/* 팝업 목록 */}
      <div className="popup-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>제목</th>
              <th>시작일시</th>
              <th>종료일시</th>
              <th>위치</th>
              <th>상태</th>
              <th>작성자</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {popups.map((popup) => (
              <tr key={popup.id}>
                <td>{popup.id}</td>
                <td className="popup-title">{popup.title}</td>
                <td>{formatDateTime(popup.startDate)}</td>
                <td>{formatDateTime(popup.endDate)}</td>
                <td>
                  {popup.position === 'center' ? '중앙' : `커스텀 (${popup.positionX}, ${popup.positionY})`}
                </td>
                <td>
                  <span className={`status-badge ${popup.active ? 'active' : 'inactive'}`}>
                    {popup.active ? '활성' : '비활성'}
                  </span>
                </td>
                <td>{popup.createdBy || '-'}</td>
                <td className="action-buttons">
                  <button 
                    className="admin-btn admin-btn-sm admin-btn-secondary"
                    onClick={() => openModal(popup)}
                  >
                    수정
                  </button>
                  <button 
                    className={`admin-btn admin-btn-sm ${popup.active ? 'admin-btn-warning' : 'admin-btn-success'}`}
                    onClick={() => handleToggleActive(popup.id)}
                  >
                    {popup.active ? '비활성화' : '활성화'}
                  </button>
                  <button 
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    onClick={() => handleDelete(popup.id, popup.title)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {popups.length === 0 && (
          <div className="empty-state">
            등록된 팝업이 없습니다.
          </div>
        )}
      </div>

      {/* 팝업 등록/수정 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPopup ? '팝업 수정' : '새 팝업 등록'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="popup-form">
              <div className="form-group">
                <label htmlFor="title">제목 *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">내용 *</label>
                <div className="editor-container">
                  <CKEditor
                    editor={ClassicEditor}
                    onChange={(_, editor) => {
                      const data = editor.getData();
                      setFormData({ ...formData, content: data });
                    }}
                    onReady={(editor) => {
                      editor.setData(formData.content);
                    }}
                    config={{
                      licenseKey: 'GPL', // GPL 오픈소스 라이센스
                      toolbar: [
                        'heading', '|',
                        'bold', 'italic', 'underline', '|',
                        'link', 'bulletedList', 'numberedList', '|',
                        'blockQuote', 'insertTable', '|',
                        'undo', 'redo'
                      ],
                      placeholder: '팝업 내용을 입력하세요...'
                    }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="linkUrl">링크 URL</label>
                  <input
                    type="url"
                    id="linkUrl"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="linkText">링크 텍스트</label>
                  <input
                    type="text"
                    id="linkText"
                    value={formData.linkText}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                    placeholder="자세히 보기"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">시작일시 *</label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">종료일시 *</label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>팝업 위치</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="position"
                      value="center"
                      checked={formData.position === 'center'}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value as 'center' | 'custom' })}
                    />
                    중앙
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="position"
                      value="custom"
                      checked={formData.position === 'custom'}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value as 'center' | 'custom' })}
                    />
                    직접입력
                  </label>
                </div>

                {formData.position === 'custom' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="positionX">X 좌표 (px)</label>
                      <input
                        type="number"
                        id="positionX"
                        value={formData.positionX || ''}
                        onChange={(e) => setFormData({ ...formData, positionX: parseInt(e.target.value) || undefined })}
                        placeholder="100"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="positionY">Y 좌표 (px)</label>
                      <input
                        type="number"
                        id="positionY"
                        value={formData.positionY || ''}
                        onChange={(e) => setFormData({ ...formData, positionY: parseInt(e.target.value) || undefined })}
                        placeholder="100"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  활성화
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>
                  취소
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editingPopup ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopupManagement;