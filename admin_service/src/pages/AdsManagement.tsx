/**
 * AdsManagement.tsx
 * 광고 관리 페이지 - 광고 노출 위치 설정, 광고 콘텐츠 관리, 수익 통계
 */

import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/common/StatusBadge';

interface AdItem {
  id: number;
  title: string;
  type: 'banner' | 'sidebar' | 'popup' | 'native' | 'floating';
  position: string;
  size: string;
  status: 'active' | 'paused' | 'expired';
  clicks: number;
  impressions: number;
  revenue: number;
  startDate: string;
  endDate: string;
  advertiser: string;
  imageUrl?: string;
  targetUrl: string;
  createdAt: string;
  // 페이지별 타겟팅 추가
  targetPages: string[];
  priority: number;
  deviceTarget: 'all' | 'desktop' | 'mobile';
  // 광고 유형 추가 (구글 광고 vs 직접 광고)
  adCategory: 'google' | 'direct';
}

// 구글 광고 전용 인터페이스
interface GoogleAdItem extends AdItem {
  adCategory: 'google';
  googleAdId: string;
  adGroupId: string;
  campaignId: string;
  keywords: string[];
  bidAmount: number;
  qualityScore: number;
}

// 직접 광고 전용 인터페이스  
interface DirectAdItem extends AdItem {
  adCategory: 'direct';
  contractId: string;
  clientContact: string;
  contractAmount: number;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  contractStartDate: string;
  contractEndDate: string;
}

// 사용자 페이지 목록
const USER_PAGES = {
  'main': '메인 페이지',
  'news-list': '뉴스 목록',
  'news-detail': '뉴스 상세',
  'board-list': '게시판 목록',
  'board-detail': '게시판 상세',
  'mypage': '마이페이지',
  'login': '로그인/회원가입'
};

// 광고 위치별 설정
const AD_POSITIONS = {
  'header-banner': { name: '상단 배너', size: '1200x90px', pages: ['main', 'news-list', 'board-list'] },
  'footer-banner': { name: '하단 배너', size: '1200x200px', pages: ['main', 'news-list', 'board-list'] },
  'sidebar-right': { name: '우측 사이드바', size: '160x600px', pages: ['news-detail', 'board-detail'] },
  'sidebar-left': { name: '좌측 사이드바', size: '160x600px', pages: ['news-detail', 'board-detail'] },
  'content-top': { name: '콘텐츠 상단', size: '728x90px', pages: ['news-detail', 'board-detail'] },
  'content-middle': { name: '콘텐츠 중간', size: '300x250px', pages: ['news-detail', 'board-detail'] },
  'content-bottom': { name: '콘텐츠 하단', size: '728x90px', pages: ['news-detail', 'board-detail'] },
  'floating': { name: '플로팅 광고', size: '300x250px', pages: ['main', 'news-list', 'news-detail'] },
  'popup': { name: '팝업 광고', size: '400x300px', pages: ['main'] },
  'native-feed': { name: '네이티브 피드', size: '콘텐츠형', pages: ['news-list', 'board-list'] }
};

const AdsManagement: React.FC = () => {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<'google' | 'direct'>('google'); // 메인 탭 추가
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'paused' | 'expired'>('all');
  const [selectedAds, setSelectedAds] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');

  // 샘플 데이터
  useEffect(() => {
    setLoading(true);
    
    // 실제 API 호출 대신 샘플 데이터 사용
    const sampleAds: AdItem[] = [
      {
        id: 1,
        title: '메인 페이지 상단 배너 - 투자 플랫폼',
        type: 'banner',
        position: 'header-banner',
        size: '1200x90px',
        status: 'active',
        clicks: 245,
        impressions: 12580,
        revenue: 125800,
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        advertiser: '투자플래닛',
        imageUrl: 'https://via.placeholder.com/1200x90/4F46E5/FFFFFF?text=투자플래닛+광고',
        targetUrl: 'https://investment-planet.com',
        targetPages: ['main'],
        priority: 1,
        deviceTarget: 'all',
        adCategory: 'google',
        createdAt: '2025-08-01T09:00:00'
      },
      {
        id: 2,
        title: '뉴스 상세 우측 사이드바 - 부동산 앱',
        type: 'sidebar',
        position: 'sidebar-right',
        size: '160x600px',
        status: 'active',
        clicks: 89,
        impressions: 8750,
        revenue: 43750,
        startDate: '2025-08-01',
        endDate: '2025-09-15',
        advertiser: '부동산나라',
        imageUrl: 'https://via.placeholder.com/160x600/10B981/FFFFFF?text=부동산나라',
        targetUrl: 'https://realestate-nara.com',
        targetPages: ['news-detail'],
        priority: 2,
        deviceTarget: 'desktop',
        adCategory: 'direct',
        createdAt: '2025-08-01T10:30:00'
      },
      {
        id: 3,
        title: '뉴스 목록 하단 배너 - 온라인 쇼핑몰',
        type: 'banner',
        position: 'footer-banner',
        size: '1200x200px',
        status: 'paused',
        clicks: 156,
        impressions: 5420,
        revenue: 27100,
        startDate: '2025-07-15',
        endDate: '2025-08-15',
        advertiser: '쇼핑365',
        imageUrl: 'https://via.placeholder.com/1200x200/F59E0B/FFFFFF?text=쇼핑365+할인혜택',
        targetUrl: 'https://shopping365.com',
        targetPages: ['news-list'],
        priority: 3,
        deviceTarget: 'all',
        adCategory: 'google',
        createdAt: '2025-07-15T14:20:00'
      },
      {
        id: 4,
        title: '뉴스 피드 네이티브 광고 - 교육 플랫폼',
        type: 'native',
        position: 'native-feed',
        size: '콘텐츠형',
        status: 'expired',
        clicks: 67,
        impressions: 3200,
        revenue: 16000,
        startDate: '2025-07-01',
        endDate: '2025-07-31',
        advertiser: '에듀테크',
        targetUrl: 'https://edutech-learn.com',
        targetPages: ['news-list'],
        priority: 5,
        deviceTarget: 'all',
        adCategory: 'direct',
        createdAt: '2025-07-01T11:15:00'
      },
      {
        id: 5,
        title: '메인 페이지 팝업 - 금융 서비스',
        type: 'popup',
        position: 'popup',
        size: '400x300px',
        status: 'active',
        clicks: 312,
        impressions: 9800,
        revenue: 98000,
        startDate: '2025-08-01',
        endDate: '2025-08-30',
        advertiser: '핀테크솔루션',
        imageUrl: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=핀테크솔루션',
        targetUrl: 'https://fintech-solution.com',
        targetPages: ['main'],
        priority: 4,
        deviceTarget: 'all',
        adCategory: 'google',
        createdAt: '2025-08-01T16:45:00'
      },
      {
        id: 6,
        title: '뉴스 상세 콘텐츠 중간 - 건강식품',
        type: 'banner',
        position: 'content-middle',
        size: '300x250px',
        status: 'active',
        clicks: 78,
        impressions: 4500,
        revenue: 22500,
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        advertiser: '헬스라이프',
        imageUrl: 'https://via.placeholder.com/300x250/8B5CF6/FFFFFF?text=헬스라이프',
        targetUrl: 'https://health-life.com',
        targetPages: ['news-detail'],
        priority: 3,
        deviceTarget: 'all',
        adCategory: 'direct',
        createdAt: '2025-08-01T12:00:00'
      },
      {
        id: 7,
        title: '게시판 목록 상단 배너 - 자동차',
        type: 'banner',
        position: 'header-banner',
        size: '1200x90px',
        status: 'active',
        clicks: 134,
        impressions: 7800,
        revenue: 39000,
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        advertiser: '카모터스',
        imageUrl: 'https://via.placeholder.com/1200x90/EF4444/FFFFFF?text=카모터스+신차출시',
        targetUrl: 'https://car-motors.com',
        targetPages: ['board-list'],
        priority: 2,
        deviceTarget: 'all',
        adCategory: 'google',
        createdAt: '2025-08-01T15:30:00'
      },
      {
        id: 8,
        title: '모바일 플로팅 광고 - 배달앱',
        type: 'floating',
        position: 'floating',
        size: '300x250px',
        status: 'active',
        clicks: 198,
        impressions: 6200,
        revenue: 31000,
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        advertiser: '딜리버리킹',
        imageUrl: 'https://via.placeholder.com/300x250/06B6D4/FFFFFF?text=딜리버리킹',
        targetUrl: 'https://delivery-king.com',
        targetPages: ['main', 'news-list'],
        priority: 1,
        deviceTarget: 'mobile',
        adCategory: 'direct',
        createdAt: '2025-08-01T18:00:00'
      }
    ];
    
    setTimeout(() => {
      setAds(sampleAds);
      setLoading(false);
    }, 1000);
  }, []);

  // 탭별/페이지별/위치별 필터링
  const filteredAds = ads.filter(ad => {
    // 상태 필터링
    if (selectedTab !== 'all' && ad.status !== selectedTab) return false;
    
    // 페이지 필터링
    if (selectedPage !== 'all' && !ad.targetPages.includes(selectedPage)) return false;
    
    // 위치 필터링
    if (selectedPosition !== 'all' && ad.position !== selectedPosition) return false;
    
    return true;
  });

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAds(filteredAds.map(ad => ad.id));
    } else {
      setSelectedAds([]);
    }
  };

  // 개별 선택/해제
  const handleSelectAd = (adId: number) => {
    setSelectedAds(prev => 
      prev.includes(adId) 
        ? prev.filter(id => id !== adId)
        : [...prev, adId]
    );
  };

  // 광고 상태 변경
  const handleStatusChange = async (adId: number, newStatus: 'active' | 'paused') => {
    setActionLoading(true);
    try {
      // 실제 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000)); // 시뮬레이션
      
      setAds(prev => prev.map(ad => 
        ad.id === adId ? { ...ad, status: newStatus } : ad
      ));
      
      alert(`광고가 ${newStatus === 'active' ? '활성화' : '일시정지'}되었습니다.`);
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 광고 삭제
  const handleDeleteAd = async (adId: number) => {
    if (!window.confirm('정말로 이 광고를 삭제하시겠습니까?')) return;
    
    setActionLoading(true);
    try {
      // 실제 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000)); // 시뮬레이션
      
      setAds(prev => prev.filter(ad => ad.id !== adId));
      setSelectedAds(prev => prev.filter(id => id !== adId));
      
      alert('광고가 삭제되었습니다.');
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 수익률 계산
  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  // 수익 포맷팅
  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  // 상태 배지 타입 변환 (StatusBadgeProps에 맞게 매핑)
  const getStatusBadgeType = (status: string): 'completed' | 'pending' | 'reviewing' | 'rejected' | 'processing' | 'failed' | 'cancelled' | 'scheduled' | 'retrying' => {
    switch (status) {
      case 'active': return 'completed';
      case 'paused': return 'pending';
      case 'expired': return 'cancelled';
      default: return 'pending';
    }
  };

  // 상태 라벨
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '활성';
      case 'paused': return '일시정지';
      case 'expired': return '만료';
      default: return status;
    }
  };

  // 광고 타입 라벨
  const getAdTypeLabel = (type: string) => {
    switch (type) {
      case 'banner': return '배너';
      case 'sidebar': return '사이드바';
      case 'popup': return '팝업';
      case 'native': return '네이티브';
      case 'floating': return '플로팅';
      default: return type;
    }
  };

  // 총 수익 계산
  const totalRevenue = ads.reduce((sum, ad) => sum + ad.revenue, 0);
  const activeAdsCount = ads.filter(ad => ad.status === 'active').length;
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);

  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-loading-spinner"></div>
        <p>광고 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* 페이지 헤더 */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h1>
            <i className="fas fa-bullhorn admin-text-yellow-600"></i>
            광고 관리
          </h1>
          <p className="admin-page-description">
            광고 수익 관리 및 노출 위치 설정
          </p>
        </div>
        
        <div className="admin-page-actions">
          <button 
            className="admin-btn admin-btn-primary"
            onClick={() => alert('새 광고 등록 기능을 구현 중입니다.')}
            disabled={actionLoading}
          >
            <i className="fas fa-plus"></i>
            새 광고 등록
          </button>
        </div>
      </div>

      {/* 메인 탭 (구글 광고 / 직접 광고) */}
      <div className="admin-main-tabs">
        <button
          className={`admin-main-tab ${mainTab === 'google' ? 'active' : ''}`}
          onClick={() => setMainTab('google')}
        >
          <i className="fab fa-google"></i>
          구글 광고
        </button>
        <button
          className={`admin-main-tab ${mainTab === 'direct' ? 'active' : ''}`}
          onClick={() => setMainTab('direct')}
        >
          <i className="fas fa-handshake"></i>
          직접 광고
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-bg-green-100">
            <i className="fas fa-won-sign admin-text-green-600"></i>
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-label">총 수익</div>
            <div className="admin-stat-value">{formatRevenue(totalRevenue)}</div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-bg-blue-100">
            <i className="fas fa-play admin-text-blue-600"></i>
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-label">활성 광고</div>
            <div className="admin-stat-value">{activeAdsCount}개</div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-bg-purple-100">
            <i className="fas fa-mouse-pointer admin-text-purple-600"></i>
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-label">총 클릭</div>
            <div className="admin-stat-value">{totalClicks.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="admin-stat-icon admin-bg-orange-100">
            <i className="fas fa-eye admin-text-orange-600"></i>
          </div>
          <div className="admin-stat-content">
            <div className="admin-stat-label">총 노출</div>
            <div className="admin-stat-value">{totalImpressions.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 광고 목록 카드 */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-flex-between">
            <div>
              <h3 className="admin-text-lg admin-font-medium">
                광고 목록 ({filteredAds.length}개)
              </h3>
            </div>
            {selectedAds.length > 0 && (
              <div className="admin-flex admin-gap-2">
                <button 
                  className="admin-btn admin-btn-success admin-btn-sm"
                  onClick={() => selectedAds.forEach(id => handleStatusChange(id, 'active'))}
                  disabled={actionLoading}
                >
                  <i className="fas fa-play"></i>
                  활성화
                </button>
                <button 
                  className="admin-btn admin-btn-warning admin-btn-sm"
                  onClick={() => selectedAds.forEach(id => handleStatusChange(id, 'paused'))}
                  disabled={actionLoading}
                >
                  <i className="fas fa-pause"></i>
                  일시정지
                </button>
                <span className="admin-text-sm admin-text-gray-600">
                  {selectedAds.length}개 선택됨
                </span>
              </div>
            )}
          </div>
          
          {/* 탭 네비게이션 */}
          <div className="admin-tabs admin-mt-4">
            <button 
              className={`admin-tab ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              전체 ({ads.length})
            </button>
            <button 
              className={`admin-tab ${selectedTab === 'active' ? 'active' : ''}`}
              onClick={() => setSelectedTab('active')}
            >
              활성 ({ads.filter(ad => ad.status === 'active').length})
            </button>
            <button 
              className={`admin-tab ${selectedTab === 'paused' ? 'active' : ''}`}
              onClick={() => setSelectedTab('paused')}
            >
              일시정지 ({ads.filter(ad => ad.status === 'paused').length})
            </button>
            <button 
              className={`admin-tab ${selectedTab === 'expired' ? 'active' : ''}`}
              onClick={() => setSelectedTab('expired')}
            >
              만료 ({ads.filter(ad => ad.status === 'expired').length})
            </button>
          </div>
          
          {/* 페이지별/위치별 필터 */}
          <div className="admin-flex admin-gap-4 admin-mt-4 admin-items-center admin-flex-wrap">
            <div className="admin-flex admin-items-center admin-gap-2">
              <label className="admin-text-sm admin-font-medium admin-text-gray-700">페이지:</label>
              <select 
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="admin-select admin-select-sm"
              >
                <option value="all">전체 페이지</option>
                {Object.entries(USER_PAGES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            
            <div className="admin-flex admin-items-center admin-gap-2">
              <label className="admin-text-sm admin-font-medium admin-text-gray-700">광고 위치:</label>
              <select 
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="admin-select admin-select-sm"
              >
                <option value="all">전체 위치</option>
                {Object.entries(AD_POSITIONS).map(([key, config]) => (
                  <option key={key} value={key}>{config.name} ({config.size})</option>
                ))}
              </select>
            </div>
            
            <div className="admin-text-sm admin-text-gray-600">
              필터 결과: <span className="admin-font-medium">{filteredAds.length}개</span>
            </div>
            
            {(selectedPage !== 'all' || selectedPosition !== 'all') && (
              <button 
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => {
                  setSelectedPage('all');
                  setSelectedPosition('all');
                }}
              >
                <i className="fas fa-times"></i>
                필터 초기화
              </button>
            )}
          </div>
        </div>

        <div className="admin-card-content">
          {filteredAds.length === 0 ? (
            <div className="admin-text-center admin-py-8">
              <i className="fas fa-bullhorn fa-2x admin-text-gray-400 admin-mb-4"></i>
              <p className="admin-text-gray-500">등록된 광고가 없습니다.</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedAds.length === filteredAds.length && filteredAds.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>광고</th>
                    <th>타입/위치</th>
                    <th>타겟 페이지</th>
                    <th>광고주</th>
                    <th>상태</th>
                    <th>우선순위</th>
                    <th>실적</th>
                    <th>수익</th>
                    <th>기간</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map(ad => (
                    <tr key={ad.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedAds.includes(ad.id)}
                          onChange={() => handleSelectAd(ad.id)}
                        />
                      </td>
                      <td>
                        <div className="admin-flex admin-items-center admin-gap-3">
                          {ad.imageUrl && (
                            <img 
                              src={ad.imageUrl} 
                              alt={ad.title}
                              className="admin-w-12 admin-h-8 admin-object-cover admin-rounded"
                            />
                          )}
                          <div>
                            <div className="admin-font-medium">{ad.title}</div>
                            <div className="admin-text-sm admin-text-gray-500">{ad.size}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="admin-font-medium">{getAdTypeLabel(ad.type)}</div>
                          <div className="admin-text-sm admin-text-gray-500">
                            {AD_POSITIONS[ad.position as keyof typeof AD_POSITIONS]?.name || ad.position}
                          </div>
                          <div className="admin-text-xs admin-text-blue-600">
                            {ad.deviceTarget === 'all' ? '전체 기기' : 
                             ad.deviceTarget === 'desktop' ? '데스크톱' : '모바일'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-text-sm">
                          {ad.targetPages.map(page => (
                            <span key={page} className="admin-inline-block admin-bg-blue-100 admin-text-blue-800 admin-px-2 admin-py-1 admin-rounded admin-text-xs admin-mr-1 admin-mb-1">
                              {USER_PAGES[page as keyof typeof USER_PAGES] || page}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="admin-font-medium">{ad.advertiser}</div>
                      </td>
                      <td>
                        <StatusBadge 
                          status={getStatusBadgeType(ad.status)}
                          text={getStatusLabel(ad.status)}
                        />
                      </td>
                      <td>
                        <div className="admin-flex admin-items-center admin-gap-1">
                          <span className={`admin-inline-block admin-px-2 admin-py-1 admin-rounded admin-text-xs admin-font-medium ${
                            ad.priority <= 2 ? 'admin-bg-red-100 admin-text-red-800' : 
                            ad.priority <= 4 ? 'admin-bg-yellow-100 admin-text-yellow-800' : 
                            'admin-bg-green-100 admin-text-green-800'
                          }`}>
                            {ad.priority}순위
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-text-sm">
                          <div>클릭: {ad.clicks.toLocaleString()}</div>
                          <div>노출: {ad.impressions.toLocaleString()}</div>
                          <div className="admin-text-blue-600">CTR: {calculateCTR(ad.clicks, ad.impressions)}%</div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-font-medium admin-text-green-600">
                          {formatRevenue(ad.revenue)}
                        </div>
                      </td>
                      <td>
                        <div className="admin-text-sm">
                          <div>{ad.startDate}</div>
                          <div>~ {ad.endDate}</div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-flex admin-gap-1">
                          {ad.status === 'active' ? (
                            <button 
                              className="admin-btn admin-btn-warning admin-btn-xs"
                              onClick={() => handleStatusChange(ad.id, 'paused')}
                              disabled={actionLoading}
                              title="일시정지"
                            >
                              <i className="fas fa-pause"></i>
                            </button>
                          ) : ad.status === 'paused' ? (
                            <button 
                              className="admin-btn admin-btn-success admin-btn-xs"
                              onClick={() => handleStatusChange(ad.id, 'active')}
                              disabled={actionLoading}
                              title="활성화"
                            >
                              <i className="fas fa-play"></i>
                            </button>
                          ) : null}
                          
                          <button 
                            className="admin-btn admin-btn-info admin-btn-xs"
                            onClick={() => alert('광고 수정 기능을 구현 중입니다.')}
                            disabled={actionLoading}
                            title="수정"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          
                          <button 
                            className="admin-btn admin-btn-danger admin-btn-xs"
                            onClick={() => handleDeleteAd(ad.id)}
                            disabled={actionLoading}
                            title="삭제"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdsManagement;