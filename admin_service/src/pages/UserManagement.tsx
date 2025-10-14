import React, { useState, useEffect } from 'react';
import { userApi, User, UserStats } from '../api/userApi';
import { formatToKST } from '../utils/dateFormatter';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState(false);

  // 사용자 목록 로드
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers({
        status: filterStatus,
        search: searchTerm || undefined,
        page: currentPage,
        size: pageSize,
        sort: 'createdAt',
        direction: 'desc'
      });

      if (response.success && response.data) {
        setUsers(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      } else {
        console.error('사용자 목록 로드 실패:', response.error);
        setUsers([]);
      }
    } catch (error) {
      console.error('사용자 목록 로드 중 오류:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 통계 로드
  const loadStats = async () => {
    try {
      const response = await userApi.getUserStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('사용자 통계 로드 중 오류:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [currentPage, filterStatus, searchTerm]);

  // 검색 처리 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0); // 검색 시 첫 페이지로 이동
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);


  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // 개별 사용자 상태 변경
  const handleUserStatusChange = async (userId: number, newStatus: string) => {
    try {
      setActionLoading(true);
      const response = await userApi.updateUser(userId, { status: newStatus });
      
      if (response.success) {
        await loadUsers(); // 목록 새로고침
        alert('사용자 상태가 변경되었습니다.');
      } else {
        alert('상태 변경 실패: ' + (response.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('상태 변경 중 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 여러 사용자 상태 일괄 변경
  const handleBatchStatusChange = async (status: string) => {
    if (selectedUsers.length === 0) {
      alert('변경할 사용자를 선택해주세요.');
      return;
    }

    if (!window.confirm(`선택된 ${selectedUsers.length}명의 사용자 상태를 ${status}로 변경하시겠습니까?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await userApi.updateUsersStatus({
        userIds: selectedUsers,
        status: status
      });

      if (response.success) {
        await loadUsers(); // 목록 새로고침
        setSelectedUsers([]); // 선택 해제
        alert('선택된 사용자들의 상태가 변경되었습니다.');
      } else {
        alert('일괄 상태 변경 실패: ' + (response.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('일괄 상태 변경 중 오류:', error);
      alert('일괄 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 사용자 삭제
  const handleUserDelete = async (userId: number) => {
    if (!window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await userApi.deleteUser(userId);

      if (response.success) {
        await loadUsers(); // 목록 새로고침
        alert('사용자가 삭제되었습니다.');
      } else {
        alert('사용자 삭제 실패: ' + (response.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('사용자 삭제 중 오류:', error);
      alert('사용자 삭제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserAction = (action: string, userId?: number) => {
    if (userId) {
      switch (action) {
        case '경고':
          handleUserStatusChange(userId, 'WARNED');
          break;
        case '정지':
          handleUserStatusChange(userId, 'SUSPENDED');
          break;
        case '차단':
          handleUserStatusChange(userId, 'BANNED');
          break;
        case '활성화':
          handleUserStatusChange(userId, 'ACTIVE');
          break;
        case '삭제':
          handleUserDelete(userId);
          break;
        default:
          console.log(`사용자 ${action}:`, userId);
      }
    } else {
      console.log(`선택된 사용자들 ${action}:`, selectedUsers);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { text: '정상', class: 'admin-status-green' },
      WARNED: { text: '경고', class: 'admin-status-orange' },
      SUSPENDED: { text: '정지', class: 'admin-status-red' },
      BANNED: { text: '차단', class: 'admin-status-red' },
      INACTIVE: { text: '삭제', class: 'admin-status-red' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    
    return (
      <span className={`admin-status-badge ${config.class} admin-user-status-badge`}>
        {config.text}
      </span>
    );
  };

  const getLevelColor = (level: number) => {
    if (level >= 7) return '#10b981'; // 고수
    if (level >= 5) return '#3b82f6'; // 중급
    if (level >= 3) return '#f59e0b'; // 초급
    return '#6b7280'; // 신규
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-flex-between admin-mb-6">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800">사용자 관리</h1>
        <div className="admin-flex" style={{ gap: '12px' }}>
          <button className="admin-btn admin-btn-primary">
            <i className="fas fa-download mr-2"></i>
            사용자 통계
          </button>
          <button className="admin-btn admin-btn-secondary">
            <i className="fas fa-bell mr-2"></i>
            공지사항 발송
          </button>
        </div>
      </div>

      {/* 상태별 탭 */}
      <div className="admin-tabs-container admin-mb-6">
        <div className="admin-tabs">
          <button
            className={`admin-tab ${filterStatus === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ACTIVE')}
          >
            활성 ({stats?.activeUsers || 0})
          </button>
          <button
            className={`admin-tab ${filterStatus === 'WARNED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('WARNED')}
          >
            경고 ({stats?.warnedUsers || 0})
          </button>
          <button
            className={`admin-tab ${filterStatus === 'SUSPENDED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('SUSPENDED')}
          >
            정지 ({stats?.suspendedUsers || 0})
          </button>
          <button
            className={`admin-tab ${filterStatus === 'BANNED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('BANNED')}
          >
            차단 ({stats?.bannedUsers || 0})
          </button>
          <button
            className={`admin-tab ${filterStatus === 'INACTIVE' ? 'active' : ''}`}
            onClick={() => setFilterStatus('INACTIVE')}
          >
            삭제 ({stats ? (stats.totalUsers - stats.activeUsers - stats.warnedUsers - stats.suspendedUsers - stats.bannedUsers) : 0})
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="admin-card admin-mb-6">
        <div className="admin-grid admin-grid-cols-3" style={{ gap: '16px', alignItems: 'end' }}>
          <div style={{ display: 'none' }}>
            <label className="admin-label">상태 필터</label>
            <select 
              className="admin-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ACTIVE">정상</option>
              <option value="WARNED">경고</option>
              <option value="SUSPENDED">정지</option>
              <option value="BANNED">차단</option>
              <option value="INACTIVE">비활성</option>
            </select>
          </div>
          <div>
            <label className="admin-label">사용자 검색</label>
            <input 
              type="text"
              className="admin-input"
              placeholder="닉네임 또는 이메일로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="admin-flex" style={{ gap: '8px' }}>
            <button 
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setCurrentPage(0);
                loadUsers();
              }}
            >
              <i className="fas fa-search mr-1"></i>검색
            </button>
            <button 
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setFilterStatus('all');
                setSearchTerm('');
                setCurrentPage(0);
                setSelectedUsers([]);
              }}
            >
              <i className="fas fa-redo mr-1"></i>초기화
            </button>
          </div>
        </div>
      </div>

      {/* 일괄 작업 */}
      {selectedUsers.length > 0 && (
        <div className="admin-card admin-mb-4" style={{ background: '#f0f9ff', border: '1px solid #0ea5e9' }}>
          <div className="admin-flex-between">
            <span className="admin-text-sm">{selectedUsers.length}명 선택됨</span>
            <div className="admin-flex" style={{ gap: '8px' }}>
              <button 
                className="admin-btn admin-btn-secondary admin-text-sm"
                onClick={() => handleBatchStatusChange('WARNED')}
                disabled={actionLoading}
              >
                <i className="fas fa-exclamation-triangle mr-1"></i>경고
              </button>
              <button 
                className="admin-btn admin-btn-secondary admin-text-sm"
                onClick={() => handleBatchStatusChange('SUSPENDED')}
                disabled={actionLoading}
              >
                <i className="fas fa-pause mr-1"></i>정지
              </button>
              <button 
                className="admin-btn admin-btn-danger admin-text-sm"
                onClick={() => handleBatchStatusChange('BANNED')}
                disabled={actionLoading}
              >
                <i className="fas fa-ban mr-1"></i>차단
              </button>
              <button 
                className="admin-btn admin-btn-success admin-text-sm"
                onClick={() => handleBatchStatusChange('ACTIVE')}
                disabled={actionLoading}
              >
                <i className="fas fa-check mr-1"></i>활성화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 목록 */}
      <div className="admin-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>사용자 정보</th>
                <th>레벨</th>
                <th>활동 통계</th>
                <th>가입일</th>
                <th>최근 로그인</th>
                <th>상태</th>
                <th>신고</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                    로딩 중...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                    사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                <tr key={user.id}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td>
                    <div>
                      <div className="admin-text-sm admin-font-medium admin-text-gray-900">{user.nickname}</div>
                      <div className="admin-text-xs admin-text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{ 
                          color: getLevelColor(user.level), 
                          fontWeight: '600',
                          fontSize: '16px'
                        }}
                      >
                        Lv.{user.level}
                      </span>
                      <div style={{ 
                        width: '40px', 
                        height: '6px', 
                        background: '#e5e7eb', 
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div 
                          style={{ 
                            width: `${(user.level / 10) * 100}%`, 
                            height: '100%', 
                            background: getLevelColor(user.level) 
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-text-sm">
                      <div>게시글: <span className="admin-font-medium">{user.postsCount}</span></div>
                      <div>댓글: <span className="admin-font-medium">{user.commentsCount}</span></div>
                    </div>
                  </td>
                  <td className="admin-text-sm admin-text-gray-600">
                    {formatToKST(user.createdAt).substring(0, 10)}
                  </td>
                  <td className="admin-text-sm admin-text-gray-600">
                    {user.lastLoginAt ? formatToKST(user.lastLoginAt) : '없음'}
                  </td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>
                    <span 
                      style={{ 
                        color: user.reportsCount > 5 ? '#ef4444' : user.reportsCount > 2 ? '#f59e0b' : '#10b981',
                        fontWeight: '500'
                      }}
                    >
                      {user.reportsCount}건
                    </span>
                  </td>
                  <td>
                    <div className="admin-flex" style={{ gap: '4px' }}>
                      <button 
                        className="admin-btn admin-btn-secondary admin-text-xs"
                        onClick={() => handleUserAction('상세보기', user.id)}
                        title="상세보기"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="admin-btn admin-btn-secondary admin-text-xs"
                        onClick={() => handleUserAction('메시지', user.id)}
                        title="메시지 보내기"
                      >
                        <i className="fas fa-envelope"></i>
                      </button>
                      {user.status === 'ACTIVE' && (
                        <button 
                          className="admin-btn admin-btn-secondary admin-text-xs"
                          onClick={() => handleUserAction('경고', user.id)}
                          title="경고"
                          style={{ color: '#f59e0b' }}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-exclamation-triangle"></i>
                        </button>
                      )}
                      {user.status === 'WARNED' && (
                        <button 
                          className="admin-btn admin-btn-secondary admin-text-xs"
                          onClick={() => handleUserAction('정지', user.id)}
                          title="정지"
                          style={{ color: '#ef4444' }}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-pause"></i>
                        </button>
                      )}
                      {user.status !== 'BANNED' && (
                        <button 
                          className="admin-btn admin-btn-danger admin-text-xs"
                          onClick={() => handleUserAction('차단', user.id)}
                          title="차단"
                          disabled={actionLoading}
                        >
                          <i className="fas fa-ban"></i>
                        </button>
                      )}
                      {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                        <button 
                          className="admin-btn admin-btn-success admin-text-xs"
                          onClick={() => handleUserAction('활성화', user.id)}
                          title="활성화"
                          disabled={actionLoading}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      <button 
                        className="admin-btn admin-btn-danger admin-text-xs"
                        onClick={() => handleUserAction('삭제', user.id)}
                        title="삭제"
                        disabled={actionLoading}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {!loading && totalPages > 1 && (
          <div className="admin-flex-between" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <span className="admin-text-sm admin-text-gray-600">
              총 {totalElements}명의 사용자 (페이지 {currentPage + 1} / {totalPages})
            </span>
            <div className="admin-flex" style={{ gap: '8px' }}>
              <button 
                className="admin-btn admin-btn-secondary admin-text-sm"
                disabled={currentPage === 0}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                이전
              </button>
              
              {/* 페이지 번호들 */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (currentPage < 3) {
                  pageNum = i;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`admin-btn admin-text-sm ${
                      pageNum === currentPage ? 'admin-btn-primary' : 'admin-btn-secondary'
                    }`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              
              <button 
                className="admin-btn admin-btn-secondary admin-text-sm"
                disabled={currentPage === totalPages - 1}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 사용자 통계 요약 */}
      {stats && (
        <div className="admin-grid admin-grid-cols-4 admin-mt-6">
          <div className="admin-card admin-text-center">
            <div className="admin-text-2xl admin-font-bold" style={{ color: '#10b981' }}>
              {stats.activeUsers.toLocaleString()}
            </div>
            <div className="admin-text-sm admin-text-gray-600 admin-mt-1">정상 사용자</div>
          </div>
          <div className="admin-card admin-text-center">
            <div className="admin-text-2xl admin-font-bold" style={{ color: '#f59e0b' }}>
              {stats.warnedUsers.toLocaleString()}
            </div>
            <div className="admin-text-sm admin-text-gray-600 admin-mt-1">경고 상태</div>
          </div>
          <div className="admin-card admin-text-center">
            <div className="admin-text-2xl admin-font-bold" style={{ color: '#ef4444' }}>
              {stats.suspendedUsers.toLocaleString()}
            </div>
            <div className="admin-text-sm admin-text-gray-600 admin-mt-1">정지 상태</div>
          </div>
          <div className="admin-card admin-text-center">
            <div className="admin-text-2xl admin-font-bold" style={{ color: '#6b7280' }}>
              {stats.bannedUsers.toLocaleString()}
            </div>
            <div className="admin-text-sm admin-text-gray-600 admin-mt-1">차단 상태</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
