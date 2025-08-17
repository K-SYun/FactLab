import React, { useState, useEffect } from 'react';
// Using text labels instead of icons for compatibility
import '../styles/AdminUserManagement.css';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AdminUserForm {
  username: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
}

const AdminUserManagement: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<AdminUserForm>({
    username: '',
    email: '',
    password: '',
    role: 'ADMIN',
    isActive: true
  });

  // 관리자 사용자 목록 조회
  const fetchAdminUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAdminUsers(data.data);
        }
      }
    } catch (error) {
      console.error('관리자 사용자 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  // 폼 데이터 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // 모달 열기 (새 사용자 추가)
  const openModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'ADMIN',
      isActive: true
    });
    setIsModalOpen(true);
  };

  // 모달 열기 (사용자 수정)
  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  // 사용자 저장 (추가/수정)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingUser 
        ? `/api/admin/accounts/${editingUser.id}` 
        : '/api/admin/accounts';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchAdminUsers();
        closeModal();
      } else {
        console.error('사용자 저장 실패');
      }
    } catch (error) {
      console.error('사용자 저장 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 삭제
  const handleDelete = async (id: number) => {
    if (!window.confirm('정말로 이 관리자 계정을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/accounts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        await fetchAdminUsers();
      } else {
        console.error('사용자 삭제 실패');
      }
    } catch (error) {
      console.error('사용자 삭제 중 오류:', error);
    }
  };

  // 검색 필터링
  const filteredUsers = adminUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-user-management">
      <div className="admin-page-header">
        <h1>관리자 계정 관리</h1>
        <p>시스템 관리자 계정을 등록하고 관리합니다.</p>
      </div>

      <div className="admin-controls">
        <div className="admin-search-box">
          🔍
          <input
            type="text"
            placeholder="사용자명 또는 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openModal}>
          +
          관리자 추가
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>사용자명</th>
              <th>이메일</th>
              <th>역할</th>
              <th>상태</th>
              <th>생성일</th>
              <th>최근 로그인</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td className="admin-username">{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`admin-role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`admin-status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</td>
                <td className="admin-actions">
                  <button
                    className="admin-btn-icon admin-btn-edit"
                    onClick={() => openEditModal(user)}
                    title="수정"
                  >
                    ✏️
                  </button>
                  <button
                    className="admin-btn-icon admin-btn-delete"
                    onClick={() => handleDelete(user.id)}
                    title="삭제"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="admin-empty-state">
            <p>관리자 계정이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>{editingUser ? '관리자 수정' : '관리자 추가'}</h2>
              <button className="admin-modal-close" onClick={closeModal}>×</button>
            </div>

            <form className="admin-modal-form" onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label htmlFor="username">사용자명</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="password">
                  비밀번호 {editingUser && '(변경시에만 입력)'}
                </label>
                <div className="admin-password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="admin-form-group">
                <label htmlFor="role">역할</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={isLoading}
                >
                  <option value="ADMIN">일반 관리자</option>
                  <option value="SUPER_ADMIN">최고 관리자</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  계정 활성화
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={closeModal}
                  disabled={isLoading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;