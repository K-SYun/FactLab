import React, { useState } from 'react';

interface APIService {
  id: number;
  name: string;
  provider: string;
  type: 'ai' | 'social' | 'news' | 'payment' | 'other';
  status: 'active' | 'inactive' | 'error' | 'limited';
  apiKey: string;
  endpoint: string;
  requestsToday: number;
  requestsLimit: number;
  responseTime: number;
  successRate: number;
  lastUsed: string;
}

interface APIKey {
  id: number;
  name: string;
  service: string;
  key: string;
  permissions: string[];
  createdDate: string;
  lastUsed: string;
  status: 'active' | 'revoked' | 'expired';
}

interface APILog {
  id: number;
  service: string;
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  timestamp: string;
  errorMessage?: string;
}

const APIManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'keys' | 'monitoring' | 'logs'>('services');
  
  const [apiServices] = useState<APIService[]>([
    {
      id: 1,
      name: "OpenAI API",
      provider: "OpenAI",
      type: "ai",
      status: "active",
      apiKey: "sk-***************************",
      endpoint: "https://api.openai.com/v1",
      requestsToday: 2847,
      requestsLimit: 10000,
      responseTime: 1200,
      successRate: 98.5,
      lastUsed: "2024-01-15 14:30:15"
    },
    {
      id: 2,
      name: "네이버 뉴스 API",
      provider: "Naver",
      type: "news",
      status: "active",
      apiKey: "naver_***************************",
      endpoint: "https://openapi.naver.com/v1/search/news.json",
      requestsToday: 1456,
      requestsLimit: 25000,
      responseTime: 450,
      successRate: 99.2,
      lastUsed: "2024-01-15 14:25:30"
    },
    {
      id: 3,
      name: "다음 뉴스 API",
      provider: "Kakao",
      type: "news",
      status: "active",
      apiKey: "kakao_***************************",
      endpoint: "https://dapi.kakao.com/v2/search/web",
      requestsToday: 987,
      requestsLimit: 20000,
      responseTime: 380,
      successRate: 97.8,
      lastUsed: "2024-01-15 14:20:45"
    },
    {
      id: 4,
      name: "Twitter API",
      provider: "Twitter",
      type: "social",
      status: "limited",
      apiKey: "twitter_***************************",
      endpoint: "https://api.twitter.com/2",
      requestsToday: 4892,
      requestsLimit: 5000,
      responseTime: 890,
      successRate: 94.2,
      lastUsed: "2024-01-15 14:28:12"
    },
    {
      id: 5,
      name: "팩트체크 API",
      provider: "Custom",
      type: "other",
      status: "error",
      apiKey: "fact_***************************",
      endpoint: "https://factcheck.api.com/v1",
      requestsToday: 0,
      requestsLimit: 1000,
      responseTime: 0,
      successRate: 0,
      lastUsed: "2024-01-14 09:15:22"
    }
  ]);

  const [apiKeys] = useState<APIKey[]>([
    {
      id: 1,
      name: "메인 OpenAI 키",
      service: "OpenAI",
      key: "sk-proj-***************************",
      permissions: ["gpt-3.5-turbo", "gpt-4", "text-embedding"],
      createdDate: "2023-12-01",
      lastUsed: "2024-01-15 14:30:15",
      status: "active"
    },
    {
      id: 2,
      name: "백업 OpenAI 키",
      service: "OpenAI",
      key: "sk-proj-***************************",
      permissions: ["gpt-3.5-turbo"],
      createdDate: "2024-01-01",
      lastUsed: "2024-01-10 16:22:30",
      status: "active"
    },
    {
      id: 3,
      name: "구 트위터 키",
      service: "Twitter",
      key: "twitter_***************************",
      permissions: ["read", "write"],
      createdDate: "2023-11-15",
      lastUsed: "2023-12-20 10:45:12",
      status: "revoked"
    }
  ]);

  const [apiLogs] = useState<APILog[]>([
    {
      id: 1,
      service: "OpenAI",
      endpoint: "/v1/chat/completions",
      method: "POST",
      status: 200,
      responseTime: 1245,
      timestamp: "2024-01-15 14:30:15"
    },
    {
      id: 2,
      service: "Naver",
      endpoint: "/v1/search/news.json",
      method: "GET",
      status: 200,
      responseTime: 432,
      timestamp: "2024-01-15 14:29:45"
    },
    {
      id: 3,
      service: "Twitter",
      endpoint: "/2/tweets/search/recent",
      method: "GET",
      status: 429,
      responseTime: 234,
      timestamp: "2024-01-15 14:28:30",
      errorMessage: "Rate limit exceeded"
    },
    {
      id: 4,
      service: "팩트체크",
      endpoint: "/v1/verify",
      method: "POST",
      status: 500,
      responseTime: 0,
      timestamp: "2024-01-15 14:15:22",
      errorMessage: "Internal server error"
    }
  ]);

  const handleServiceAction = (action: string, serviceId?: number) => {
    console.log(`API 서비스 ${action}:`, serviceId);
    // 실제 구현에서는 API 호출
  };

  const handleKeyAction = (action: string, keyId?: number) => {
    console.log(`API 키 ${action}:`, keyId);
    // 실제 구현에서는 API 호출
  };

  const getStatusBadge = (status: string, type: 'service' | 'key' = 'service') => {
    if (type === 'service') {
      const config = {
        active: { text: '정상', class: 'admin-status-green' },
        inactive: { text: '비활성', class: 'admin-status-red' },
        error: { text: '오류', class: 'admin-status-red' },
        limited: { text: '제한', class: 'admin-status-orange' }
      };
      const { text, class: className } = config[status as keyof typeof config] || config.active;
      
      return (
        <span className={`admin-status-badge ${className}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>
          {text}
        </span>
      );
    } else {
      const config = {
        active: { text: '활성', class: 'admin-status-green' },
        revoked: { text: '폐기', class: 'admin-status-red' },
        expired: { text: '만료', class: 'admin-status-orange' }
      };
      const { text, class: className } = config[status as keyof typeof config] || config.active;
      
      return (
        <span className={`admin-status-badge ${className}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>
          {text}
        </span>
      );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ai': return 'fas fa-brain';
      case 'social': return 'fas fa-share-alt';
      case 'news': return 'fas fa-newspaper';
      case 'payment': return 'fas fa-credit-card';
      default: return 'fas fa-plug';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return '#10b981';
    if (status >= 400 && status < 500) return '#f59e0b';
    if (status >= 500) return '#ef4444';
    return '#6b7280';
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-flex-between admin-mb-6">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800">API 관리</h1>
        <div className="admin-flex" style={{ gap: '12px' }}>
          <button className="admin-btn admin-btn-primary">
            <i className="fas fa-plus mr-2"></i>
            새 API 연동
          </button>
          <button className="admin-btn admin-btn-secondary">
            <i className="fas fa-key mr-2"></i>
            API 키 생성
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="admin-card admin-mb-6">
        <nav style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { key: 'services', label: 'API 서비스', icon: 'fas fa-server' },
              { key: 'keys', label: 'API 키 관리', icon: 'fas fa-key' },
              { key: 'monitoring', label: '실시간 모니터링', icon: 'fas fa-chart-line' },
              { key: 'logs', label: 'API 로그', icon: 'fas fa-list' }
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

      {/* API 서비스 탭 */}
      {activeTab === 'services' && (
        <div>
          {/* API 상태 요약 */}
          <div className="admin-grid admin-grid-cols-4 admin-mb-6">
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">
                {apiServices.filter(s => s.status === 'active').length}
              </div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>정상 서비스</div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">
                {apiServices.reduce((sum, s) => sum + s.requestsToday, 0).toLocaleString()}
              </div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>오늘 요청 수</div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">
                {Math.round(apiServices.reduce((sum, s) => sum + s.responseTime, 0) / apiServices.length)}ms
              </div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>평균 응답시간</div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">
                {(apiServices.reduce((sum, s) => sum + s.successRate, 0) / apiServices.length).toFixed(1)}%
              </div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>평균 성공률</div>
            </div>
          </div>

          {/* API 서비스 목록 */}
          <div className="admin-card">
            <div className="admin-flex-between admin-mb-4">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">연동된 API 서비스</h3>
              <div className="admin-flex" style={{ gap: '8px' }}>
                <select className="admin-select" style={{ width: 'auto' }}>
                  <option>전체 상태</option>
                  <option>정상</option>
                  <option>오류</option>
                  <option>제한</option>
                </select>
                <select className="admin-select" style={{ width: 'auto' }}>
                  <option>전체 유형</option>
                  <option>AI</option>
                  <option>뉴스</option>
                  <option>소셜</option>
                  <option>기타</option>
                </select>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>서비스 정보</th>
                    <th>유형</th>
                    <th>상태</th>
                    <th>오늘 사용량</th>
                    <th>응답시간</th>
                    <th>성공률</th>
                    <th>마지막 사용</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {apiServices.map(service => (
                    <tr key={service.id}>
                      <td>
                        <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                          <i className={getTypeIcon(service.type)} style={{ color: '#6b7280' }}></i>
                          <div>
                            <div className="admin-text-sm admin-font-medium admin-text-gray-900">{service.name}</div>
                            <div className="admin-text-xs admin-text-gray-500">{service.provider}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-text-sm" style={{ 
                          padding: '2px 6px', 
                          background: '#f3f4f6', 
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          fontSize: '10px'
                        }}>
                          {service.type}
                        </span>
                      </td>
                      <td>{getStatusBadge(service.status, 'service')}</td>
                      <td>
                        <div className="admin-text-sm">
                          <div className="admin-text-gray-900">{service.requestsToday.toLocaleString()}</div>
                          <div className="admin-text-xs admin-text-gray-500">
                            / {service.requestsLimit.toLocaleString()} 한도
                          </div>
                          <div style={{ 
                            width: '60px', 
                            height: '4px', 
                            background: '#e5e7eb', 
                            borderRadius: '2px',
                            overflow: 'hidden',
                            marginTop: '2px'
                          }}>
                            <div 
                              style={{ 
                                width: `${(service.requestsToday / service.requestsLimit) * 100}%`, 
                                height: '100%', 
                                background: service.requestsToday / service.requestsLimit > 0.8 ? '#ef4444' : 
                                           service.requestsToday / service.requestsLimit > 0.6 ? '#f59e0b' : '#10b981'
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          color: service.responseTime > 2000 ? '#ef4444' : 
                                 service.responseTime > 1000 ? '#f59e0b' : '#10b981',
                          fontWeight: '500'
                        }}>
                          {service.responseTime}ms
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          color: service.successRate > 95 ? '#10b981' : 
                                 service.successRate > 90 ? '#f59e0b' : '#ef4444',
                          fontWeight: '500'
                        }}>
                          {service.successRate}%
                        </span>
                      </td>
                      <td className="admin-text-sm admin-text-gray-600">{service.lastUsed}</td>
                      <td>
                        <div className="admin-flex" style={{ gap: '4px' }}>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleServiceAction('설정', service.id)}
                            title="설정"
                          >
                            <i className="fas fa-cog"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleServiceAction('테스트', service.id)}
                            title="연결 테스트"
                          >
                            <i className="fas fa-vial"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleServiceAction('통계', service.id)}
                            title="상세 통계"
                          >
                            <i className="fas fa-chart-bar"></i>
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

      {/* API 키 관리 탭 */}
      {activeTab === 'keys' && (
        <div>
          <div className="admin-card admin-mb-6">
            <div className="admin-flex-between admin-mb-4">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">API 키 목록</h3>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={() => handleKeyAction('생성')}
              >
                <i className="fas fa-plus mr-2"></i>
                새 API 키 생성
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>키 이름</th>
                    <th>서비스</th>
                    <th>API 키</th>
                    <th>권한</th>
                    <th>생성일</th>
                    <th>마지막 사용</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map(key => (
                    <tr key={key.id}>
                      <td className="admin-text-sm admin-font-medium admin-text-gray-900">{key.name}</td>
                      <td className="admin-text-sm admin-text-gray-900">{key.service}</td>
                      <td>
                        <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                          <code className="admin-text-xs" style={{ 
                            background: '#f3f4f6', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontFamily: 'monospace'
                          }}>
                            {key.key}
                          </code>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            title="복사"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="admin-flex" style={{ gap: '4px', flexWrap: 'wrap' }}>
                          {key.permissions.map((permission, index) => (
                            <span 
                              key={index}
                              className="admin-text-xs"
                              style={{ 
                                background: '#e5e7eb', 
                                padding: '2px 6px', 
                                borderRadius: '12px',
                                color: '#374151'
                              }}
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="admin-text-sm admin-text-gray-600">{key.createdDate}</td>
                      <td className="admin-text-sm admin-text-gray-600">{key.lastUsed}</td>
                      <td>{getStatusBadge(key.status, 'key')}</td>
                      <td>
                        <div className="admin-flex" style={{ gap: '4px' }}>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleKeyAction('수정', key.id)}
                            title="수정"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {key.status === 'active' && (
                            <button 
                              className="admin-btn admin-btn-danger admin-text-xs"
                              onClick={() => handleKeyAction('폐기', key.id)}
                              title="폐기"
                            >
                              <i className="fas fa-trash"></i>
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

          {/* API 키 생성 폼 */}
          <div className="admin-card">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">새 API 키 생성</h3>
            <div className="admin-grid admin-grid-cols-2" style={{ gap: '16px' }}>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">키 이름</label>
                  <input type="text" className="admin-input" placeholder="예: 메인 OpenAI 키" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">서비스 선택</label>
                  <select className="admin-select">
                    <option>OpenAI</option>
                    <option>Naver</option>
                    <option>Kakao</option>
                    <option>Twitter</option>
                    <option>기타</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">API 키</label>
                  <input type="password" className="admin-input" placeholder="API 키를 입력하세요" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">권한 설정</label>
                  <div className="admin-flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {['read', 'write', 'admin', 'billing'].map(permission => (
                      <label key={permission} className="admin-flex" style={{ alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" />
                        <span className="admin-text-sm">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-flex" style={{ gap: '8px', marginTop: '16px' }}>
              <button className="admin-btn admin-btn-primary">
                <i className="fas fa-save mr-2"></i>
                키 생성
              </button>
              <button className="admin-btn admin-btn-secondary">
                <i className="fas fa-vial mr-2"></i>
                연결 테스트
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 실시간 모니터링 탭 */}
      {activeTab === 'monitoring' && (
        <div>
          <div className="admin-grid admin-grid-cols-2 admin-mb-6">
            <div className="admin-card">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">실시간 API 사용량</h3>
              <div style={{ height: '300px', background: '#f9fafb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="admin-text-gray-500">실시간 차트 영역 (Chart.js 구현 예정)</p>
              </div>
            </div>
            <div className="admin-card">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">응답 시간 모니터링</h3>
              <div style={{ height: '300px', background: '#f9fafb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="admin-text-gray-500">응답시간 차트 영역 (Chart.js 구현 예정)</p>
              </div>
            </div>
          </div>

          {/* Rate Limiting 설정 */}
          <div className="admin-card">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">Rate Limiting 설정</h3>
            <div className="admin-grid admin-grid-cols-3" style={{ gap: '16px' }}>
              {apiServices.map(service => (
                <div key={service.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  <div className="admin-flex-between admin-mb-2">
                    <span className="admin-text-sm admin-font-medium">{service.name}</span>
                    {getStatusBadge(service.status, 'service')}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label admin-text-xs">분당 요청 한도</label>
                    <input 
                      type="number" 
                      className="admin-input" 
                      defaultValue={Math.floor(service.requestsLimit / 1440)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label admin-text-xs">일일 요청 한도</label>
                    <input 
                      type="number" 
                      className="admin-input" 
                      defaultValue={service.requestsLimit}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    />
                  </div>
                  <button className="admin-btn admin-btn-secondary admin-text-xs" style={{ width: '100%' }}>
                    설정 저장
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API 로그 탭 */}
      {activeTab === 'logs' && (
        <div>
          <div className="admin-card">
            <div className="admin-flex-between admin-mb-4">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">최근 API 호출 로그</h3>
              <div className="admin-flex" style={{ gap: '8px' }}>
                <select className="admin-select" style={{ width: 'auto' }}>
                  <option>전체 서비스</option>
                  <option>OpenAI</option>
                  <option>Naver</option>
                  <option>Twitter</option>
                </select>
                <select className="admin-select" style={{ width: 'auto' }}>
                  <option>전체 상태</option>
                  <option>성공 (2xx)</option>
                  <option>오류 (4xx, 5xx)</option>
                </select>
                <button className="admin-btn admin-btn-secondary">
                  <i className="fas fa-sync mr-1"></i>새로고침
                </button>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>서비스</th>
                    <th>엔드포인트</th>
                    <th>메서드</th>
                    <th>상태</th>
                    <th>응답시간</th>
                    <th>오류 메시지</th>
                  </tr>
                </thead>
                <tbody>
                  {apiLogs.map(log => (
                    <tr key={log.id}>
                      <td className="admin-text-sm admin-text-gray-600">{log.timestamp}</td>
                      <td className="admin-text-sm admin-text-gray-900">{log.service}</td>
                      <td>
                        <code className="admin-text-xs" style={{ 
                          background: '#f3f4f6', 
                          padding: '2px 4px', 
                          borderRadius: '4px'
                        }}>
                          {log.endpoint}
                        </code>
                      </td>
                      <td>
                        <span 
                          className="admin-text-xs admin-font-medium"
                          style={{ 
                            color: log.method === 'GET' ? '#10b981' : 
                                   log.method === 'POST' ? '#3b82f6' : '#f59e0b'
                          }}
                        >
                          {log.method}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="admin-text-sm admin-font-medium"
                          style={{ color: getStatusColor(log.status) }}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="admin-text-sm admin-text-gray-600">{log.responseTime}ms</td>
                      <td>
                        {log.errorMessage ? (
                          <span className="admin-text-xs" style={{ color: '#ef4444' }}>
                            {log.errorMessage}
                          </span>
                        ) : (
                          <span className="admin-text-xs admin-text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIManagement;