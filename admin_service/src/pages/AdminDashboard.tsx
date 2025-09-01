import React, { useState, useEffect } from 'react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { LineChart, DoughnutChart } from '../components/charts';
import { getDashboardStats, getRecentActivities, DashboardStats, RecentActivity } from '../api/dashboard';
import axiosInstance from '../api/axiosInstance';
import crawlerInstance from '../api/crawlerInstance';

interface NewsItem {
  id: number;
  title: string;
  subtitle: string;
  source: string;
  publisher: string;
  status: 'completed' | 'pending' | 'reviewing' | 'rejected';
  board: string;
  comments: number;
  timeAgo: string;
}

interface TrendingTopic {
  id: number;
  category: string;
  title: string;
  description: string;
  comments: number;
  categoryColor: string;
  emoji: string;
}

interface CrawlingStatus {
  is_running: boolean;
  current_source: string | null;
  current_category: string | null;
  progress: number;
  total_target: number;
  collected_count: number;
  start_time: string | null;
  estimated_end_time: string | null;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crawlingStatus, setCrawlingStatus] = useState<CrawlingStatus>({
    is_running: false,
    current_source: null,
    current_category: null,
    progress: 0,
    total_target: 0,
    collected_count: 0,
    start_time: null,
    estimated_end_time: null
  });

  const [recentNews] = useState<NewsItem[]>([
    {
      id: 1,
      title: "대통령, 부동산 정책 발표... 시장 반응은?",
      subtitle: "정부 부동산 규제 완화 방향 제시",
      source: "네이버 뉴스",
      publisher: "연합뉴스",
      status: "completed",
      board: "정치 토론장",
      comments: 247,
      timeAgo: "5분 전"
    },
    {
      id: 2,
      title: "AI 기술 발전, 일자리에 미치는 영향은",
      subtitle: "ChatGPT 도입 후 변화하는 업무 환경",
      source: "다음 뉴스",
      publisher: "테크크런치",
      status: "reviewing",
      board: "기술 뉴스",
      comments: 156,
      timeAgo: "12분 전"
    },
    {
      id: 3,
      title: "코인 시장 급락, 투자자들 패닉 상태",
      subtitle: "비트코인 30% 하락, 알트코인 더 큰 폭 하락",
      source: "트위터 트렌드",
      publisher: "@CoinDesk",
      status: "rejected",
      board: "경제 분석",
      comments: 523,
      timeAgo: "18분 전"
    },
    {
      id: 4,
      title: "K-pop 스타 해외 진출 성과 발표",
      subtitle: "빌보드 차트 상위권 진입 소식",
      source: "네이버 뉴스",
      publisher: "스포츠조선",
      status: "completed",
      board: "연예 뉴스",
      comments: 89,
      timeAgo: "25분 전"
    }
  ]);

  const [trendingTopics] = useState<TrendingTopic[]>([
    {
      id: 1,
      category: "정치",
      title: "대통령 부동산 정책 어떻게 생각하세요?",
      description: "규제 완화 vs 추가 규제 의견이 팽팽히...",
      comments: 247,
      categoryColor: "red",
      emoji: "🔥"
    },
    {
      id: 2,
      category: "기술",
      title: "AI가 내 일자리를 빼앗을까?",
      description: "ChatGPT 시대, 직업의 변화와 대응책...",
      comments: 156,
      categoryColor: "blue",
      emoji: "⚡"
    },
    {
      id: 3,
      category: "경제",
      title: "코인 투자, 지금이 기회일까?",
      description: "급락 후 매수 기회 vs 추가 하락 우려...",
      comments: 523,
      categoryColor: "green",
      emoji: "📈"
    }
  ]);

  // 데이터 로드
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, activitiesData] = await Promise.all([
        getDashboardStats(),
        getRecentActivities(10)
      ]);
      
      setStats(statsData);
      setActivities(activitiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
      console.error('Dashboard data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadDashboardData();
    fetchCrawlingStatus();
  }, []);

  

  // 크롤링 중일 때는 더 자주 상태 체크 (5초마다)
  useEffect(() => {
    let crawlingInterval: NodeJS.Timeout | null = null;
    
    if (crawlingStatus.is_running) {
      crawlingInterval = setInterval(() => {
        fetchCrawlingStatus();
      }, 5000);
    }

    return () => {
      if (crawlingInterval) {
        clearInterval(crawlingInterval);
      }
    };
  }, [crawlingStatus.is_running]);

  // 크롤링 상태 조회
  const fetchCrawlingStatus = async () => {
    try {
      const response = await crawlerInstance.get('/scheduler/status');
      // 실제 crawler 서비스 응답에 맞게 수정
      if (response.data) {
        setCrawlingStatus({
          is_running: response.data.is_running || false,
          current_source: null,
          current_category: null,
          progress: 0,
          total_target: 0,
          collected_count: 0,
          start_time: null,
          estimated_end_time: null
        });
      }
    } catch (error) {
      console.error('크롤링 상태 조회 실패:', error);
    }
  };

  // 뉴스 크롤링 시작
  const startNewsCrawling = async () => {
    try {
      const response = await crawlerInstance.post('/crawl/all');
      if (response.data) {
        console.log('뉴스 크롤링 시작됨:', response.data);
        // 크롤링 상태 즉시 업데이트
        fetchCrawlingStatus();
      }
    } catch (error) {
      console.error('뉴스 크롤링 시작 실패:', error);
    }
  };

  const handleQuickAction = (action: string) => {
    console.log(`실행: ${action}`);
    if (action === '뉴스 수집 시작') {
      startNewsCrawling();
    }
  };

  // 뉴스 수집 차트 데이터
  const newsCollectionData = {
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    datasets: [
      {
        label: '뉴스 수집 건수',
        data: [12, 19, 3, 25, 42, 33, 18, 28],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'AI 요약 완료',
        data: [8, 15, 2, 20, 38, 30, 15, 25],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // 카테고리별 게시판 활동 차트 데이터
  const categoryActivityData = {
    labels: ['정치', '경제', '사회', '기술', '연예', '스포츠'],
    datasets: [
      {
        data: [30, 25, 20, 15, 7, 3],
        backgroundColor: [
          '#ef4444', // 정치 - 빨간색
          '#22c55e', // 경제 - 초록색
          '#3b82f6', // 사회 - 파란색
          '#8b5cf6', // 기술 - 보라색
          '#f59e0b', // 연예 - 주황색
          '#06b6d4', // 스포츠 - 하늘색
        ],
        borderWidth: 0,
      },
    ],
  };

  if (loading) {
    return (
      <div className="admin-fade-in">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800 admin-mb-6">대시보드</h1>
        <div className="admin-flex-center" style={{ height: '200px' }}>
          <p className="admin-text-gray-500">데이터를 로드하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-fade-in">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800 admin-mb-6">대시보드</h1>
        <div className="admin-card">
          <div className="admin-flex-center" style={{ padding: '40px' }}>
            <div className="admin-text-center">
              <p className="admin-text-red-500 admin-mb-4">오류가 발생했습니다: {error}</p>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={loadDashboardData}
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-fade-in">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800 admin-mb-6">대시보드</h1>
        <div className="admin-card">
          <p className="admin-text-gray-500">데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-fade-in">
      <div className="admin-flex-between admin-mb-6">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800">대시보드</h1>
        
        {/* 크롤링 상태 표시 */}
        <div className="crawling-status-container">
          <span className="crawling-status-label">크롤링:</span>
          {crawlingStatus.is_running ? (
            <div className="crawling-status-active">
              <div className="admin-status-indicator online"></div>
              <span className="crawling-status-text active">
                크롤링 중 ({crawlingStatus.collected_count}/{crawlingStatus.total_target})
              </span>
              {crawlingStatus.current_source && (
                <span className="crawling-status-source">
                  - {crawlingStatus.current_source}
                  {crawlingStatus.current_category && ` (${crawlingStatus.current_category})`}
                </span>
              )}
            </div>
          ) : (
            <div className="crawling-status-inactive">
              <div className="admin-status-indicator offline"></div>
              <span className="crawling-status-text">대기중</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 실시간 통계 카드 */}
      <div className="admin-grid admin-grid-cols-4 admin-mb-6">
        <StatCard
          title="총 사용자"
          value={stats.totalUsers.toLocaleString()}
          change={`+${stats.todayUsers}명 오늘`}
          changeType="increase"
          icon="fas fa-users"
          color="blue"
        />
        <StatCard
          title="수집된 뉴스"
          value={stats.totalNews.toLocaleString()}
          change={`+${stats.todayNews}건 오늘`}
          changeType="increase"
          icon="fas fa-newspaper"
          color="green"
        />
        <StatCard
          title="AI 요약 대기"
          value={stats.pendingNews.toString()}
          change="처리 대기 중"
          icon="fas fa-robot"
          color="orange"
        />
        <StatCard
          title="일일 활성 사용자"
          value={stats.activeUsers.toLocaleString()}
          change="24시간 기준"
          changeType="increase"
          icon="fas fa-chart-line"
          color="purple"
        />
      </div>

      {/* 차트 및 분석 섹션 */}
      <div className="admin-grid admin-grid-cols-2 admin-mb-6">
        <div className="admin-card">
          <div className="admin-flex-between admin-mb-4">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">뉴스 수집 및 처리 현황</h3>
            <div className="admin-flex" style={{ gap: '8px' }}>
              <button className="admin-btn admin-btn-secondary admin-text-xs">7일</button>
              <button className="admin-btn admin-btn-primary admin-text-xs">30일</button>
              <button className="admin-btn admin-btn-secondary admin-text-xs">90일</button>
            </div>
          </div>
          <LineChart data={newsCollectionData} height={280} />
        </div>

        <div className="admin-card">
          <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">카테고리별 게시판 활동</h3>
          <DoughnutChart data={categoryActivityData} height={280} />
        </div>
      </div>

      {/* 최근 활동 및 뉴스 수집 현황 */}
      <div className="admin-grid admin-grid-cols-3 admin-mb-6">
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div className="admin-flex-between admin-mb-4" style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">최근 뉴스 수집 현황</h3>
            <a href="/news" className="admin-text-sm" style={{ color: '#4f46e5', textDecoration: 'none' }}>전체 보기</a>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>뉴스 제목</th>
                  <th>소스</th>
                  <th>AI 상태</th>
                  <th>게시판</th>
                  <th>수집 시간</th>
                </tr>
              </thead>
              <tbody>
                {recentNews.map(news => (
                  <tr key={news.id}>
                    <td>
                      <div className="admin-text-sm admin-font-medium admin-text-gray-900">{news.title}</div>
                      <div className="admin-text-sm admin-text-gray-500">{news.subtitle}</div>
                    </td>
                    <td>
                      <div className="admin-text-sm admin-text-gray-900">{news.source}</div>
                      <div className="admin-text-sm admin-text-gray-500">{news.publisher}</div>
                    </td>
                    <td>
                      <StatusBadge status={news.status} />
                    </td>
                    <td>
                      <div className="admin-text-sm admin-text-gray-900">{news.board}</div>
                      <div className="admin-text-sm admin-text-gray-500">{news.comments} 댓글</div>
                    </td>
                    <td className="admin-text-sm admin-text-gray-500">{news.timeAgo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 시스템 현황 */}
        <div className="admin-card">
          <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4" style={{ paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>시스템 현황</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#dcfce7', borderRadius: '6px', display: 'flex', gap: '12px' }}>
              <i className="fas fa-rss" style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }}></i>
              <div style={{ flex: 1 }}>
                <p className="admin-text-sm admin-font-medium" style={{ color: '#065f46' }}>뉴스 수집 정상</p>
                <p className="admin-text-sm" style={{ color: '#047857' }}>네이버/다음/트위터 RSS 피드 정상 작동 중</p>
                <p className="admin-text-xs admin-mt-1" style={{ color: '#059669' }}>1분 전</p>
              </div>
            </div>
            
            <div style={{ padding: '12px', background: '#dbeafe', borderRadius: '6px', display: 'flex', gap: '12px' }}>
              <i className="fas fa-brain" style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }}></i>
              <div style={{ flex: 1 }}>
                <p className="admin-text-sm admin-font-medium" style={{ color: '#1e3a8a' }}>AI 요약 처리 중</p>
                <p className="admin-text-sm" style={{ color: '#1d4ed8' }}>ChatGPT API {stats.pendingNews}건 처리 대기</p>
                <p className="admin-text-xs admin-mt-1" style={{ color: '#2563eb' }}>실시간</p>
              </div>
            </div>
            
            <div style={{ padding: '12px', background: '#e9d5ff', borderRadius: '6px', display: 'flex', gap: '12px' }}>
              <i className="fas fa-comments" style={{ color: '#8b5cf6', flexShrink: 0, marginTop: '2px' }}></i>
              <div style={{ flex: 1 }}>
                <p className="admin-text-sm admin-font-medium" style={{ color: '#581c87' }}>활발한 토론 진행</p>
                <p className="admin-text-sm" style={{ color: '#7c3aed' }}>정치 토론장에서 열띤 토론 중</p>
                <p className="admin-text-xs admin-mt-1" style={{ color: '#8b5cf6' }}>5분 전</p>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '6px', display: 'flex', gap: '12px' }}>
              <i className="fas fa-plus-circle" style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }}></i>
              <div style={{ flex: 1 }}>
                <p className="admin-text-sm admin-font-medium" style={{ color: '#92400e' }}>새 게시판 생성</p>
                <p className="admin-text-sm" style={{ color: '#d97706' }}>"환경 이슈" 게시판이 새로 만들어졌습니다</p>
                <p className="admin-text-xs admin-mt-1" style={{ color: '#f59e0b' }}>15분 전</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="admin-card admin-mb-6">
        <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">빠른 액션</h3>
        <div className="admin-grid admin-grid-cols-4">
          <button 
            className="admin-btn admin-btn-primary admin-flex-center"
            style={{ padding: '12px' }}
            onClick={() => handleQuickAction('뉴스 수집 시작')}
          >
            <i className="fas fa-play mr-2"></i>
            뉴스 수집 시작
          </button>
          <button 
            className="admin-btn admin-btn-secondary admin-flex-center"
            style={{ padding: '12px' }}
            onClick={() => handleQuickAction('게시판 생성')}
          >
            <i className="fas fa-plus-square mr-2"></i>
            게시판 생성
          </button>
          <button 
            className="admin-btn admin-btn-secondary admin-flex-center"
            style={{ padding: '12px' }}
            onClick={() => handleQuickAction('AI 요약 실행')}
          >
            <i className="fas fa-robot mr-2"></i>
            AI 요약 실행
          </button>
          <button 
            className="admin-btn admin-btn-secondary admin-flex-center"
            style={{ padding: '12px' }}
            onClick={() => handleQuickAction('커뮤니티 리포트')}
          >
            <i className="fas fa-download mr-2"></i>
            커뮤니티 리포트
          </button>
        </div>
      </div>

      {/* 인기 토론 주제 */}
      <div className="admin-card">
        <div className="admin-flex-between admin-mb-4">
          <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">실시간 인기 토론 주제</h3>
          <a href="/community" className="admin-text-sm" style={{ color: '#4f46e5', textDecoration: 'none' }}>전체 게시판 보기</a>
        </div>
        <div className="admin-grid admin-grid-cols-3">
          {trendingTopics.map(topic => (
            <div key={topic.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', transition: 'box-shadow 0.2s ease' }}>
              <div className="admin-flex-between admin-mb-2">
                <span 
                  style={{ 
                    padding: '2px 8px', 
                    fontSize: '12px', 
                    fontWeight: '500', 
                    borderRadius: '4px',
                    background: topic.categoryColor === 'red' ? '#fecaca' : topic.categoryColor === 'blue' ? '#dbeafe' : '#dcfce7',
                    color: topic.categoryColor === 'red' ? '#dc2626' : topic.categoryColor === 'blue' ? '#1e40af' : '#166534'
                  }}
                >
                  {topic.category}
                </span>
                <span className="admin-text-sm admin-text-gray-500">{topic.emoji} {topic.comments} 댓글</span>
              </div>
              <h4 className="admin-font-medium admin-text-gray-900 admin-mb-1">{topic.title}</h4>
              <p className="admin-text-sm admin-text-gray-600">{topic.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;