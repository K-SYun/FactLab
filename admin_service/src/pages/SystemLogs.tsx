import React, { useState, useEffect } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
  details?: string;
  userId?: number;
  ip?: string;
}

interface LogSettings {
  retentionDays: number;
  maxFileSize: number;
  logLevel: string;
  enableRealtime: boolean;
  alertThreshold: number;
  emailAlerts: boolean;
}

const SystemLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'realtime' | 'search' | 'settings' | 'alerts'>('realtime');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRealtime, setIsRealtime] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterService, setFilterService] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [logSettings, setLogSettings] = useState<LogSettings>({
    retentionDays: 30,
    maxFileSize: 100,
    logLevel: 'INFO',
    enableRealtime: true,
    alertThreshold: 5,
    emailAlerts: true
  });

  // 초기 로그 데이터
  useEffect(() => {
    const initialLogs: LogEntry[] = [
      {
        id: 1,
        timestamp: "2024-01-15 14:30:25",
        level: "INFO",
        service: "news-crawler",
        message: "뉴스 수집 작업 시작",
        details: "네이버 뉴스 RSS 피드에서 100건 수집 시작",
        ip: "192.168.1.100"
      },
      {
        id: 2,
        timestamp: "2024-01-15 14:30:15",
        level: "WARN",
        service: "ai-service",
        message: "API 응답 시간 초과 경고",
        details: "OpenAI API 응답 시간: 5.2초 (임계값: 3초)",
        ip: "192.168.1.101"
      },
      {
        id: 3,
        timestamp: "2024-01-15 14:29:58",
        level: "ERROR",
        service: "database",
        message: "데이터베이스 연결 실패",
        details: "Connection timeout after 30 seconds. Pool: 10/10 connections in use.",
        ip: "192.168.1.102"
      },
      {
        id: 4,
        timestamp: "2024-01-15 14:29:45",
        level: "INFO",
        service: "user-service",
        message: "사용자 로그인 성공",
        details: "사용자 ID: 1247, 세션 생성됨",
        userId: 1247,
        ip: "203.241.123.45"
      },
      {
        id: 5,
        timestamp: "2024-01-15 14:29:30",
        level: "DEBUG",
        service: "crawler-ai",
        message: "AI 요약 처리 완료",
        details: "뉴스 ID: 5678, 처리 시간: 1.2초",
        ip: "192.168.1.103"
      },
      {
        id: 6,
        timestamp: "2024-01-15 14:29:12",
        level: "ERROR",
        service: "twitter-api",
        message: "Twitter API 요청 한도 초과",
        details: "Rate limit exceeded. Reset time: 2024-01-15 15:00:00",
        ip: "192.168.1.104"
      }
    ];
    setLogs(initialLogs);
  }, []);

  // 실시간 로그 시뮬레이션
  useEffect(() => {
    if (!isRealtime) return;

    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).replace(/\. /g, '-').replace('.', ''),
        level: ['INFO', 'WARN', 'ERROR', 'DEBUG'][Math.floor(Math.random() * 4)] as LogEntry['level'],
        service: ['news-crawler', 'ai-service', 'user-service', 'database', 'twitter-api'][Math.floor(Math.random() * 5)],
        message: [
          "새로운 뉴스 수집 완료",
          "AI 요약 처리 중",
          "사용자 활동 감지",
          "데이터베이스 쿼리 실행",
          "API 호출 성공"
        ][Math.floor(Math.random() * 5)],
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`
      };
      
      setLogs(prev => [newLog, ...prev.slice(0, 99)]); // 최대 100개 유지
    }, 3000);

    return () => clearInterval(interval);
  }, [isRealtime]);

  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'ALL' || log.level === filterLevel;
    const serviceMatch = filterService === 'ALL' || log.service === filterService;
    const searchMatch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    return levelMatch && serviceMatch && searchMatch;
  });

  const handleExportLogs = () => {
    console.log('로그 내보내기');
    // 실제 구현에서는 CSV/JSON 파일 다운로드
  };

  const handleClearLogs = () => {
    console.log('로그 삭제');
    setLogs([]);
  };

  const handleUpdateSettings = () => {
    console.log('로그 설정 업데이트:', logSettings);
    // 실제 구현에서는 API 호출
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return '#ef4444';
      case 'WARN': return '#f59e0b';
      case 'INFO': return '#10b981';
      case 'DEBUG': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getLevelBadge = (level: string) => {
    const color = getLevelColor(level);
    return (
      <span 
        style={{ 
          background: color, 
          color: 'white', 
          padding: '2px 6px', 
          borderRadius: '4px', 
          fontSize: '10px',
          fontWeight: '600'
        }}
      >
        {level}
      </span>
    );
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'news-crawler': return 'fas fa-newspaper';
      case 'ai-service': return 'fas fa-brain';
      case 'user-service': return 'fas fa-users';
      case 'database': return 'fas fa-database';
      case 'twitter-api': return 'fab fa-twitter';
      default: return 'fas fa-cog';
    }
  };

  const logLevelCounts = {
    ERROR: logs.filter(log => log.level === 'ERROR').length,
    WARN: logs.filter(log => log.level === 'WARN').length,
    INFO: logs.filter(log => log.level === 'INFO').length,
    DEBUG: logs.filter(log => log.level === 'DEBUG').length
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-flex-between admin-mb-6">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800">시스템 로그</h1>
        <div className="admin-flex" style={{ gap: '12px' }}>
          <button 
            className={`admin-btn ${isRealtime ? 'admin-btn-danger' : 'admin-btn-success'}`}
            onClick={() => setIsRealtime(!isRealtime)}
          >
            <i className={`fas ${isRealtime ? 'fa-pause' : 'fa-play'} mr-2`}></i>
            {isRealtime ? '실시간 정지' : '실시간 시작'}
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={handleExportLogs}>
            <i className="fas fa-download mr-2"></i>
            로그 내보내기
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="admin-card admin-mb-6">
        <nav style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { key: 'realtime', label: '실시간 로그', icon: 'fas fa-stream' },
              { key: 'search', label: '로그 검색', icon: 'fas fa-search' },
              { key: 'settings', label: '로그 설정', icon: 'fas fa-cog' },
              { key: 'alerts', label: '알림 설정', icon: 'fas fa-bell' }
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
                {tab.key === 'realtime' && isRealtime && (
                  <span className="admin-text-xs" style={{ color: '#ef4444' }}>●</span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* 실시간 로그 탭 */}
      {activeTab === 'realtime' && (
        <div>
          {/* 로그 레벨 통계 */}
          <div className="admin-grid admin-grid-cols-4 admin-mb-6">
            <div className="admin-card admin-text-center" style={{ background: '#fecaca', color: '#7f1d1d' }}>
              <div className="admin-text-2xl admin-font-bold">{logLevelCounts.ERROR}</div>
              <div className="admin-text-sm admin-mt-1">ERROR</div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: '#fed7aa', color: '#92400e' }}>
              <div className="admin-text-2xl admin-font-bold">{logLevelCounts.WARN}</div>
              <div className="admin-text-sm admin-mt-1">WARN</div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: '#dcfce7', color: '#14532d' }}>
              <div className="admin-text-2xl admin-font-bold">{logLevelCounts.INFO}</div>
              <div className="admin-text-sm admin-mt-1">INFO</div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: '#f3f4f6', color: '#374151' }}>
              <div className="admin-text-2xl admin-font-bold">{logLevelCounts.DEBUG}</div>
              <div className="admin-text-sm admin-mt-1">DEBUG</div>
            </div>
          </div>

          {/* 필터 컨트롤 */}
          <div className="admin-card admin-mb-4">
            <div className="admin-flex" style={{ gap: '16px', alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label className="admin-label">로그 레벨</label>
                <select 
                  className="admin-select"
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  <option value="ALL">전체</option>
                  <option value="ERROR">ERROR</option>
                  <option value="WARN">WARN</option>
                  <option value="INFO">INFO</option>
                  <option value="DEBUG">DEBUG</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="admin-label">서비스</label>
                <select 
                  className="admin-select"
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                >
                  <option value="ALL">전체</option>
                  <option value="news-crawler">뉴스 크롤러</option>
                  <option value="ai-service">AI 서비스</option>
                  <option value="user-service">사용자 서비스</option>
                  <option value="database">데이터베이스</option>
                  <option value="twitter-api">Twitter API</option>
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label className="admin-label">검색</label>
                <input 
                  type="text"
                  className="admin-input"
                  placeholder="메시지 또는 상세 내용으로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className="admin-btn admin-btn-secondary"
                onClick={handleClearLogs}
              >
                <i className="fas fa-trash mr-1"></i>로그 삭제
              </button>
            </div>
          </div>

          {/* 로그 뷰어 (터미널 스타일) */}
          <div className="admin-card">
            <div className="admin-flex-between admin-mb-4">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">
                로그 뷰어 ({filteredLogs.length}건)
              </h3>
              <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                <span className="admin-text-sm admin-text-gray-600">
                  {isRealtime ? '실시간 모드' : '정적 모드'}
                </span>
                {isRealtime && (
                  <span className="admin-text-xs" style={{ color: '#ef4444' }}>● LIVE</span>
                )}
              </div>
            </div>
            
            <div 
              style={{ 
                background: '#1f2937',
                color: '#f9fafb',
                padding: '16px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.4',
                maxHeight: '600px',
                overflowY: 'auto'
              }}
            >
              {filteredLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  필터 조건에 맞는 로그가 없습니다.
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div 
                    key={log.id} 
                    style={{ 
                      marginBottom: '8px', 
                      padding: '8px',
                      borderLeft: `3px solid ${getLevelColor(log.level)}`,
                      background: 'rgba(75, 85, 99, 0.3)',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#9ca3af' }}>{log.timestamp}</span>
                      {getLevelBadge(log.level)}
                      <span style={{ color: '#60a5fa' }}>[{log.service}]</span>
                      {log.ip && (
                        <span style={{ color: '#fbbf24', fontSize: '11px' }}>({log.ip})</span>
                      )}
                    </div>
                    <div style={{ color: '#f9fafb', marginBottom: '2px' }}>
                      {log.message}
                    </div>
                    {log.details && (
                      <div style={{ color: '#d1d5db', fontSize: '12px', marginLeft: '16px' }}>
                        └─ {log.details}
                      </div>
                    )}
                    {log.userId && (
                      <div style={{ color: '#a78bfa', fontSize: '11px', marginLeft: '16px' }}>
                        └─ User ID: {log.userId}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 로그 검색 탭 */}
      {activeTab === 'search' && (
        <div>
          <div className="admin-card admin-mb-6">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">고급 로그 검색</h3>
            <div className="admin-grid admin-grid-cols-2" style={{ gap: '16px' }}>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">날짜 범위</label>
                  <div className="admin-flex" style={{ gap: '8px' }}>
                    <input type="date" className="admin-input" />
                    <span className="admin-text-sm admin-text-gray-500" style={{ alignSelf: 'center' }}>~</span>
                    <input type="date" className="admin-input" />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">시간 범위</label>
                  <div className="admin-flex" style={{ gap: '8px' }}>
                    <input type="time" className="admin-input" />
                    <span className="admin-text-sm admin-text-gray-500" style={{ alignSelf: 'center' }}>~</span>
                    <input type="time" className="admin-input" />
                  </div>
                </div>
              </div>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">사용자 ID</label>
                  <input type="number" className="admin-input" placeholder="특정 사용자 ID" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">IP 주소</label>
                  <input type="text" className="admin-input" placeholder="예: 192.168.1.100" />
                </div>
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">정규식 검색</label>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="예: error|fail|exception (정규식 패턴)"
              />
            </div>
            <div className="admin-flex" style={{ gap: '8px' }}>
              <button className="admin-btn admin-btn-primary">
                <i className="fas fa-search mr-2"></i>
                검색 실행
              </button>
              <button className="admin-btn admin-btn-secondary">
                <i className="fas fa-save mr-2"></i>
                검색 조건 저장
              </button>
            </div>
          </div>

          {/* 검색 결과 통계 */}
          <div className="admin-card">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">검색 결과 분석</h3>
            <div style={{ height: '300px', background: '#f9fafb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="admin-text-gray-500">검색 결과 차트 영역 (Chart.js 구현 예정)</p>
            </div>
          </div>
        </div>
      )}

      {/* 로그 설정 탭 */}
      {activeTab === 'settings' && (
        <div>
          <div className="admin-card admin-mb-6">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">로그 보관 정책</h3>
            <div className="admin-grid admin-grid-cols-2" style={{ gap: '24px' }}>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">로그 보관 기간</label>
                  <div className="admin-flex" style={{ gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      className="admin-input"
                      value={logSettings.retentionDays}
                      onChange={(e) => setLogSettings({...logSettings, retentionDays: parseInt(e.target.value)})}
                      style={{ width: '100px' }}
                    />
                    <span className="admin-text-sm">일</span>
                  </div>
                  <div className="admin-text-xs admin-text-gray-600 admin-mt-1">
                    설정 기간 이후 로그는 자동 삭제됩니다
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">최대 파일 크기</label>
                  <div className="admin-flex" style={{ gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      className="admin-input"
                      value={logSettings.maxFileSize}
                      onChange={(e) => setLogSettings({...logSettings, maxFileSize: parseInt(e.target.value)})}
                      style={{ width: '100px' }}
                    />
                    <span className="admin-text-sm">MB</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">최소 로그 레벨</label>
                  <select 
                    className="admin-select"
                    value={logSettings.logLevel}
                    onChange={(e) => setLogSettings({...logSettings, logLevel: e.target.value})}
                  >
                    <option value="DEBUG">DEBUG (모든 로그)</option>
                    <option value="INFO">INFO (정보 이상)</option>
                    <option value="WARN">WARN (경고 이상)</option>
                    <option value="ERROR">ERROR (오류만)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={logSettings.enableRealtime}
                      onChange={(e) => setLogSettings({...logSettings, enableRealtime: e.target.checked})}
                    />
                    <span className="admin-text-sm">실시간 로그 스트리밍 활성화</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 로그 압축 및 아카이브 */}
          <div className="admin-card admin-mb-6">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">로그 압축 및 아카이브</h3>
            <div className="admin-grid admin-grid-cols-3" style={{ gap: '16px' }}>
              <div className="admin-text-center">
                <div className="admin-text-xl admin-font-bold" style={{ color: '#10b981' }}>2.3GB</div>
                <div className="admin-text-sm admin-text-gray-600">현재 로그 크기</div>
              </div>
              <div className="admin-text-center">
                <div className="admin-text-xl admin-font-bold" style={{ color: '#3b82f6' }}>850MB</div>
                <div className="admin-text-sm admin-text-gray-600">압축 후 예상 크기</div>
              </div>
              <div className="admin-text-center">
                <div className="admin-text-xl admin-font-bold" style={{ color: '#f59e0b' }}>15개</div>
                <div className="admin-text-sm admin-text-gray-600">아카이브 파일 수</div>
              </div>
            </div>
            <div className="admin-flex" style={{ gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
              <button className="admin-btn admin-btn-primary">
                <i className="fas fa-compress mr-2"></i>
                로그 압축 실행
              </button>
              <button className="admin-btn admin-btn-secondary">
                <i className="fas fa-archive mr-2"></i>
                아카이브 관리
              </button>
            </div>
          </div>

          <div className="admin-flex" style={{ gap: '8px' }}>
            <button 
              className="admin-btn admin-btn-primary"
              onClick={handleUpdateSettings}
            >
              <i className="fas fa-save mr-2"></i>
              설정 저장
            </button>
            <button className="admin-btn admin-btn-secondary">
              <i className="fas fa-undo mr-2"></i>
              기본값 복원
            </button>
          </div>
        </div>
      )}

      {/* 알림 설정 탭 */}
      {activeTab === 'alerts' && (
        <div>
          <div className="admin-card">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">알림 임계값 설정</h3>
            <div className="admin-grid admin-grid-cols-2" style={{ gap: '24px' }}>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">ERROR 로그 임계값</label>
                  <div className="admin-flex" style={{ gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      className="admin-input"
                      value={logSettings.alertThreshold}
                      onChange={(e) => setLogSettings({...logSettings, alertThreshold: parseInt(e.target.value)})}
                      style={{ width: '100px' }}
                    />
                    <span className="admin-text-sm">건/시간</span>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      checked={logSettings.emailAlerts}
                      onChange={(e) => setLogSettings({...logSettings, emailAlerts: e.target.checked})}
                    />
                    <span className="admin-text-sm">이메일 알림 활성화</span>
                  </label>
                </div>
              </div>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">알림 수신 이메일</label>
                  <textarea 
                    className="admin-textarea"
                    placeholder="admin@factlab.com&#10;dev@factlab.com"
                    rows={3}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* 알림 규칙 */}
            <div className="admin-mt-6">
              <h4 className="admin-text-md admin-font-medium admin-text-gray-800 admin-mb-4">커스텀 알림 규칙</h4>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <table className="admin-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>규칙 이름</th>
                      <th>조건</th>
                      <th>임계값</th>
                      <th>상태</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="admin-text-sm">데이터베이스 오류</td>
                      <td className="admin-text-sm">service = "database" AND level = "ERROR"</td>
                      <td className="admin-text-sm">3건/10분</td>
                      <td>
                        <span className="admin-status-badge admin-status-green">활성</span>
                      </td>
                      <td>
                        <div className="admin-flex" style={{ gap: '4px' }}>
                          <button className="admin-btn admin-btn-secondary admin-text-xs">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="admin-btn admin-btn-danger admin-text-xs">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="admin-text-sm">API 요청 실패</td>
                      <td className="admin-text-sm">message CONTAINS "API" AND level = "ERROR"</td>
                      <td className="admin-text-sm">5건/5분</td>
                      <td>
                        <span className="admin-status-badge admin-status-green">활성</span>
                      </td>
                      <td>
                        <div className="admin-flex" style={{ gap: '4px' }}>
                          <button className="admin-btn admin-btn-secondary admin-text-xs">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="admin-btn admin-btn-danger admin-text-xs">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="admin-btn admin-btn-primary admin-mt-4">
                <i className="fas fa-plus mr-2"></i>
                새 알림 규칙 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;