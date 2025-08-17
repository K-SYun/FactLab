import React, { useState } from 'react';

interface User {
  id: number;
  nickname: string;
  email: string;
  level: number;
  joinDate: string;
  lastLogin: string;
  posts: number;
  comments: number;
  status: 'active' | 'warned' | 'suspended' | 'banned';
  reports: number;
}

const UserManagement: React.FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [users] = useState<User[]>([
    {
      id: 1,
      nickname: "뉴스왕123",
      email: "news***@gmail.com",
      level: 5,
      joinDate: "2023-12-01",
      lastLogin: "2024-01-15 14:30",
      posts: 47,
      comments: 256,
      status: "active",
      reports: 0
    },
    {
      id: 2,
      nickname: "팩트체커",
      email: "fact***@naver.com",
      level: 7,
      joinDate: "2023-11-15",
      lastLogin: "2024-01-15 13:45",
      posts: 128,
      comments: 892,
      status: "active",
      reports: 1
    },
    {
      id: 3,
      nickname: "의심많은사람",
      email: "doubt***@kakao.com",
      level: 3,
      joinDate: "2024-01-05",
      lastLogin: "2024-01-14 20:15",
      posts: 23,
      comments: 145,
      status: "warned",
      reports: 3
    },
    {
      id: 4,
      nickname: "정치싫어",
      email: "nopol***@gmail.com",
      level: 2,
      joinDate: "2024-01-10",
      lastLogin: "2024-01-12 09:30",
      posts: 5,
      comments: 28,
      status: "suspended",
      reports: 7
    },
    {
      id: 5,
      nickname: "광고봇계정",
      email: "spam***@temp.com",
      level: 1,
      joinDate: "2024-01-14",
      lastLogin: "2024-01-14 22:00",
      posts: 15,
      comments: 3,
      status: "banned",
      reports: 12
    }
  ]);

  const filteredUsers = users.filter(user => {
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesSearch = user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleUserAction = (action: string, userId?: number) => {
    if (userId) {
      console.log(`사용자 ${action}:`, userId);
    } else {
      console.log(`선택된 사용자들 ${action}:`, selectedUsers);
    }
    // 실제 구현에서는 API 호출
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { text: '정상', class: 'admin-status-green' },
      warned: { text: '경고', class: 'admin-status-orange' },
      suspended: { text: '정지', class: 'admin-status-red' },
      banned: { text: '차단', class: 'admin-status-red' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`admin-status-badge ${config.class}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
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

      {/* 필터 및 검색 */}
      <div className="admin-card admin-mb-6">
        <div className="admin-grid admin-grid-cols-3" style={{ gap: '16px', alignItems: 'end' }}>
          <div>
            <label className="admin-label">상태 필터</label>
            <select 
              className="admin-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="active">정상</option>
              <option value="warned">경고</option>
              <option value="suspended">정지</option>
              <option value="banned">차단</option>
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
            <button className="admin-btn admin-btn-secondary">
              <i className="fas fa-search mr-1"></i>검색
            </button>
            <button className="admin-btn admin-btn-secondary">
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
                onClick={() => handleUserAction('경고')}
              >
                <i className="fas fa-exclamation-triangle mr-1"></i>경고
              </button>
              <button 
                className="admin-btn admin-btn-secondary admin-text-sm"
                onClick={() => handleUserAction('정지')}
              >
                <i className="fas fa-pause mr-1"></i>정지
              </button>
              <button 
                className="admin-btn admin-btn-danger admin-text-sm"
                onClick={() => handleUserAction('차단')}
              >
                <i className="fas fa-ban mr-1"></i>차단
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
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
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
              {filteredUsers.map(user => (
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
                      <div>게시글: <span className="admin-font-medium">{user.posts}</span></div>
                      <div>댓글: <span className="admin-font-medium">{user.comments}</span></div>
                    </div>
                  </td>
                  <td className="admin-text-sm admin-text-gray-600">{user.joinDate}</td>
                  <td className="admin-text-sm admin-text-gray-600">{user.lastLogin}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>
                    <span 
                      style={{ 
                        color: user.reports > 5 ? '#ef4444' : user.reports > 2 ? '#f59e0b' : '#10b981',
                        fontWeight: '500'
                      }}
                    >
                      {user.reports}건
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
                      {user.status === 'active' && (
                        <button 
                          className="admin-btn admin-btn-secondary admin-text-xs"
                          onClick={() => handleUserAction('경고', user.id)}
                          title="경고"
                          style={{ color: '#f59e0b' }}
                        >
                          <i className="fas fa-exclamation-triangle"></i>
                        </button>
                      )}
                      {user.status !== 'banned' && (
                        <button 
                          className="admin-btn admin-btn-danger admin-text-xs"
                          onClick={() => handleUserAction('차단', user.id)}
                          title="차단"
                        >
                          <i className="fas fa-ban"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="admin-flex-between" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <span className="admin-text-sm admin-text-gray-600">
            총 {filteredUsers.length}명의 사용자 (전체 {users.length}명)
          </span>
          <div className="admin-flex" style={{ gap: '8px' }}>
            <button className="admin-btn admin-btn-secondary admin-text-sm">이전</button>
            <button className="admin-btn admin-btn-primary admin-text-sm">1</button>
            <button className="admin-btn admin-btn-secondary admin-text-sm">2</button>
            <button className="admin-btn admin-btn-secondary admin-text-sm">3</button>
            <button className="admin-btn admin-btn-secondary admin-text-sm">다음</button>
          </div>
        </div>
      </div>

      {/* 사용자 통계 요약 */}
      <div className="admin-grid admin-grid-cols-4 admin-mt-6">
        <div className="admin-card admin-text-center">
          <div className="admin-text-2xl admin-font-bold" style={{ color: '#10b981' }}>
            {users.filter(u => u.status === 'active').length}
          </div>
          <div className="admin-text-sm admin-text-gray-600 admin-mt-1">정상 사용자</div>
        </div>
        <div className="admin-card admin-text-center">
          <div className="admin-text-2xl admin-font-bold" style={{ color: '#f59e0b' }}>
            {users.filter(u => u.status === 'warned').length}
          </div>
          <div className="admin-text-sm admin-text-gray-600 admin-mt-1">경고 상태</div>
        </div>
        <div className="admin-card admin-text-center">
          <div className="admin-text-2xl admin-font-bold" style={{ color: '#ef4444' }}>
            {users.filter(u => u.status === 'suspended').length}
          </div>
          <div className="admin-text-sm admin-text-gray-600 admin-mt-1">정지 상태</div>
        </div>
        <div className="admin-card admin-text-center">
          <div className="admin-text-2xl admin-font-bold" style={{ color: '#6b7280' }}>
            {users.filter(u => u.status === 'banned').length}
          </div>
          <div className="admin-text-sm admin-text-gray-600 admin-mt-1">차단 상태</div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;