import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminLogout } from '../../api/auth';
import { getBackendApiBase } from '../../utils/api';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [counters, setCounters] = useState({
    newsCollected: 0,
    activeBoardCount: 0,
    aiPending: 0
  });

  const systemStatus = {
    newsCollection: 'normal',
    aiSummary: 'working',
    community: 'active',
    alertStatus: 'normal',
    apiStatus: 'normal'
  };

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    const confirmLogout = window.confirm('정말로 로그아웃 하시겠습니까?');
    if (!confirmLogout) {
      return;
    }

    try {
      await adminLogout();
      alert('로그아웃이 완료되었습니다.');
      // 로그인 페이지로 리다이렉트
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      alert('로그아웃 중 오류가 발생했지만 로그아웃 처리됩니다.');
      // 에러가 발생해도 로컬 스토리지 정리 및 리다이렉트
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/login', { replace: true });
    }
  };

  // 카운터 업데이트 (API 연결 기반)
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        let aiPendingCount = 0;
        let reviewPendingCount = 0;
        let activeBoardCount = 0;

        // AI 뉴스분석: 백엔드 API 호출
        try {
          const aiResponse = await fetch(`${getBackendApiBase()}/news-summary/status/PENDING`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          if (aiResponse.ok) {
            const result = await aiResponse.json();
            aiPendingCount = result.success && Array.isArray(result.data) ? result.data.length : 0;
          }
        } catch (error) {
          console.log('AI 서비스 연결 실패 - 기본값 사용');
          aiPendingCount = 0;
        }

        // 뉴스 관리: 승인 대기 뉴스 개수
        try {
          const newsResponse = await fetch(`${getBackendApiBase()}/news/approved`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          if (newsResponse.ok) {
            const result = await newsResponse.json();
            reviewPendingCount = result.success && Array.isArray(result.data) ? result.data.length : 0;
          }
        } catch (error) {
          console.log('뉴스 서비스 연결 실패 - 기본값 사용');
          reviewPendingCount = 0;
        }

        // 게시판 관리: 활성 게시판 개수
        try {
          const boardResponse = await fetch(`${getBackendApiBase()}/boards`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          if (boardResponse.ok) {
            const result = await boardResponse.json();
            activeBoardCount = result.success && Array.isArray(result.data) ? result.data.length : 0;
          }
        } catch (error) {
          console.log('게시판 서비스 연결 실패 - 기본값 사용');
          activeBoardCount = 0;
        }

        setCounters({
          aiPending: Math.max(0, aiPendingCount),
          newsCollected: Math.max(0, reviewPendingCount),
          activeBoardCount: Math.max(0, activeBoardCount)
        });

      } catch (error) {
        console.error('카운터 업데이트 오류:', error);
        // 기본값 유지
        setCounters({
          aiPending: 0,
          newsCollected: 0,
          activeBoardCount: 0
        });
      }
    };

    // 초기 로드
    fetchCounts();

    // 30초마다 업데이트
    const interval = setInterval(fetchCounts, 30000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/' || path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-400';
      case 'warning': return 'text-yellow-400 admin-pulse';
      case 'error': return 'text-red-400 admin-pulse';
      default: return 'text-green-400';
    }
  };

  const getAiCounterClass = (count: number) => {
    if (count > 50) return 'admin-nav-badge admin-status-red';
    if (count > 20) return 'admin-nav-badge admin-status-orange';
    return 'admin-nav-badge admin-status-green';
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        FactLab Admin
      </div>

      <nav className="admin-sidebar-nav">
        <div className="admin-nav-section">
          <Link
            to="/dashboard"
            className={`admin-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <i className="fas fa-tachometer-alt" style={{ color: '#4f46e5' }}></i>
            <span>대시보드</span>
          </Link>

          <Link
            to="/ai"
            className={`admin-nav-link ${isActive('/ai') ? 'active' : ''}`}
          >
            <i className="fas fa-robot" style={{ color: '#f59e0b' }}></i>
            <span>AI 뉴스분석</span>
            <span className={getAiCounterClass(counters.aiPending)}>{counters.aiPending}</span>
          </Link>

          <Link
            to="/news"
            className={`admin-nav-link ${isActive('/news') ? 'active' : ''}`}
          >
            <i className="fas fa-newspaper" style={{ color: '#10b981' }}></i>
            <span>뉴스 관리</span>
            <span className="admin-nav-badge admin-status-green">+{counters.newsCollected}</span>
          </Link>

          <Link
            to="/bills"
            className={`admin-nav-link ${isActive('/bills') ? 'active' : ''}`}
          >
            <i className="fas fa-gavel" style={{ color: '#7c3aed' }}></i>
            <span>법안 관리</span>
            <span className="admin-nav-badge admin-status-purple">정치</span>
          </Link>

          <Link
            to="/users"
            className={`admin-nav-link ${isActive('/users') ? 'active' : ''}`}
          >
            <i className="fas fa-users" style={{ color: '#3b82f6' }}></i>
            <span>사용자 관리</span>
          </Link>

          <Link
            to="/boards"
            className={`admin-nav-link ${isActive('/boards') ? 'active' : ''}`}
          >
            <i className="fas fa-layer-group" style={{ color: '#8b5cf6' }}></i>
            <span>게시판 관리</span>
            <span className="admin-nav-badge admin-status-purple">{counters.activeBoardCount}</span>
          </Link>

          <Link
            to="/popups"
            className={`admin-nav-link ${isActive('/popups') ? 'active' : ''}`}
          >
            <i className="fas fa-window-restore" style={{ color: '#f59e0b' }}></i>
            <span>팝업 관리</span>
          </Link>

          <Link
            to="/notices"
            className={`admin-nav-link ${isActive('/notices') ? 'active' : ''}`}
          >
            <i className="fas fa-bullhorn" style={{ color: '#10b981' }}></i>
            <span>공지사항</span>
          </Link>
        </div>

        <div className="admin-nav-section">
          <div className="admin-nav-title">고급 기능</div>

          <Link
            to="/ads"
            className={`admin-nav-link ${isActive('/ads') ? 'active' : ''}`}
          >
            <i className="fas fa-bullhorn" style={{ color: '#eab308' }}></i>
            <span>광고 관리</span>
            <span className="admin-nav-badge admin-status-orange">수익화</span>
          </Link>

          <Link
            to="/reports"
            className={`admin-nav-link ${isActive('/reports') ? 'active' : ''}`}
          >
            <i className="fas fa-chart-bar" style={{ color: '#06b6d4' }}></i>
            <span>분석 리포트</span>
          </Link>

          <Link
            to="/api"
            className={`admin-nav-link ${isActive('/api') ? 'active' : ''}`}
          >
            <i className="fas fa-code" style={{ color: '#6366f1' }}></i>
            <span>API 관리</span>
            <span className="ml-auto">
              <i className={`fas fa-circle text-xs ${getStatusColor(systemStatus.apiStatus)}`}></i>
            </span>
          </Link>
        </div>

        <div className="admin-nav-section">
          <div className="admin-nav-title">시스템</div>

          <Link
            to="/admin-users"
            className={`admin-nav-link ${isActive('/admin-users') ? 'active' : ''}`}
          >
            <i className="fas fa-user-shield" style={{ color: '#dc2626' }}></i>
            <span>관리자 계정</span>
          </Link>

          <Link
            to="/settings"
            className={`admin-nav-link ${isActive('/settings') ? 'active' : ''}`}
          >
            <i className="fas fa-cog" style={{ color: '#6b7280' }}></i>
            <span>설정</span>
          </Link>

          <Link
            to="/logs"
            className={`admin-nav-link ${isActive('/logs') ? 'active' : ''}`}
          >
            <i className="fas fa-file-alt" style={{ color: '#6b7280' }}></i>
            <span>시스템 로그</span>
          </Link>

          <Link
            to="/backup"
            className={`admin-nav-link ${isActive('/backup') ? 'active' : ''}`}
          >
            <i className="fas fa-database" style={{ color: '#6b7280' }}></i>
            <span>백업 관리</span>
          </Link>
        </div>

        {/* 하단 시스템 상태 */}
        <div style={{ position: 'absolute', bottom: '0', width: '100%', padding: '16px', borderTop: '1px solid #e5e7eb', background: 'white' }}>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
            <div className="admin-flex-between admin-text-xs admin-text-gray-600 admin-mb-1">
              <span>뉴스 수집</span>
              <span className="admin-text-green-600">{systemStatus.newsCollection === 'normal' ? '정상' : '오류'}</span>
            </div>
            <div className="admin-flex-between admin-text-xs admin-text-gray-600 admin-mb-1">
              <span>AI 요약</span>
              <span className="admin-text-green-600">{systemStatus.aiSummary === 'working' ? '작동중' : '정지'}</span>
            </div>
            <div className="admin-flex-between admin-text-xs admin-text-gray-600">
              <span>커뮤니티</span>
              <span className="admin-text-blue-600">{systemStatus.community === 'active' ? '활성' : '비활성'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="admin-flex-between"
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0'
            }}
            title="로그아웃"
          >
            <div className="admin-flex" style={{ alignItems: 'center' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '8px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                A
              </div>
              <span className="admin-text-sm admin-text-gray-600">관리자 로그아웃</span>
            </div>
            <div
              className="admin-text-gray-400"
              style={{
                fontSize: '16px',
                padding: '4px'
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;