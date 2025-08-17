import React, { useState } from 'react';

interface AdUnit {
  id: number;
  name: string;
  page: string;
  position: 'header' | 'sidebar_left' | 'sidebar_right' | 'footer' | 'content_middle' | 'floating';
  size: string;
  adType: 'google' | 'direct';
  status: 'active' | 'paused' | 'pending';
  impressions: number;
  clicks: number;
  revenue: number;
  ctr: number;
  cpm: number;
  // 직접 광고용 추가 필드
  advertiser?: string;
  contractType?: 'monthly' | 'weekly' | 'daily' | 'fixed';
  contractAmount?: number;
  startDate?: string;
  endDate?: string;
  // 구글 광고용 추가 필드
  adUnitId?: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  impressions: number;
  clicks: number;
}

const AdManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'googelunits' | 'directunits' | 'settings' | 'analytics'>('overview');
  const [showGoogleAdModal, setShowGoogleAdModal] = useState(false);
  const [showDirectAdModal, setShowDirectAdModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingAd, setEditingAd] = useState<AdUnit | null>(null);
  const [statsAd, setStatsAd] = useState<AdUnit | null>(null);
  
  // 새 광고 단위 폼 데이터
  const [newAdForm, setNewAdForm] = useState({
    name: '',
    page: '',
    position: '',
    size: '',
    adType: 'google' as 'google' | 'direct',
    // 구글 광고용
    adUnitId: '',
    // 직접 광고용
    advertiser: '',
    contractType: 'monthly' as 'monthly' | 'weekly' | 'daily' | 'fixed',
    contractAmount: 0,
    startDate: '',
    endDate: ''
  });
  
  const [adUnits, setAdUnits] = useState<AdUnit[]>([
    // 구글 광고 단위
    {
      id: 1,
      name: "메인페이지 상단 배너",
      page: "main",
      position: "header",
      size: "1200x90",
      adType: "google",
      status: "active",
      impressions: 25670,
      clicks: 342,
      revenue: 15420,
      ctr: 1.33,
      cpm: 0.60,
      adUnitId: "ca-pub-1234567890123456/2847593610"
    },
    {
      id: 2,
      name: "뉴스목록 우측 사이드바",
      page: "news_list",
      position: "sidebar_right",
      size: "160x600",
      adType: "google",
      status: "active",
      impressions: 18940,
      clicks: 156,
      revenue: 8760,
      ctr: 0.82,
      cpm: 0.46,
      adUnitId: "ca-pub-1234567890123456/5691237408"
    },
    {
      id: 3,
      name: "뉴스상세 하단 배너",
      page: "news_detail",
      position: "footer",
      size: "1200x200",
      adType: "google",
      status: "paused",
      impressions: 12340,
      clicks: 89,
      revenue: 5230,
      ctr: 0.72,
      cpm: 0.42,
      adUnitId: "ca-pub-1234567890123456/8134957026"
    },
    // 직접 광고 단위
    {
      id: 4,
      name: "게시판 좌측 사이드바",
      page: "board_list",
      position: "sidebar_left",
      size: "160x600",
      adType: "direct",
      status: "active",
      impressions: 8500,
      clicks: 125,
      revenue: 300000,
      ctr: 1.47,
      cpm: 35.29,
      advertiser: "부동산나라",
      contractType: "monthly",
      contractAmount: 300000,
      startDate: "2024-01-01",
      endDate: "2024-01-31"
    },
    {
      id: 5,
      name: "메인페이지 플로팅 광고",
      page: "main",
      position: "floating",
      size: "300x250",
      adType: "direct",
      status: "active",
      impressions: 15230,
      clicks: 234,
      revenue: 500000,
      ctr: 1.54,
      cpm: 32.83,
      advertiser: "헬스라이프",
      contractType: "weekly",
      contractAmount: 125000,
      startDate: "2024-01-08",
      endDate: "2024-01-14"
    },
    {
      id: 6,
      name: "뉴스상세 콘텐츠 중간",
      page: "news_detail",
      position: "content_middle",
      size: "728x90",
      adType: "direct",
      status: "pending",
      impressions: 0,
      clicks: 0,
      revenue: 0,
      ctr: 0,
      cpm: 0,
      advertiser: "테크스타트업",
      contractType: "daily",
      contractAmount: 50000,
      startDate: "2024-01-15",
      endDate: "2024-01-21"
    }
  ]);

  const [revenueData] = useState<RevenueData[]>([
    { date: "2024-01-10", revenue: 12340, impressions: 45600, clicks: 234 },
    { date: "2024-01-11", revenue: 13450, impressions: 48200, clicks: 267 },
    { date: "2024-01-12", revenue: 15670, impressions: 52100, clicks: 298 },
    { date: "2024-01-13", revenue: 14230, impressions: 49800, clicks: 276 },
    { date: "2024-01-14", revenue: 16890, impressions: 54300, clicks: 312 },
    { date: "2024-01-15", revenue: 18340, impressions: 57200, clicks: 334 }
  ]);

  const googleAds = adUnits.filter(unit => unit.adType === 'google');
  const directAds = adUnits.filter(unit => unit.adType === 'direct');
  
  const totalRevenue = adUnits.reduce((sum, unit) => sum + unit.revenue, 0);
  const googleRevenue = googleAds.reduce((sum, unit) => sum + unit.revenue, 0);
  const directRevenue = directAds.reduce((sum, unit) => sum + unit.revenue, 0);
  
  const totalImpressions = adUnits.reduce((sum, unit) => sum + unit.impressions, 0);
  const totalClicks = adUnits.reduce((sum, unit) => sum + unit.clicks, 0);
  const averageCTR = totalClicks > 0 ? (totalClicks / totalImpressions * 100) : 0;

  // 사용자 화면 페이지 정의
  const pages = [
    { value: 'main', label: '메인 페이지', description: 'factlab.com/' },
    { value: 'news_list', label: '뉴스 목록', description: '뉴스 피드 페이지' },
    { value: 'news_detail', label: '뉴스 상세', description: '개별 뉴스 읽기 페이지' },
    { value: 'board_list', label: '게시판 목록', description: '커뮤니티 게시판 목록' },
    { value: 'board_detail', label: '게시판 상세', description: '게시글 상세 페이지' },
    { value: 'board_write', label: '글쓰기', description: '게시글 작성 페이지' },
    { value: 'login', label: '로그인', description: '사용자 로그인 페이지' },
    { value: 'register', label: '회원가입', description: '사용자 회원가입 페이지' },
    { value: 'mypage', label: '마이페이지', description: '사용자 프로필 페이지' }
  ];

  // 광고 위치 정의
  const positions = [
    { 
      value: 'header', 
      label: '상단 배너', 
      description: '페이지 최상단 헤더 아래',
      recommendedSizes: ['1200x90', '728x90', '970x250']
    },
    { 
      value: 'sidebar_left', 
      label: '좌측 사이드바', 
      description: '왼쪽 사이드바 영역',
      recommendedSizes: ['160x600', '300x250', '300x600']
    },
    { 
      value: 'sidebar_right', 
      label: '우측 사이드바', 
      description: '오른쪽 사이드바 영역',
      recommendedSizes: ['160x600', '300x250', '300x600']
    },
    { 
      value: 'footer', 
      label: '하단 배너', 
      description: '페이지 하단 푸터 위',
      recommendedSizes: ['1200x200', '728x90', '970x90']
    },
    { 
      value: 'content_middle', 
      label: '콘텐츠 중간', 
      description: '본문 내용 중간 삽입',
      recommendedSizes: ['728x90', '300x250', 'responsive']
    },
    { 
      value: 'floating', 
      label: '플로팅 광고', 
      description: '화면에 떠있는 광고',
      recommendedSizes: ['300x250', '320x50', '250x250']
    }
  ];

  const handleAdAction = (action: string, adId?: number) => {
    const targetAd = adUnits.find(ad => ad.id === adId);
    
    switch(action) {
      case '설정':
      case '계약수정':
        if (targetAd) {
          setEditingAd(targetAd);
          setNewAdForm({
            name: targetAd.name,
            page: targetAd.page,
            position: targetAd.position,
            size: targetAd.size,
            adType: targetAd.adType,
            adUnitId: targetAd.adUnitId || '',
            advertiser: targetAd.advertiser || '',
            contractType: targetAd.contractType || 'monthly',
            contractAmount: targetAd.contractAmount || 0,
            startDate: targetAd.startDate || '',
            endDate: targetAd.endDate || ''
          });
          setShowEditModal(true);
        }
        break;
      case '통계':
        if (targetAd) {
          setStatsAd(targetAd);
          setShowStatsModal(true);
        }
        break;
      case '삭제':
        if (targetAd && window.confirm(`"${targetAd.name}" 광고 단위를 삭제하시겠습니까?`)) {
          setAdUnits(adUnits.filter(ad => ad.id !== adId));
          alert('광고 단위가 삭제되었습니다.');
        }
        break;
      case '활성화':
      case '일시정지':
        if (targetAd) {
          const newStatus = action === '활성화' ? 'active' : 'paused';
          setAdUnits(adUnits.map(ad => 
            ad.id === adId ? { ...ad, status: newStatus as 'active' | 'paused' | 'pending' } : ad
          ));
          alert(`광고 단위가 ${action}되었습니다.`);
        }
        break;
      default:
        console.log(`광고 ${action}:`, adId);
    }
  };

  const validateForm = () => {
    // 기본 필수 필드 검증
    if (!newAdForm.name.trim()) {
      alert('광고 단위명을 입력하세요.');
      return false;
    }
    if (!newAdForm.page) {
      alert('페이지를 선택하세요.');
      return false;
    }
    if (!newAdForm.position) {
      alert('광고 위치를 선택하세요.');
      return false;
    }
    if (!newAdForm.size.trim()) {
      alert('광고 크기를 입력하세요.');
      return false;
    }

    // 구글 광고 전용 필드 검증
    if (newAdForm.adType === 'google') {
      if (!newAdForm.adUnitId.trim()) {
        alert('애드센스 광고 단위 ID를 입력하세요.');
        return false;
      }
    }

    // 직접 광고 전용 필드 검증
    if (newAdForm.adType === 'direct') {
      if (!newAdForm.advertiser.trim()) {
        alert('광고주를 입력하세요.');
        return false;
      }
      if (!newAdForm.contractAmount || newAdForm.contractAmount <= 0) {
        alert('계약 금액을 입력하세요.');
        return false;
      }
      if (!newAdForm.startDate) {
        alert('시작일을 선택하세요.');
        return false;
      }
      if (!newAdForm.endDate) {
        alert('종료일을 선택하세요.');
        return false;
      }
      if (new Date(newAdForm.startDate) >= new Date(newAdForm.endDate)) {
        alert('종료일은 시작일보다 나중이어야 합니다.');
        return false;
      }
    }

    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!validateForm()) {
      return;
    }

    if (editingAd) {
      // 광고 단위 수정
      const updatedAdUnits = adUnits.map(unit => 
        unit.id === editingAd.id 
          ? {
              ...unit,
              name: newAdForm.name,
              page: newAdForm.page,
              position: newAdForm.position as 'header' | 'sidebar_left' | 'sidebar_right' | 'footer' | 'content_middle' | 'floating',
              size: newAdForm.size,
              adUnitId: newAdForm.adUnitId,
              advertiser: newAdForm.advertiser,
              contractType: newAdForm.contractType as 'monthly' | 'weekly' | 'daily' | 'fixed',
              contractAmount: newAdForm.contractAmount,
              startDate: newAdForm.startDate,
              endDate: newAdForm.endDate
            }
          : unit
      );
      
      setAdUnits(updatedAdUnits);
      console.log('광고 단위 수정:', { id: editingAd.id, ...newAdForm });
      alert('광고 단위가 수정되었습니다.');
      setShowEditModal(false);
      setEditingAd(null);
    } else {
      // 새 광고 단위 생성
      const newId = Math.max(...adUnits.map(unit => unit.id)) + 1;
      const newAdUnit: AdUnit = {
        id: newId,
        name: newAdForm.name,
        page: newAdForm.page,
        position: newAdForm.position as 'header' | 'sidebar_left' | 'sidebar_right' | 'footer' | 'content_middle' | 'floating',
        size: newAdForm.size,
        adType: newAdForm.adType as 'google' | 'direct',
        status: 'pending' as 'active' | 'paused' | 'pending',
        impressions: 0,
        clicks: 0,
        revenue: 0,
        ctr: 0,
        cpm: 0,
        // 구글 광고용 필드
        ...(newAdForm.adType === 'google' && {
          adUnitId: newAdForm.adUnitId
        }),
        // 직접 광고용 필드
        ...(newAdForm.adType === 'direct' && {
          advertiser: newAdForm.advertiser,
          contractType: newAdForm.contractType as 'monthly' | 'weekly' | 'daily' | 'fixed',
          contractAmount: newAdForm.contractAmount,
          startDate: newAdForm.startDate,
          endDate: newAdForm.endDate
        })
      };
      
      setAdUnits([...adUnits, newAdUnit]);
      console.log('새 광고 단위 생성:', newAdUnit);
      alert('새 광고 단위가 생성되었습니다.');
      setShowGoogleAdModal(false);
      setShowDirectAdModal(false);
    }
    
    // 폼 초기화
    setNewAdForm({
      name: '',
      page: '',
      position: '',
      size: '',
      adType: 'google',
      adUnitId: '',
      advertiser: '',
      contractType: 'monthly',
      contractAmount: 0,
      startDate: '',
      endDate: ''
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewAdForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : 0) : value
    }));
  };

  const validateDirectAdForm = (formData: typeof newAdForm) => {
    // 기본 필수 필드 검증
    if (!formData.name.trim()) {
      alert('광고 단위명을 입력하세요.');
      return false;
    }
    if (!formData.page) {
      alert('페이지를 선택하세요.');
      return false;
    }
    if (!formData.position) {
      alert('광고 위치를 선택하세요.');
      return false;
    }
    if (!formData.size.trim()) {
      alert('광고 크기를 입력하세요.');
      return false;
    }
    if (!formData.advertiser.trim()) {
      alert('광고주를 입력하세요.');
      return false;
    }
    if (!formData.contractAmount || formData.contractAmount <= 0) {
      alert('계약 금액을 입력하세요.');
      return false;
    }
    if (!formData.startDate) {
      alert('시작일을 선택하세요.');
      return false;
    }
    if (!formData.endDate) {
      alert('종료일을 선택하세요.');
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      alert('종료일은 시작일보다 나중이어야 합니다.');
      return false;
    }
    return true;
  };

  const handleDirectAdSubmit = (formData: typeof newAdForm) => {
    // 새 광고 단위 생성
    const newId = Math.max(...adUnits.map(unit => unit.id)) + 1;
    const newAdUnit: AdUnit = {
      id: newId,
      name: formData.name,
      page: formData.page,
      position: formData.position as 'header' | 'sidebar_left' | 'sidebar_right' | 'footer' | 'content_middle' | 'floating',
      size: formData.size,
      adType: 'direct',
      status: 'pending' as 'active' | 'paused' | 'pending',
      impressions: 0,
      clicks: 0,
      revenue: 0,
      ctr: 0,
      cpm: 0,
      advertiser: formData.advertiser,
      contractType: formData.contractType as 'monthly' | 'weekly' | 'daily' | 'fixed',
      contractAmount: formData.contractAmount,
      startDate: formData.startDate,
      endDate: formData.endDate
    };
    
    setAdUnits([...adUnits, newAdUnit]);
    console.log('새 직접 광고 계약 생성:', newAdUnit);
    alert('새 직접 광고 계약이 생성되었습니다.');
    setShowDirectAdModal(false);
    
    // 폼 초기화
    setNewAdForm({
      name: '',
      page: '',
      position: '',
      size: '',
      adType: 'google',
      adUnitId: '',
      advertiser: '',
      contractType: 'monthly',
      contractAmount: 0,
      startDate: '',
      endDate: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { text: '활성', class: 'admin-status-green' },
      paused: { text: '일시정지', class: 'admin-status-orange' },
      pending: { text: '승인대기', class: 'admin-status-red' }
    };
    const { text, class: className } = config[status as keyof typeof config] || config.active;
    
    return (
      <span className={`admin-status-badge ${className}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>
        {text}
      </span>
    );
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'header': return 'fas fa-rectangle-ad';
      case 'sidebar_left':
      case 'sidebar_right': return 'fas fa-bars';
      case 'footer': return 'fas fa-rectangle-ad';
      case 'content_middle': return 'fas fa-newspaper';
      case 'floating': return 'fas fa-window-restore';
      default: return 'fas fa-ad';
    }
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-flex-between admin-mb-6">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800">광고 관리</h1>
        <div className="admin-flex" style={{ gap: '12px' }}>
          <button className="admin-btn admin-btn-secondary">
            <i className="fas fa-chart-line mr-2"></i>
            수익 리포트
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="admin-card admin-mb-6">
        <nav style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {[
              { key: 'overview', label: '수익 개요', icon: 'fas fa-chart-pie' },
              { key: 'googelunits', label: '구글 광고', icon: 'fas fa-th-large' },
              { key: 'directunits', label: '직접 광고', icon: 'fas fa-th-large' },
              { key: 'analytics', label: '상세 분석', icon: 'fas fa-analytics' },
              { key: 'settings', label: '애드센스 설정', icon: 'fas fa-cog' }
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

      {/* 수익 개요 탭 */}
      {activeTab === 'overview' && (
        <div>
          {/* 수익 통계 카드 */}
          <div className="admin-grid admin-grid-cols-4 admin-mb-6">
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">₩{totalRevenue.toLocaleString()}</div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>총 수익 (오늘)</div>
              <div className="admin-text-xs admin-mt-1" style={{ color: 'rgba(255,255,255,0.7)' } as React.CSSProperties}>
                <i className="fas fa-arrow-up mr-1"></i>+12% 어제 대비
              </div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #4285f4, #1a73e8)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">₩{googleRevenue.toLocaleString()}</div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>구글 광고 수익</div>
              <div className="admin-text-xs admin-mt-1" style={{ color: 'rgba(255,255,255,0.7)' } as React.CSSProperties}>
                <i className="fab fa-google mr-1"></i>{googleAds.length}개 단위
              </div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">₩{directRevenue.toLocaleString()}</div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>직접 광고 수익</div>
              <div className="admin-text-xs admin-mt-1" style={{ color: 'rgba(255,255,255,0.7)' } as React.CSSProperties}>
                <i className="fas fa-handshake mr-1"></i>{directAds.length}개 계약
              </div>
            </div>
            <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
              <div className="admin-text-2xl admin-font-bold">{averageCTR.toFixed(2)}%</div>
              <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>평균 CTR</div>
              <div className="admin-text-xs admin-mt-1" style={{ color: 'rgba(255,255,255,0.7)' } as React.CSSProperties}>
                <i className="fas fa-arrow-up mr-1"></i>+3% 어제 대비
              </div>
            </div>
          </div>

          {/* 광고 타입별 비교 */}
          <div className="admin-grid admin-grid-cols-2 admin-mb-6">
            <div className="admin-card">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">구글 광고 현황</h3>
              <div className="admin-grid admin-grid-cols-2" style={{ gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f0f8ff', borderRadius: '8px', border: '1px solid #4285f4' }}>
                  <div className="admin-text-2xl admin-font-bold" style={{ color: '#4285f4' }}>
                    {googleAds.length}
                  </div>
                  <div className="admin-text-sm admin-text-gray-600">활성 광고 단위</div>
                </div>
                <div style={{ padding: '16px', background: '#f0f8ff', borderRadius: '8px', border: '1px solid #4285f4' }}>
                  <div className="admin-text-2xl admin-font-bold" style={{ color: '#4285f4' }}>
                    ₩{(googleRevenue / googleAds.length || 0).toFixed(0)}
                  </div>
                  <div className="admin-text-sm admin-text-gray-600">평균 단위당 수익</div>
                </div>
              </div>
            </div>
            <div className="admin-card">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">직접 광고 현황</h3>
              <div className="admin-grid admin-grid-cols-2" style={{ gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f0fff4', borderRadius: '8px', border: '1px solid #10b981' }}>
                  <div className="admin-text-2xl admin-font-bold" style={{ color: '#10b981' }}>
                    {directAds.length}
                  </div>
                  <div className="admin-text-sm admin-text-gray-600">활성 계약</div>
                </div>
                <div style={{ padding: '16px', background: '#f0fff4', borderRadius: '8px', border: '1px solid #10b981' }}>
                  <div className="admin-text-2xl admin-font-bold" style={{ color: '#10b981' }}>
                    ₩{(directRevenue / directAds.length || 0).toFixed(0)}
                  </div>
                  <div className="admin-text-sm admin-text-gray-600">평균 계약당 수익</div>
                </div>
              </div>
            </div>
          </div>

          {/* 수익 차트 */}
          <div className="admin-grid admin-grid-cols-2 admin-mb-6">
            <div className="admin-card">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">일별 수익 추이</h3>
              <div style={{ height: '300px', background: '#f9fafb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="admin-text-gray-500">수익 차트 영역 (Chart.js 구현 예정)</p>
              </div>
            </div>
            <div className="admin-card">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">광고 유형별 수익 분포</h3>
              <div style={{ height: '300px', background: '#f9fafb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="admin-text-gray-500">도넛 차트 영역 (Chart.js 구현 예정)</p>
              </div>
            </div>
          </div>

          {/* 최고 성과 광고 단위 */}
          <div className="admin-card">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">최고 성과 광고 단위</h3>
            <div className="admin-grid admin-grid-cols-3" style={{ gap: '16px' }}>
              {adUnits
                .filter(unit => unit.status === 'active')
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 3)
                .map(unit => (
                  <div key={unit.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <div className="admin-flex-between admin-mb-2">
                      <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                        <i className={getPositionIcon(unit.position)} style={{ color: '#6b7280' }}></i>
                        <span className="admin-text-sm admin-font-medium">{unit.name}</span>
                      </div>
                      <span className="admin-text-lg admin-font-bold" style={{ color: '#10b981' }}>
                        ₩{unit.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-text-xs admin-text-gray-600">
                      <div>노출: {unit.impressions.toLocaleString()} | 클릭: {unit.clicks.toLocaleString()}</div>
                      <div>CTR: {unit.ctr}% | CPM: ₩{unit.cpm}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 구글 광고 단위 탭 */}
      {activeTab === 'googelunits' && (
        <div>
          <div className="admin-card">
            <div className="admin-flex-between admin-mb-4">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">구글 애드센스 광고 단위</h3>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={() => setShowGoogleAdModal(true)}
              >
                <i className="fas fa-plus mr-2"></i>
                새 구글 광고 단위
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table google-ads-table">
                <thead>
                  <tr>
                    <th>광고 단위</th>
                    <th>페이지/위치</th>
                    <th>크기</th>
                    <th>상태</th>
                    <th>애드센스 ID</th>
                    <th>노출수</th>
                    <th>클릭수</th>
                    <th>CTR</th>
                    <th>수익</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {adUnits.filter(unit => unit.adType === 'google').map(unit => (
                    <tr key={unit.id}>
                      <td>
                        <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                          <i className="fab fa-google" style={{ color: '#4285f4' }}></i>
                          <div>
                            <div className="admin-text-sm admin-font-medium admin-text-gray-900">{unit.name}</div>
                            <div className="admin-text-xs admin-text-gray-500">ID: {unit.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-text-sm">
                          <div className="admin-text-gray-900">{unit.page}</div>
                          <div className="admin-text-gray-500">{unit.position}</div>
                        </div>
                      </td>
                      <td className="admin-text-sm admin-text-gray-600">{unit.size}</td>
                      <td>{getStatusBadge(unit.status)}</td>
                      <td className="admin-text-xs admin-text-gray-500">{unit.adUnitId}</td>
                      <td className="admin-text-sm admin-text-gray-900">{unit.impressions.toLocaleString()}</td>
                      <td className="admin-text-sm admin-text-gray-900">{unit.clicks.toLocaleString()}</td>
                      <td>
                        <span style={{ 
                          color: unit.ctr > 1.5 ? '#10b981' : unit.ctr > 1.0 ? '#f59e0b' : '#ef4444',
                          fontWeight: '500' 
                        }}>
                          {unit.ctr.toFixed(2)}%
                        </span>
                      </td>
                      <td className="admin-text-sm admin-font-medium" style={{ color: '#10b981' }}>
                        ₩{unit.revenue.toLocaleString()}
                      </td>
                      <td>
                        <div className="admin-flex" style={{ gap: '4px' }}>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleAdAction('설정', unit.id)}
                            title="설정"
                          >
                            <i className="fas fa-cog"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleAdAction('통계', unit.id)}
                            title="상세 통계"
                          >
                            <i className="fas fa-chart-bar"></i>
                          </button>
                          <button 
                            className={`admin-btn admin-text-xs ${unit.status === 'active' ? 'admin-btn-warning' : 'admin-btn-success'}`}
                            onClick={() => handleAdAction(unit.status === 'active' ? '일시정지' : '활성화', unit.id)}
                            title={unit.status === 'active' ? '일시정지' : '활성화'}
                          >
                            <i className={`fas ${unit.status === 'active' ? 'fa-pause' : 'fa-play'}`}></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-danger admin-text-xs"
                            onClick={() => handleAdAction('삭제', unit.id)}
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
          </div>
        </div>
      )}

      {/* 직접 광고 단위 탭 */}
      {activeTab === 'directunits' && (
        <div>
          <div className="admin-card">
            <div className="admin-flex-between admin-mb-4">
              <h3 className="admin-text-lg admin-font-medium admin-text-gray-800">직접 광고 단위</h3>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={() => setShowDirectAdModal(true)}
              >
                <i className="fas fa-plus mr-2"></i>
                새 직접 광고 계약
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table direct-ads-table">
                <thead>
                  <tr>
                    <th>광고 단위</th>
                    <th>페이지/위치</th>
                    <th>크기</th>
                    <th>상태</th>
                    <th>광고주</th>
                    <th>계약 유형</th>
                    <th>계약 금액</th>
                    <th>기간</th>
                    <th>CTR</th>
                    <th>수익</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {adUnits.filter(unit => unit.adType === 'direct').map(unit => (
                    <tr key={unit.id}>
                      <td>
                        <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-handshake" style={{ color: '#10b981' }}></i>
                          <div>
                            <div className="admin-text-sm admin-font-medium admin-text-gray-900">{unit.name}</div>
                            <div className="admin-text-xs admin-text-gray-500">ID: {unit.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-text-sm">
                          <div className="admin-text-gray-900">{unit.page}</div>
                          <div className="admin-text-gray-500">{unit.position}</div>
                        </div>
                      </td>
                      <td className="admin-text-sm admin-text-gray-600">{unit.size}</td>
                      <td>{getStatusBadge(unit.status)}</td>
                      <td className="admin-text-sm admin-text-gray-900">{unit.advertiser}</td>
                      <td>
                        <span className="admin-status-badge admin-status-blue">
                          {unit.contractType === 'monthly' ? '월간' : 
                           unit.contractType === 'weekly' ? '주간' :
                           unit.contractType === 'daily' ? '일간' : '고정'}
                        </span>
                      </td>
                      <td className="admin-text-sm admin-font-medium" style={{ color: '#3b82f6' }}>
                        ₩{unit.contractAmount?.toLocaleString()}
                      </td>
                      <td className="admin-text-xs admin-text-gray-600">
                        {unit.startDate} ~ {unit.endDate}
                      </td>
                      <td>
                        <span style={{ 
                          color: unit.ctr > 1.5 ? '#10b981' : unit.ctr > 1.0 ? '#f59e0b' : '#ef4444',
                          fontWeight: '500' 
                        }}>
                          {unit.ctr.toFixed(2)}%
                        </span>
                      </td>
                      <td className="admin-text-sm admin-font-medium" style={{ color: '#10b981' }}>
                        ₩{unit.revenue.toLocaleString()}
                      </td>
                      <td>
                        <div className="admin-flex" style={{ gap: '4px' }}>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleAdAction('계약수정', unit.id)}
                            title="계약 수정"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-secondary admin-text-xs"
                            onClick={() => handleAdAction('통계', unit.id)}
                            title="상세 통계"
                          >
                            <i className="fas fa-chart-bar"></i>
                          </button>
                          <button 
                            className={`admin-btn admin-text-xs ${unit.status === 'active' ? 'admin-btn-warning' : 'admin-btn-success'}`}
                            onClick={() => handleAdAction(unit.status === 'active' ? '일시정지' : '활성화', unit.id)}
                            title={unit.status === 'active' ? '일시정지' : '활성화'}
                          >
                            <i className={`fas ${unit.status === 'active' ? 'fa-pause' : 'fa-play'}`}></i>
                          </button>
                          <button 
                            className="admin-btn admin-btn-danger admin-text-xs"
                            onClick={() => handleAdAction('삭제', unit.id)}
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
          </div>
        </div>
      )}

      {/* 애드센스 설정 탭 */}
      {activeTab === 'settings' && (
        <div>
          <div className="admin-card">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">구글 애드센스 연동</h3>
            <div className="admin-grid admin-grid-cols-2" style={{ gap: '24px' }}>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">애드센스 계정 ID</label>
                  <input 
                    type="text" 
                    className="admin-input"
                    placeholder="pub-0000000000000000"
                    defaultValue="pub-1234567890123456"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">사이트 URL</label>
                  <input 
                    type="text" 
                    className="admin-input"
                    placeholder="https://factlab.com"
                    defaultValue="https://factlab.com"
                  />
                </div>
              </div>
              <div>
                <div className="admin-form-group">
                  <label className="admin-label">광고 밀도</label>
                  <select className="admin-select">
                    <option>낮음 (1-2개 광고)</option>
                    <option>보통 (3-4개 광고)</option>
                    <option>높음 (5-6개 광고)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="admin-flex" style={{ gap: '8px', marginTop: '16px' }}>
              <button className="admin-btn admin-btn-primary">
                <i className="fas fa-save mr-2"></i>
                설정 저장
              </button>
              <button className="admin-btn admin-btn-secondary">
                <i className="fas fa-sync mr-2"></i>
                애드센스 동기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 분석 탭 */}
      {activeTab === 'analytics' && (
        <div>
          <div className="admin-card">
            <h3 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">일별 상세 수익 데이터</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>수익</th>
                    <th>노출수</th>
                    <th>클릭수</th>
                    <th>CTR</th>
                    <th>CPC</th>
                    <th>CPM</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((data, index) => {
                    const ctr = (data.clicks / data.impressions * 100);
                    const cpc = (data.revenue / data.clicks);
                    const cpm = (data.revenue / data.impressions * 1000);
                    
                    return (
                      <tr key={index}>
                        <td className="admin-text-sm admin-text-gray-900">{data.date}</td>
                        <td className="admin-text-sm admin-font-medium" style={{ color: '#10b981' }}>
                          ₩{data.revenue.toLocaleString()}
                        </td>
                        <td className="admin-text-sm admin-text-gray-900">{data.impressions.toLocaleString()}</td>
                        <td className="admin-text-sm admin-text-gray-900">{data.clicks.toLocaleString()}</td>
                        <td className="admin-text-sm admin-text-gray-900">{ctr.toFixed(2)}%</td>
                        <td className="admin-text-sm admin-text-gray-900">₩{cpc.toFixed(0)}</td>
                        <td className="admin-text-sm admin-text-gray-900">₩{cpm.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 구글 광고 단위 생성 모달 */}
      {showGoogleAdModal && (
        <div className="admin-modal-overlay" onClick={() => setShowGoogleAdModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                <i className="fab fa-google mr-2" style={{ color: '#4285f4' }}></i>
                새 구글 광고 단위 생성
              </h3>
              <button 
                className="admin-modal-close" 
                onClick={() => setShowGoogleAdModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              // 구글 광고 타입으로 명시적 설정
              setNewAdForm(prev => ({ ...prev, adType: 'google' }));
              handleFormSubmit(e);
            }} className="admin-modal-body">
              <div className="admin-grid admin-grid-cols-2" style={{ gap: '16px' }}>
                {/* 광고 단위명 */}
                <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="admin-label">광고 단위명 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="name"
                    className="admin-input"
                    placeholder="예: 메인페이지 상단 배너"
                    value={newAdForm.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                {/* 페이지 선택 */}
                <div className="admin-form-group">
                  <label className="admin-label">페이지 선택 <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="page"
                    className="admin-select"
                    value={newAdForm.page}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">페이지를 선택하세요</option>
                    {pages.map(page => (
                      <option key={page.value} value={page.value}>
                        {page.label} ({page.description})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 광고 위치 선택 */}
                <div className="admin-form-group">
                  <label className="admin-label">광고 위치 <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="position"
                    className="admin-select"
                    value={newAdForm.position}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">위치를 선택하세요</option>
                    {positions.map(position => (
                      <option key={position.value} value={position.value}>
                        {position.label} - {position.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 광고 크기 */}
                <div className="admin-form-group">
                  <label className="admin-label">광고 크기 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="size"
                    className="admin-input"
                    placeholder="예: 1200x90"
                    value={newAdForm.size}
                    onChange={handleFormChange}
                    required
                  />
                  {newAdForm.position && (
                    <div className="admin-text-xs admin-text-gray-500 admin-mt-1">
                      권장: {positions.find(p => p.value === newAdForm.position)?.recommendedSizes.join(', ')}
                    </div>
                  )}
                </div>

                {/* 애드센스 광고 단위 ID */}
                <div className="admin-form-group">
                  <label className="admin-label">애드센스 광고 단위 ID <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="adUnitId"
                    className="admin-input"
                    placeholder="ca-pub-1234567890123456/1234567890"
                    value={newAdForm.adUnitId}
                    onChange={handleFormChange}
                    required
                  />
                  <div className="admin-text-xs admin-text-gray-500 admin-mt-1">
                    구글 애드센스 대시보드에서 생성한 광고 단위 ID를 입력하세요
                  </div>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowGoogleAdModal(false)}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="admin-btn admin-btn-primary"
                >
                  <i className="fas fa-plus mr-2"></i>
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 직접 광고 계약 생성 모달 */}
      {showDirectAdModal && (
        <div className="admin-modal-overlay" onClick={() => setShowDirectAdModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                <i className="fas fa-handshake mr-2" style={{ color: '#10b981' }}></i>
                새 직접 광고 계약 생성
              </h3>
              <button 
                className="admin-modal-close" 
                onClick={() => setShowDirectAdModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              // 직접 광고 타입 설정
              const updatedForm = { ...newAdForm, adType: 'direct' as 'google' | 'direct' };
              setNewAdForm(updatedForm);
              // 약간의 지연 후 검증 및 제출
              setTimeout(() => {
                const formEvent = new Event('submit') as any;
                formEvent.preventDefault = () => {};
                if (validateDirectAdForm(updatedForm)) {
                  handleDirectAdSubmit(updatedForm);
                }
              }, 10);
            }} className="admin-modal-body">
              <div className="admin-grid admin-grid-cols-2" style={{ gap: '16px' }}>
                {/* 광고 단위명 */}
                <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="admin-label">광고 단위명 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="name"
                    className="admin-input"
                    placeholder="예: 게시판 좌측 사이드바"
                    value={newAdForm.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                {/* 페이지 선택 */}
                <div className="admin-form-group">
                  <label className="admin-label">페이지 선택 <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="page"
                    className="admin-select"
                    value={newAdForm.page}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">페이지를 선택하세요</option>
                    {pages.map(page => (
                      <option key={page.value} value={page.value}>
                        {page.label} ({page.description})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 광고 위치 선택 */}
                <div className="admin-form-group">
                  <label className="admin-label">광고 위치 <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="position"
                    className="admin-select"
                    value={newAdForm.position}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">위치를 선택하세요</option>
                    {positions.map(position => (
                      <option key={position.value} value={position.value}>
                        {position.label} - {position.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 광고 크기 */}
                <div className="admin-form-group">
                  <label className="admin-label">광고 크기 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="size"
                    className="admin-input"
                    placeholder="예: 160x600"
                    value={newAdForm.size}
                    onChange={handleFormChange}
                    required
                  />
                  {newAdForm.position && (
                    <div className="admin-text-xs admin-text-gray-500 admin-mt-1">
                      권장: {positions.find(p => p.value === newAdForm.position)?.recommendedSizes.join(', ')}
                    </div>
                  )}
                </div>

                {/* 광고주 */}
                <div className="admin-form-group">
                  <label className="admin-label">광고주 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="advertiser"
                    className="admin-input"
                    placeholder="예: 부동산나라"
                    value={newAdForm.advertiser}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                {/* 계약 유형 */}
                <div className="admin-form-group">
                  <label className="admin-label">계약 유형 <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="contractType"
                    className="admin-select"
                    value={newAdForm.contractType}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="monthly">월간 계약</option>
                    <option value="weekly">주간 계약</option>
                    <option value="daily">일간 계약</option>
                    <option value="fixed">고정 기간</option>
                  </select>
                </div>

                {/* 계약 금액 */}
                <div className="admin-form-group">
                  <label className="admin-label">계약 금액 (원) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    name="contractAmount"
                    className="admin-input"
                    placeholder="예: 300000"
                    value={newAdForm.contractAmount}
                    onChange={handleFormChange}
                    required
                    min="0"
                  />
                </div>

                {/* 시작일 */}
                <div className="admin-form-group">
                  <label className="admin-label">시작일 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date"
                    name="startDate"
                    className="admin-input"
                    value={newAdForm.startDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                {/* 종료일 */}
                <div className="admin-form-group">
                  <label className="admin-label">종료일 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date"
                    name="endDate"
                    className="admin-input"
                    value={newAdForm.endDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowDirectAdModal(false)}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="admin-btn admin-btn-primary"
                >
                  <i className="fas fa-plus mr-2"></i>
                  계약 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 광고 단위 수정 모달 */}
      {showEditModal && editingAd && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                <i className={editingAd.adType === 'google' ? 'fab fa-google mr-2' : 'fas fa-handshake mr-2'} 
                   style={{ color: editingAd.adType === 'google' ? '#4285f4' : '#10b981' }}></i>
                {editingAd.adType === 'google' ? '구글 광고 단위 수정' : '직접 광고 계약 수정'}
              </h3>
              <button 
                className="admin-modal-close" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAd(null);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="admin-modal-body">
              <div className="admin-grid admin-grid-cols-2" style={{ gap: '16px' }}>
                {/* 광고 단위명 */}
                <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="admin-label">광고 단위명 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="name"
                    className="admin-input"
                    placeholder="예: 메인페이지 상단 배너"
                    value={newAdForm.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                {/* 페이지 선택 */}
                <div className="admin-form-group">
                  <label className="admin-label">페이지 선택 <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="page"
                    className="admin-select"
                    value={newAdForm.page}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">페이지를 선택하세요</option>
                    {pages.map(page => (
                      <option key={page.value} value={page.value}>
                        {page.label} ({page.description})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 광고 위치 선택 */}
                <div className="admin-form-group">
                  <label className="admin-label">광고 위치 <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="position"
                    className="admin-select"
                    value={newAdForm.position}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">위치를 선택하세요</option>
                    {positions.map(position => (
                      <option key={position.value} value={position.value}>
                        {position.label} - {position.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 광고 크기 */}
                <div className="admin-form-group">
                  <label className="admin-label">광고 크기 <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="size"
                    className="admin-input"
                    placeholder="예: 1200x90"
                    value={newAdForm.size}
                    onChange={handleFormChange}
                    required
                  />
                  {newAdForm.position && (
                    <div className="admin-text-xs admin-text-gray-500 admin-mt-1">
                      권장: {positions.find(p => p.value === newAdForm.position)?.recommendedSizes.join(', ')}
                    </div>
                  )}
                </div>

                {/* 구글 광고용 필드 */}
                {editingAd.adType === 'google' && (
                  <div className="admin-form-group">
                    <label className="admin-label">애드센스 광고 단위 ID <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      name="adUnitId"
                      className="admin-input"
                      placeholder="ca-pub-1234567890123456/1234567890"
                      value={newAdForm.adUnitId}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                )}

                {/* 직접 광고용 필드 */}
                {editingAd.adType === 'direct' && (
                  <>
                    <div className="admin-form-group">
                      <label className="admin-label">광고주 <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        name="advertiser"
                        className="admin-input"
                        placeholder="예: 부동산나라"
                        value={newAdForm.advertiser}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-label">계약 유형 <span style={{ color: '#ef4444' }}>*</span></label>
                      <select
                        name="contractType"
                        className="admin-select"
                        value={newAdForm.contractType}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="monthly">월간 계약</option>
                        <option value="weekly">주간 계약</option>
                        <option value="daily">일간 계약</option>
                        <option value="fixed">고정 기간</option>
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-label">계약 금액 (원) <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="number"
                        name="contractAmount"
                        className="admin-input"
                        placeholder="예: 300000"
                        value={newAdForm.contractAmount}
                        onChange={handleFormChange}
                        required
                        min="0"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-label">시작일 <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="date"
                        name="startDate"
                        className="admin-input"
                        value={newAdForm.startDate}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-label">종료일 <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="date"
                        name="endDate"
                        className="admin-input"
                        value={newAdForm.endDate}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              {/* 모달 푸터 */}
              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-btn admin-btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAd(null);
                  }}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="admin-btn admin-btn-primary"
                >
                  <i className="fas fa-save mr-2"></i>
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상세 통계 모달 */}
      {showStatsModal && statsAd && (
        <div className="admin-modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                <i className="fas fa-chart-line mr-2" style={{ color: '#4f46e5' }}></i>
                {statsAd.name} - 상세 통계
              </h3>
              <button 
                className="admin-modal-close" 
                onClick={() => {
                  setShowStatsModal(false);
                  setStatsAd(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              {/* 기본 정보 */}
              <div className="admin-card" style={{ marginBottom: '24px', background: '#f8fafc' }}>
                <div className="admin-grid admin-grid-cols-4" style={{ gap: '16px', marginBottom: '16px' }}>
                  <div className="admin-text-center">
                    <div className="admin-text-xs admin-text-gray-500">광고 유형</div>
                    <div className="admin-text-sm admin-font-medium">
                      <i className={statsAd.adType === 'google' ? 'fab fa-google mr-1' : 'fas fa-handshake mr-1'}
                         style={{ color: statsAd.adType === 'google' ? '#4285f4' : '#10b981' }}></i>
                      {statsAd.adType === 'google' ? '구글 광고' : '직접 광고'}
                    </div>
                  </div>
                  <div className="admin-text-center">
                    <div className="admin-text-xs admin-text-gray-500">페이지</div>
                    <div className="admin-text-sm admin-font-medium">{statsAd.page}</div>
                  </div>
                  <div className="admin-text-center">
                    <div className="admin-text-xs admin-text-gray-500">위치</div>
                    <div className="admin-text-sm admin-font-medium">{statsAd.position}</div>
                  </div>
                  <div className="admin-text-center">
                    <div className="admin-text-xs admin-text-gray-500">크기</div>
                    <div className="admin-text-sm admin-font-medium">{statsAd.size}</div>
                  </div>
                </div>
              </div>

              {/* 성과 지표 */}
              <div className="admin-grid admin-grid-cols-4" style={{ gap: '16px', marginBottom: '24px' }}>
                <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: 'white' }}>
                  <div className="admin-text-2xl admin-font-bold">₩{statsAd.revenue.toLocaleString()}</div>
                  <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>수익</div>
                  <div className="admin-text-xs admin-mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <i className="fas fa-arrow-up mr-1"></i>+8% 전일 대비
                  </div>
                </div>
                <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white' }}>
                  <div className="admin-text-2xl admin-font-bold">{statsAd.impressions.toLocaleString()}</div>
                  <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>노출수</div>
                  <div className="admin-text-xs admin-mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <i className="fas fa-arrow-up mr-1"></i>+12% 전일 대비
                  </div>
                </div>
                <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white' }}>
                  <div className="admin-text-2xl admin-font-bold">{statsAd.clicks.toLocaleString()}</div>
                  <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>클릭수</div>
                  <div className="admin-text-xs admin-mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <i className="fas fa-arrow-up mr-1"></i>+5% 전일 대비
                  </div>
                </div>
                <div className="admin-card admin-text-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
                  <div className="admin-text-2xl admin-font-bold">{statsAd.ctr.toFixed(2)}%</div>
                  <div className="admin-text-sm admin-mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>CTR</div>
                  <div className="admin-text-xs admin-mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <i className="fas fa-arrow-down mr-1"></i>-2% 전일 대비
                  </div>
                </div>
              </div>

              {/* 차트 영역 */}
              <div className="admin-grid admin-grid-cols-2" style={{ gap: '24px', marginBottom: '24px' }}>
                <div className="admin-card">
                  <h4 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">일별 성과 추이 (최근 7일)</h4>
                  <div style={{ height: '250px', background: '#f9fafb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="admin-text-center">
                      <i className="fas fa-chart-line" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '12px' }}></i>
                      <p className="admin-text-gray-500">일별 수익/노출/클릭 차트</p>
                      <p className="admin-text-xs admin-text-gray-400">(Chart.js 구현 예정)</p>
                    </div>
                  </div>
                </div>
                <div className="admin-card">
                  <h4 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">시간대별 성과 분포</h4>
                  <div style={{ height: '250px', background: '#f9fafb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="admin-text-center">
                      <i className="fas fa-clock" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '12px' }}></i>
                      <p className="admin-text-gray-500">시간대별 CTR 히트맵</p>
                      <p className="admin-text-xs admin-text-gray-400">(Chart.js 구현 예정)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상세 데이터 테이블 */}
              <div className="admin-card">
                <h4 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">일별 상세 데이터</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>날짜</th>
                        <th>노출수</th>
                        <th>클릭수</th>
                        <th>CTR</th>
                        <th>CPC</th>
                        <th>수익</th>
                        <th>성과</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 7 }, (_, index) => {
                        const date = new Date();
                        date.setDate(date.getDate() - index);
                        const impressions = Math.floor(Math.random() * 5000) + 2000;
                        const clicks = Math.floor(impressions * (Math.random() * 0.03 + 0.01));
                        const ctr = (clicks / impressions * 100);
                        const cpc = Math.random() * 50 + 20;
                        const revenue = clicks * cpc;
                        
                        return (
                          <tr key={index}>
                            <td className="admin-text-sm">{date.toLocaleDateString('ko-KR')}</td>
                            <td className="admin-text-sm">{impressions.toLocaleString()}</td>
                            <td className="admin-text-sm">{clicks.toLocaleString()}</td>
                            <td className="admin-text-sm">
                              <span style={{ 
                                color: ctr > 2 ? '#10b981' : ctr > 1 ? '#f59e0b' : '#ef4444',
                                fontWeight: '500'
                              }}>
                                {ctr.toFixed(2)}%
                              </span>
                            </td>
                            <td className="admin-text-sm">₩{cpc.toFixed(0)}</td>
                            <td className="admin-text-sm admin-font-medium" style={{ color: '#10b981' }}>
                              ₩{revenue.toFixed(0)}
                            </td>
                            <td>
                              {ctr > 2 ? 
                                <span className="admin-status-badge admin-status-green">우수</span> :
                                ctr > 1 ? 
                                <span className="admin-status-badge admin-status-orange">보통</span> :
                                <span className="admin-status-badge admin-status-red">개선필요</span>
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 최적화 제안 */}
              <div className="admin-card" style={{ background: '#f0f8ff', border: '1px solid #4285f4' }}>
                <h4 className="admin-text-lg admin-font-medium admin-text-gray-800 admin-mb-4">
                  <i className="fas fa-lightbulb mr-2" style={{ color: '#f59e0b' }}></i>
                  성과 개선 제안
                </h4>
                <div className="admin-grid admin-grid-cols-1" style={{ gap: '12px' }}>
                  {statsAd.ctr < 1.5 && (
                    <div style={{ padding: '12px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
                      <div className="admin-text-sm admin-font-medium" style={{ color: '#856404' }}>
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        CTR이 평균보다 낮습니다
                      </div>
                      <div className="admin-text-xs admin-text-gray-600 admin-mt-1">
                        광고 크기나 위치 변경을 고려해보세요. 현재 CTR: {statsAd.ctr}%, 권장: 1.5% 이상
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '12px', background: '#d1ecf1', borderRadius: '6px', border: '1px solid #bee5eb' }}>
                    <div className="admin-text-sm admin-font-medium" style={{ color: '#0c5460' }}>
                      <i className="fas fa-chart-line mr-2"></i>
                      A/B 테스트 권장
                    </div>
                    <div className="admin-text-xs admin-text-gray-600 admin-mt-1">
                      다른 크기의 광고 단위로 테스트하여 성과를 비교해보세요
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setShowStatsModal(false);
                  setStatsAd(null);
                }}
              >
                닫기
              </button>
              <button 
                type="button" 
                className="admin-btn admin-btn-primary"
                onClick={() => console.log('Excel 다운로드')}
              >
                <i className="fas fa-download mr-2"></i>
                Excel 다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdManagement;