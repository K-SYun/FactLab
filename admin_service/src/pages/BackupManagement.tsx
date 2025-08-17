import React, { useState } from 'react';

interface BackupJob {
  id: number;
  name: string;
  type: 'database' | 'files' | 'logs' | 'full';
  status: 'completed' | 'running' | 'failed' | 'scheduled';
  size: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  schedule?: string;
  retentionDays: number;
  location: string;
}

interface StorageInfo {
  total: number;
  used: number;
  available: number;
  backups: number;
}

const BackupManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'backups' | 'schedule' | 'restore' | 'storage'>('backups');
  const [isRunningBackup, setIsRunningBackup] = useState(false);
  
  const [backupJobs] = useState<BackupJob[]>([
    {
      id: 1,
      name: "일일 전체 백업",
      type: "full",
      status: "completed",
      size: 2.4,
      startTime: "2024-01-15 02:00:00",
      endTime: "2024-01-15 02:47:30",
      duration: 47.5,
      schedule: "0 2 * * *",
      retentionDays: 30,
      location: "/backup/daily/full_20240115_020000.tar.gz"
    },
    {
      id: 2,
      name: "데이터베이스 백업",
      type: "database",
      status: "completed",
      size: 1.2,
      startTime: "2024-01-15 06:00:00",
      endTime: "2024-01-15 06:15:20",
      duration: 15.3,
      schedule: "0 */6 * * *",
      retentionDays: 7,
      location: "/backup/db/factlab_20240115_060000.sql"
    },
    {
      id: 3,
      name: "로그 백업",
      type: "logs",
      status: "running",
      size: 0.8,
      startTime: "2024-01-15 14:30:00",
      schedule: "0 */3 * * *",
      retentionDays: 14,
      location: "/backup/logs/logs_20240115_143000.tar.gz"
    },
    {
      id: 4,
      name: "사용자 파일 백업",
      type: "files",
      status: "failed",
      size: 0,
      startTime: "2024-01-15 12:00:00",
      endTime: "2024-01-15 12:05:00",
      duration: 5,
      schedule: "0 12 * * 0",
      retentionDays: 60,
      location: "/backup/files/user_files_20240115_120000.tar.gz"
    }
  ]);

  const [storageInfo] = useState<StorageInfo>({
    total: 500,
    used: 186,
    available: 314,
    backups: 47
  });

  const handleBackupAction = (action: string, jobId?: number) => {
    if (action === '즉시실행' && jobId) {
      setIsRunningBackup(true);
      console.log('백업 실행:', jobId);
      
      // 3초 후 완료 시뮬레이션
      setTimeout(() => {
        setIsRunningBackup(false);
        console.log('백업 완료');
      }, 3000);
    } else {
      console.log(`백업 ${action}:`, jobId);
    }
    // 실제 구현에서는 API 호출
  };

  const handleRestoreAction = (action: string, jobId?: number) => {
    console.log(`복원 ${action}:`, jobId);
    // 실제 구현에서는 API 호출
  };

  const getStatusBadge = (status: string) => {
    const config = {
      completed: { text: '완료', class: 'admin-status-green' },
      running: { text: '실행중', class: 'admin-status-blue' },
      failed: { text: '실패', class: 'admin-status-red' },
      scheduled: { text: '예약됨', class: 'admin-status-orange' }
    };
    const { text, class: className } = config[status as keyof typeof config] || config.completed;
    
    return (
      <span className={`admin-status-badge ${className}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>
        {text}
        {status === 'running' && <span className="admin-pulse" style={{ marginLeft: '4px' }}>●</span>}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return 'fas fa-database';
      case 'files': return 'fas fa-folder';
      case 'logs': return 'fas fa-file-alt';
      case 'full': return 'fas fa-server';
      default: return 'fas fa-archive';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'database': return '데이터베이스';
      case 'files': return '파일';
      case 'logs': return '로그';
      case 'full': return '전체';
      default: return '기타';
    }
  };

  const formatSize = (sizeGB: number) => {
    if (sizeGB >= 1) {
      return `${sizeGB.toFixed(1)}GB`;
    } else {
      return `${Math.round(sizeGB * 1024)}MB`;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    } else {
      return `${mins}분`;
    }
  };

  const getStorageUsagePercentage = () => {
    return (storageInfo.used / storageInfo.total) * 100;
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-flex-between admin-mb-6">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800">백업 관리</h1>
        <div className="admin-flex" style={{ gap: '12px' }}>
          <button 
            className={`admin-btn ${isRunningBackup ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
            onClick={() => handleBackupAction('즉시실행')}
            disabled={isRunningBackup}
          >
            <i className={`fas ${isRunningBackup ? 'fa-spinner fa-spin' : 'fa-play'} mr-2`}></i>
            {isRunningBackup ? '백업 실행중...' : '즉시 백업 실행'}
          </button>
          <button className="admin-btn admin-btn-secondary">
            <i className="fas fa-cog mr-2"></i>
            백업 설정
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="admin-card admin-mb-6">
        <nav style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { key: 'backups', label: '백업 현황', icon: 'fas fa-archive' },
              { key: 'schedule', label: '스케줄 관리', icon: 'fas fa-calendar-alt' },
              { key: 'restore', label: '복원 관리', icon: 'fas fa-undo' },
              { key: 'storage', label: '스토리지 관리', icon: 'fas fa-hdd' }
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
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* 백업 현황 탭 */}
      {activeTab === 'backups' && (
        <div>
          {/* 백업 상태 요약 */}
          <div className="admin-grid admin-grid-cols-4 admin-mb-6">
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">
                {backupJobs.filter(job => job.status === 'completed').length}
              </div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>완료된 백업</div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">
                {backupJobs.filter(job => job.status === 'running').length}
              </div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>실행 중</div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">
                {formatSize(backupJobs.reduce((sum, job) => sum + job.size, 0))}
              </div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>총 백업 크기</div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">
                {getStorageUsagePercentage().toFixed(1)}%
              </div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>스토리지 사용량</div>
            </div>
          </div>

          {/* 백업 작업 목록 */}
          <div className="admin-card">
            <div className="admin-flex-between admin-mb-4">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">백업 작업 목록</h3>
              <div className="admin-flex" style={{ gap: '8px' }}>
                <select className="admin-select" style={{ width: 'auto' }}>
                  <option>전체 상태</option>
                  <option>완료</option>
                  <option>실행중</option>
                  <option>실패</option>
                </select>
                <select className="admin-select" style={{ width: 'auto' }}>
                  <option>전체 유형</option>
                  <option>전체 백업</option>
                  <option>데이터베이스</option>
                  <option>파일</option>
                  <option>로그</option>
                </select>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>백업 이름</th>
                    <th>유형</th>
                    <th>상태</th>
                    <th>크기</th>
                    <th>시작 시간</th>
                    <th>소요 시간</th>
                    <th>보관 기간</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {backupJobs.map(job => (
                    <tr key={job.id}>
                      <td>
                        <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                          <i className={getTypeIcon(job.type)} style={{ color: '#6b7280' }}></i>
                          <div>
                            <div className="admin-text-sm admin-font-medium admin-text-gray-900">{job.name}</div>
                            <div className="admin-text-xs admin-text-gray-500">ID: {job.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="admin-text-sm admin-text-gray-900">{getTypeName(job.type)}</td>
                      <td>{getStatusBadge(job.status)}</td>
                      <td className="admin-text-sm admin-text-gray-900">
                        {job.size > 0 ? formatSize(job.size) : '-'}
                      </td>
                      <td className="admin-text-sm admin-text-gray-600">{job.startTime}</td>
                      <td className="admin-text-sm admin-text-gray-600">
                        {job.duration ? formatDuration(job.duration) : 
                         job.status === 'running' ? '진행중...' : '-'}
                      </td>
                      <td className="admin-text-sm admin-text-gray-600">{job.retentionDays}일</td>
                      <td>
                        <div className="admin-flex" style={{ gap: '4px' }}>
                          {job.status !== 'running' && (
                            <button 
                              className="admin-btn admin-btn-secondary admin-text-xs"
                              onClick={() => handleBackupAction('즉시실행', job.id)}
                              title="즉시 실행"
                            >
                              <i className="fas fa-play"></i>
                            </button>
                          )}
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleBackupAction('설정', job.id)}
                            title="설정"
                          >
                            <i className="fas fa-cog"></i>
                          </button>
                          {job.status === 'completed' && (
                            <button 
                              className="admin-btn admin-btn-secondary admin-text-xs"
                              onClick={() => handleRestoreAction('복원', job.id)}
                              title="복원"
                            >
                              <i className="fas fa-undo"></i>
                            </button>
                          )}
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleBackupAction('다운로드', job.id)}
                            title="다운로드"
                          >
                            <i className="fas fa-download"></i>
                          </button>
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

      {/* 스케줄 관리 탭 */}
      {activeTab === 'schedule' && (
        <div>
          {/* 새 백업 스케줄 생성 */}
          <div className="admin-card admin-mb-6">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">새 백업 스케줄 생성</h3>
            <div className="admin-grid admin-grid-cols-2" style={{ gap: '24px' }}>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">백업 이름</label>
                  <input 
                    type="text" 
                    className="admin-input"
                    placeholder="예: 주간 전체 백업"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">백업 유형</label>
                  <select className="admin-select">
                    <option value="full">전체 백업</option>
                    <option value="database">데이터베이스만</option>
                    <option value="files">파일만</option>
                    <option value="logs">로그만</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">백업 경로</label>
                  <input 
                    type="text" 
                    className="admin-input"
                    placeholder="/backup/custom/"
                    defaultValue="/backup/scheduled/"
                  />
                </div>
              </div>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">실행 시간</label>
                  <div className="admin-grid admin-grid-cols-2" style={{ gap: '8px' }}>
                    <input type="time" className="admin-input" defaultValue="02:00" />
                    <select className="admin-select">
                      <option>매일</option>
                      <option>매주</option>
                      <option>매월</option>
                      <option>커스텀</option>
                    </select>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">보관 기간</label>
                  <div className="admin-flex" style={{ gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      className="admin-input"
                      defaultValue={30}
                      style={{ width: '100px' }}
                    />
                    <span className="admin-text-sm">일</span>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    <span className="admin-text-sm">압축하여 저장</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="admin-flex" style={{ gap: '8px' }}>
              <button className="admin-btn admin-btn-primary">
                <i className="fas fa-save mr-2"></i>
                스케줄 생성
              </button>
              <button className="admin-btn admin-btn-secondary">
                <i className="fas fa-vial mr-2"></i>
                테스트 실행
              </button>
            </div>
          </div>

          {/* 기존 스케줄 목록 */}
          <div className="admin-card">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">활성 백업 스케줄</h3>
            <div className="admin-grid admin-grid-cols-1" style={{ gap: '16px' }}>
              {backupJobs.filter(job => job.schedule).map(job => (
                <div key={job.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  <div className="admin-flex-between admin-mb-2">
                    <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                      <i className={getTypeIcon(job.type)} style={{ color: '#6b7280' }}></i>
                      <span className="admin-text-sm admin-font-medium">{job.name}</span>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="admin-flex" style={{ gap: '4px' }}>
                      <button 
                        className="admin-btn admin-btn-secondary admin-text-xs"
                        onClick={() => handleBackupAction('수정', job.id)}
                      >
                        <i className="fas fa-edit mr-1"></i>수정
                      </button>
                      <button 
                        className="admin-btn admin-btn-danger admin-text-xs"
                        onClick={() => handleBackupAction('삭제', job.id)}
                      >
                        <i className="fas fa-trash mr-1"></i>삭제
                      </button>
                    </div>
                  </div>
                  <div className="admin-text-xs admin-text-gray-600">
                    <div>유형: {getTypeName(job.type)} | 크기: {formatSize(job.size)} | 보관: {job.retentionDays}일</div>
                    <div>스케줄: {job.schedule} | 마지막 실행: {job.startTime}</div>
                    <div>저장 위치: {job.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 복원 관리 탭 */}
      {activeTab === 'restore' && (
        <div>
          {/* 복원 옵션 */}
          <div className="admin-card admin-mb-6">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">백업 복원</h3>
            <div className="admin-grid admin-grid-cols-2" style={{ gap: '24px' }}>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">복원할 백업 선택</label>
                  <select className="admin-select">
                    <option>백업 파일을 선택하세요</option>
                    {backupJobs.filter(job => job.status === 'completed').map(job => (
                      <option key={job.id} value={job.id}>
                        {job.name} ({job.startTime})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">복원 유형</label>
                  <div className="admin-flex" style={{ flexDirection: 'column', gap: '8px' }}>
                    <label className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                      <input type="radio" name="restoreType" value="full" defaultChecked />
                      <span className="admin-text-sm">전체 복원 (데이터베이스 + 파일)</span>
                    </label>
                    <label className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                      <input type="radio" name="restoreType" value="database" />
                      <span className="admin-text-sm">데이터베이스만 복원</span>
                    </label>
                    <label className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                      <input type="radio" name="restoreType" value="files" />
                      <span className="admin-text-sm">파일만 복원</span>
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">복원 위치</label>
                  <input 
                    type="text" 
                    className="admin-input"
                    placeholder="복원할 위치 (기본값: 원본 위치)"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    <span className="admin-text-sm">기존 데이터 백업 후 복원</span>
                  </label>
                </div>
                <div className="admin-form-group">
                  <label className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    <span className="admin-text-sm">복원 전 데이터 검증</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* 경고 메시지 */}
            <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '6px', marginTop: '16px' }}>
              <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#d97706' }}></i>
                <span className="admin-text-sm admin-font-medium" style={{ color: '#92400e' }}>주의사항</span>
              </div>
              <ul className="admin-text-xs admin-mt-2" style={{ color: '#92400e', listStyle: 'disc', paddingLeft: '16px' }}>
                <li>복원 작업은 시스템을 일시 중단시킬 수 있습니다.</li>
                <li>복원 전 현재 데이터의 백업을 권장합니다.</li>
                <li>복원 과정은 되돌릴 수 없으니 신중히 선택하세요.</li>
              </ul>
            </div>
            
            <div className="admin-flex" style={{ gap: '8px', marginTop: '16px' }}>
              <button className="admin-btn admin-btn-primary">
                <i className="fas fa-undo mr-2"></i>
                복원 시작
              </button>
              <button className="admin-btn admin-btn-secondary">
                <i className="fas fa-search mr-2"></i>
                백업 검증
              </button>
            </div>
          </div>

          {/* 복원 히스토리 */}
          <div className="admin-card">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">복원 히스토리</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>복원 일시</th>
                    <th>백업 파일</th>
                    <th>복원 유형</th>
                    <th>상태</th>
                    <th>소요 시간</th>
                    <th>복원한 사용자</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="admin-text-sm admin-text-gray-600">2024-01-10 15:30:00</td>
                    <td className="admin-text-sm admin-text-gray-900">full_20240110_020000.tar.gz</td>
                    <td className="admin-text-sm admin-text-gray-900">전체 복원</td>
                    <td>
                      <span className="admin-status-badge admin-status-green">완료</span>
                    </td>
                    <td className="admin-text-sm admin-text-gray-600">23분</td>
                    <td className="admin-text-sm admin-text-gray-600">admin@factlab.com</td>
                  </tr>
                  <tr>
                    <td className="admin-text-sm admin-text-gray-600">2024-01-05 09:15:00</td>
                    <td className="admin-text-sm admin-text-gray-900">factlab_20240105_060000.sql</td>
                    <td className="admin-text-sm admin-text-gray-900">데이터베이스</td>
                    <td>
                      <span className="admin-status-badge admin-status-green">완료</span>
                    </td>
                    <td className="admin-text-sm admin-text-gray-600">8분</td>
                    <td className="admin-text-sm admin-text-gray-600">admin@factlab.com</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 스토리지 관리 탭 */}
      {activeTab === 'storage' && (
        <div>
          {/* 스토리지 사용량 */}
          <div className="admin-card admin-mb-6">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">스토리지 사용량</h3>
            <div className="admin-grid admin-grid-cols-2" style={{ gap: '24px' }}>
              <div>
                <div className="admin-text-center admin-mb-4">
                  <div 
                    style={{ 
                      width: '200px', 
                      height: '200px', 
                      borderRadius: '50%',
                      background: `conic-gradient(#10b981 0deg ${getStorageUsagePercentage() * 3.6}deg, #e5e7eb ${getStorageUsagePercentage() * 3.6}deg 360deg)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto'
                    }}
                  >
                    <div 
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%',
                        background: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div className="admin-text-xl admin-font-bold">{getStorageUsagePercentage().toFixed(1)}%</div>
                      <div className="admin-text-sm admin-text-gray-600">사용 중</div>
                    </div>
                  </div>
                </div>
                <div className="admin-text-center">
                  <div className="admin-text-lg admin-font-medium">{formatSize(storageInfo.used)} / {formatSize(storageInfo.total)}</div>
                  <div className="admin-text-sm admin-text-gray-600">사용량 / 전체 용량</div>
                </div>
              </div>
              <div>
                <div className="admin-grid admin-grid-cols-1" style={{ gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
                    <div className="admin-flex-between">
                      <span className="admin-text-sm admin-font-medium">전체 용량</span>
                      <span className="admin-text-sm admin-font-bold">{formatSize(storageInfo.total)}</span>
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                    <div className="admin-flex-between">
                      <span className="admin-text-sm admin-font-medium">사용 용량</span>
                      <span className="admin-text-sm admin-font-bold" style={{ color: '#10b981' }}>
                        {formatSize(storageInfo.used)}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#fefce8', borderRadius: '8px' }}>
                    <div className="admin-flex-between">
                      <span className="admin-text-sm admin-font-medium">사용 가능</span>
                      <span className="admin-text-sm admin-font-bold" style={{ color: '#eab308' }}>
                        {formatSize(storageInfo.available)}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
                    <div className="admin-flex-between">
                      <span className="admin-text-sm admin-font-medium">백업 파일 수</span>
                      <span className="admin-text-sm admin-font-bold">{storageInfo.backups}개</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 스토리지 정리 */}
          <div className="admin-card">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">스토리지 정리</h3>
            <div className="admin-grid admin-grid-cols-3" style={{ gap: '16px' }}>
              <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'center' }}>
                <i className="fas fa-clock admin-text-2xl admin-mb-2" style={{ color: '#f59e0b' }}></i>
                <h4 className="admin-text-sm admin-font-medium admin-mb-2">만료된 백업 삭제</h4>
                <p className="admin-text-xs admin-text-gray-600 admin-mb-4">
                  보관 기간이 지난 백업 파일을 자동 삭제하여 공간을 확보합니다.
                </p>
                <button className="admin-btn admin-btn-secondary admin-text-xs">
                  <i className="fas fa-trash mr-1"></i>정리 실행
                </button>
              </div>
              
              <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'center' }}>
                <i className="fas fa-compress-alt admin-text-2xl admin-mb-2" style={{ color: '#10b981' }}></i>
                <h4 className="admin-text-sm admin-font-medium admin-mb-2">백업 파일 압축</h4>
                <p className="admin-text-xs admin-text-gray-600 admin-mb-4">
                  압축되지 않은 백업 파일을 압축하여 저장 공간을 절약합니다.
                </p>
                <button className="admin-btn admin-btn-secondary admin-text-xs">
                  <i className="fas fa-compress mr-1"></i>압축 실행
                </button>
              </div>
              
              <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'center' }}>
                <i className="fas fa-cloud-upload-alt admin-text-2xl admin-mb-2" style={{ color: '#3b82f6' }}></i>
                <h4 className="admin-text-sm admin-font-medium admin-mb-2">원격 저장소 이전</h4>
                <p className="admin-text-xs admin-text-gray-600 admin-mb-4">
                  오래된 백업을 클라우드 저장소로 이전하여 로컬 공간을 확보합니다.
                </p>
                <button className="admin-btn admin-btn-secondary admin-text-xs">
                  <i className="fas fa-upload mr-1"></i>이전 실행
                </button>
              </div>
            </div>

            {/* 자동 정리 설정 */}
            <div className="admin-mt-6" style={{ padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>
              <h4 className="admin-text-sm admin-font-medium admin-mb-4">자동 정리 설정</h4>
              <div className="admin-grid admin-grid-cols-2" style={{ gap: '16px' }}>
                <div>
                  <label className="admin-flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    <span className="admin-text-sm">만료된 백업 자동 삭제</span>
                  </label>
                  <label className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    <span className="admin-text-sm">저장소 사용량 80% 초과 시 경고</span>
                  </label>
                </div>
                <div>
                  <label className="admin-flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" />
                    <span className="admin-text-sm">주간 백업 파일 압축</span>
                  </label>
                  <label className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    <span className="admin-text-sm">월간 원격 저장소 동기화</span>
                  </label>
                </div>
              </div>
              <button className="admin-btn admin-btn-primary admin-text-sm admin-mt-4">
                <i className="fas fa-save mr-2"></i>설정 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManagement;