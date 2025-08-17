import React, { useState } from 'react';

interface Board {
  id: number;
  name: string;
  category: string;
  posts: number;
  comments: number;
  activeUsers: number;
  recentActivity: string;
  status: 'active' | 'monitoring' | 'restricted';
  reports: number;
}

interface Report {
  id: number;
  type: 'post' | 'comment' | 'user';
  target: string;
  reason: string;
  reporter: string;
  reportDate: string;
  status: 'pending' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high';
}

const CommunityMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'boards' | 'reports' | 'analytics'>('boards');
  
  const [boards] = useState<Board[]>([
    {
      id: 1,
      name: "정치 토론장",
      category: "정치",
      posts: 1247,
      comments: 8934,
      activeUsers: 524,
      recentActivity: "2분 전",
      status: "monitoring",
      reports: 12
    },
    {
      id: 2,
      name: "기술 뉴스",
      category: "기술",
      posts: 892,
      comments: 3456,
      activeUsers: 298,
      recentActivity: "5분 전",
      status: "active",
      reports: 2
    },
    {
      id: 3,
      name: "경제 분석",
      category: "경제",
      posts: 634,
      comments: 2134,
      activeUsers: 187,
      recentActivity: "8분 전",
      status: "active",
      reports: 5
    },
    {
      id: 4,
      name: "사회 이슈",
      category: "사회",
      posts: 789,
      comments: 4567,
      activeUsers: 345,
      recentActivity: "1분 전",
      status: "restricted",
      reports: 23
    }
  ]);

  const [reports] = useState<Report[]>([
    {
      id: 1,
      type: "post",
      target: "정치 혐오 발언 게시글",
      reason: "혐오 발언",
      reporter: "시민***",
      reportDate: "2024-01-15 14:30",
      status: "pending",
      severity: "high"
    },
    {
      id: 2,
      type: "comment",
      target: "욕설이 포함된 댓글",
      reason: "욕설/비방",
      reporter: "정의***",
      reportDate: "2024-01-15 13:45",
      status: "pending",
      severity: "medium"
    },
    {
      id: 3,
      type: "user",
      target: "광고봇계정",
      reason: "스팸/광고",
      reporter: "관리***",
      reportDate: "2024-01-15 12:20",
      status: "resolved",
      severity: "low"
    }
  ]);

  const handleBoardAction = (action: string, boardId: number) => {
    console.log(`게시판 ${action}:`, boardId);
    // 실제 구현에서는 API 호출
  };

  const handleReportAction = (action: string, reportId: number) => {
    console.log(`신고 ${action}:`, reportId);
    // 실제 구현에서는 API 호출
  };

  const getStatusBadge = (status: string, type: 'board' | 'report' = 'board') => {
    if (type === 'board') {
      const config = {
        active: { text: '정상', class: 'admin-status-green' },
        monitoring: { text: '모니터링', class: 'admin-status-orange' },
        restricted: { text: '제한', class: 'admin-status-red' }
      };
      const { text, class: className } = config[status as keyof typeof config] || config.active;
      
      return (
        <span className={`admin-status-badge ${className}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>
          {text}
        </span>
      );
    } else {
      const config = {
        pending: { text: '대기', class: 'admin-status-orange' },
        resolved: { text: '해결', class: 'admin-status-green' },
        dismissed: { text: '기각', class: 'admin-status-red' }
      };
      const { text, class: className } = config[status as keyof typeof config] || config.pending;
      
      return (
        <span className={`admin-status-badge ${className}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>
          {text}
        </span>
      );
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      low: { text: '낮음', class: 'admin-status-green' },
      medium: { text: '보통', class: 'admin-status-orange' },
      high: { text: '높음', class: 'admin-status-red' }
    };
    const { text, class: className } = config[severity as keyof typeof config] || config.low;
    
    return (
      <span className={`admin-status-badge ${className}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>
        {text}
      </span>
    );
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-flex-between admin-mb-6">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800">커뮤니티 모니터링</h1>
        <div className="admin-flex" style={{ gap: '12px' }}>
          <button className="admin-btn admin-btn-primary">
            <i className="fas fa-plus mr-2"></i>
            새 게시판 생성
          </button>
          <button className="admin-btn admin-btn-secondary">
            <i className="fas fa-shield-alt mr-2"></i>
            자동 모니터링 설정
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="admin-card admin-mb-6">
        <nav style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { key: 'boards', label: '게시판 관리', icon: 'fas fa-layer-group' },
              { key: 'reports', label: '신고 관리', icon: 'fas fa-flag', count: reports.filter(r => r.status === 'pending').length },
              { key: 'analytics', label: '활동 분석', icon: 'fas fa-chart-line' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '12px 0',
                  border: 'none',
                  background: 'none',
                  color: activeTab === tab.key ? '#4f46e5' : '#6b7280',
                  borderBottom: activeTab === tab.key ? '2px solid #4f46e5' : '2px solid transparent',
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className={tab.icon}></i>
                {tab.label}
                {tab.count && (
                  <span className="admin-status-badge admin-status-red" style={{ marginLeft: '4px' }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* 게시판 관리 탭 */}
      {activeTab === 'boards' && (
        <div>
          <div className="admin-card admin-mb-6">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">게시판 현황</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>게시판 정보</th>
                    <th>활동 통계</th>
                    <th>활성 사용자</th>
                    <th>최근 활동</th>
                    <th>상태</th>
                    <th>신고</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {boards.map(board => (
                    <tr key={board.id}>
                      <td>
                        <div>
                          <div className="admin-text-sm admin-font-medium admin-text-gray-900">{board.name}</div>
                          <div className="admin-text-xs admin-text-gray-500">{board.category}</div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-text-sm">
                          <div>게시글: <span className="admin-font-medium">{board.posts.toLocaleString()}</span></div>
                          <div>댓글: <span className="admin-font-medium">{board.comments.toLocaleString()}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                          <span className="admin-text-sm admin-font-medium">{board.activeUsers}</span>
                          <i className="fas fa-users admin-text-xs admin-text-gray-500"></i>
                        </div>
                      </td>
                      <td className="admin-text-sm admin-text-gray-600">{board.recentActivity}</td>
                      <td>{getStatusBadge(board.status, 'board')}</td>
                      <td>
                        <span 
                          style={{ 
                            color: board.reports > 10 ? '#ef4444' : board.reports > 5 ? '#f59e0b' : '#10b981',
                            fontWeight: '500'
                          }}
                        >
                          {board.reports}건
                        </span>
                      </td>
                      <td>
                        <div className="admin-flex" style={{ gap: '4px' }}>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleBoardAction('상세보기', board.id)}
                            title="상세보기"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleBoardAction('설정', board.id)}
                            title="설정"
                          >
                            <i className="fas fa-cog"></i>
                          </button>
                          {board.status === 'active' && (
                            <button 
                              className="admin-btn admin-btn-secondary admin-text-xs"
                              onClick={() => handleBoardAction('모니터링', board.id)}
                              title="모니터링 설정"
                              style={{ color: '#f59e0b' }}
                            >
                              <i className="fas fa-shield-alt"></i>
                            </button>
                          )}
                          {board.status === 'restricted' && (
                            <button 
                              className="admin-btn admin-btn-success admin-text-xs"
                              onClick={() => handleBoardAction('제한해제', board.id)}
                              title="제한 해제"
                            >
                              <i className="fas fa-unlock"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 신고 관리 탭 */}
      {activeTab === 'reports' && (
        <div>
          <div className="admin-card admin-mb-6">
            <div className="admin-flex-between admin-mb-4">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">신고 목록</h3>
              <div className="admin-flex" style={{ gap: '8px' }}>
                <select className="admin-select" style={{ width: 'auto' }}>
                  <option>전체 유형</option>
                  <option>게시글</option>
                  <option>댓글</option>
                  <option>사용자</option>
                </select>
                <select className="admin-select" style={{ width: 'auto' }}>
                  <option>전체 심각도</option>
                  <option>높음</option>
                  <option>보통</option>
                  <option>낮음</option>
                </select>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>신고 유형</th>
                    <th>신고 대상</th>
                    <th>신고 사유</th>
                    <th>신고자</th>
                    <th>신고일</th>
                    <th>심각도</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td>
                        <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                          <i className={`fas ${
                            report.type === 'post' ? 'fa-file-alt' : 
                            report.type === 'comment' ? 'fa-comment' : 'fa-user'
                          }`} style={{ color: '#6b7280' }}></i>
                          <span className="admin-text-sm">
                            {report.type === 'post' ? '게시글' : 
                             report.type === 'comment' ? '댓글' : '사용자'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-text-sm admin-text-gray-900" style={{ maxWidth: '200px' }}>
                          {report.target}
                        </div>
                      </td>
                      <td className="admin-text-sm admin-text-gray-700">{report.reason}</td>
                      <td className="admin-text-sm admin-text-gray-600">{report.reporter}</td>
                      <td className="admin-text-sm admin-text-gray-600">{report.reportDate}</td>
                      <td>{getSeverityBadge(report.severity)}</td>
                      <td>{getStatusBadge(report.status, 'report')}</td>
                      <td>
                        <div className="admin-flex" style={{ gap: '4px' }}>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleReportAction('상세보기', report.id)}
                            title="상세보기"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          {report.status === 'pending' && (
                            <>
                              <button 
                                className="admin-btn admin-btn-success admin-text-xs"
                                onClick={() => handleReportAction('승인', report.id)}
                                title="신고 승인"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button 
                                className="admin-btn admin-btn-danger admin-text-xs"
                                onClick={() => handleReportAction('기각', report.id)}
                                title="신고 기각"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 활동 분석 탭 */}
      {activeTab === 'analytics' && (
        <div>
          <div className="admin-grid admin-grid-cols-2 admin-mb-6">
            <div className="admin-card">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">게시판별 활동량</h3>
              <div style={{ height: '300px', background: '#f9fafb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="admin-text-gray-500">차트 영역 (Chart.js 구현 예정)</p>
              </div>
            </div>
            
            <div className="admin-card">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">신고 유형 분포</h3>
              <div style={{ height: '300px', background: '#f9fafb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="admin-text-gray-500">원형 차트 영역 (Chart.js 구현 예정)</p>
              </div>
            </div>
          </div>

          <div className="admin-grid admin-grid-cols-4 admin-mb-6">
            <div className="admin-card admin-text-center">
              <div className="admin-text-2xl admin-font-bold" style={{ color: '#10b981' }}>
                {boards.reduce((sum, board) => sum + board.posts, 0).toLocaleString()}
              </div>
              <div className="admin-text-sm admin-text-gray-600 admin-mt-1">총 게시글</div>
            </div>
            <div className="admin-card admin-text-center">
              <div className="admin-text-2xl admin-font-bold" style={{ color: '#3b82f6' }}>
                {boards.reduce((sum, board) => sum + board.comments, 0).toLocaleString()}
              </div>
              <div className="admin-text-sm admin-text-gray-600 admin-mt-1">총 댓글</div>
            </div>
            <div className="admin-card admin-text-center">
              <div className="admin-text-2xl admin-font-bold" style={{ color: '#8b5cf6' }}>
                {boards.reduce((sum, board) => sum + board.activeUsers, 0).toLocaleString()}
              </div>
              <div className="admin-text-sm admin-text-gray-600 admin-mt-1">활성 사용자</div>
            </div>
            <div className="admin-card admin-text-center">
              <div className="admin-text-2xl admin-font-bold" style={{ color: '#ef4444' }}>
                {reports.filter(r => r.status === 'pending').length}
              </div>
              <div className="admin-text-sm admin-text-gray-600 admin-mt-1">대기 중 신고</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityMonitoring;