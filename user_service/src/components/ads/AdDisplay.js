/**
 * AdDisplay.js
 * 사용자 화면에서 광고를 표시하는 컴포넌트
 * 구글 광고와 직접 광고를 모두 지원
 */

import React, { useEffect, useState } from 'react';
import './AdDisplay.css';

const AdDisplay = ({ 
  position, 
  page, 
  device_type = 'all', 
  className = '' 
}) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current_ad_index, setCurrentAdIndex] = useState(0);

  // 광고 데이터 로드
  useEffect(() => {
    const loadAds = async () => {
      try {
        // 실제 API 호출 (여기서는 샘플 데이터 사용)
        const sampleAds = [
          {
            id: 1,
            title: '메인 페이지 상단 배너 - 구글 애드센스',
            type: 'banner',
            position: 'header_banner',
            size: '1200x90px',
            status: 'active',
            image_url: 'https://via.placeholder.com/1200x90/4F46E5/FFFFFF?text=Google+AdSense+Banner',
            target_url: '#',
            ad_category: 'google',
            priority: 1,
            advertiser: 'Google AdSense',
            ad_unit_id: 'ca-pub-1234567890123456/1234567890'
          },
          {
            id: 2,
            title: '뉴스 상세 우측 사이드바 - 부동산 앱',
            type: 'sidebar',
            position: 'sidebar_right',
            size: '160x600px',
            status: 'active',
            image_url: 'https://via.placeholder.com/160x600/10B981/FFFFFF?text=부동산나라',
            target_url: 'https://realestate-nara.com',
            ad_category: 'direct',
            priority: 2,
            advertiser: '부동산나라',
            contract_id: 'CONTRACT-2025-001'
          },
          {
            id: 3,
            title: '뉴스 목록 하단 배너 - 구글 애드센스',
            type: 'banner',
            position: 'footer_banner',
            size: '1200x200px',
            status: 'active',
            image_url: 'https://via.placeholder.com/1200x200/F59E0B/FFFFFF?text=Google+AdSense+Footer',
            target_url: '#',
            ad_category: 'google',
            priority: 3,
            advertiser: 'Google AdSense',
            ad_unit_id: 'ca-pub-1234567890123456/9876543210'
          },
          {
            id: 4,
            title: '뉴스 상세 콘텐츠 중간 - 건강식품',
            type: 'banner',
            position: 'content_middle',
            size: '300x250px',
            status: 'active',
            image_url: 'https://via.placeholder.com/300x250/8B5CF6/FFFFFF?text=헬스라이프',
            target_url: 'https://health-life.com',
            ad_category: 'direct',
            priority: 3,
            advertiser: '헬스라이프',
            contract_id: 'CONTRACT-2025-003'
          },
          {
            id: 5,
            title: '모바일 플로팅 광고 - 배달앱',
            type: 'floating',
            position: 'floating',
            size: '300x250px',
            status: 'active',
            image_url: 'https://via.placeholder.com/300x250/06B6D4/FFFFFF?text=딜리버리킹',
            target_url: 'https://delivery-king.com',
            ad_category: 'direct',
            priority: 1,
            advertiser: '딜리버리킹',
            contract_id: 'CONTRACT-2025-004'
          }
        ];

        // 현재 위치와 페이지에 맞는 활성 광고만 필터링
        const filteredAds = sampleAds.filter(ad => 
          ad.status === 'active' && 
          ad.position === position &&
          isAdAllowedOnPage(ad, page) &&
          isAdAllowedOnDevice(ad, device_type)
        );

        // 우선순위로 정렬
        filteredAds.sort((a, b) => a.priority - b.priority);

        setAds(filteredAds);
        setLoading(false);
      } catch (error) {
        console.error('광고 로드 실패:', error);
        setLoading(false);
      }
    };

    loadAds();
  }, [position, page, device_type]);

  // 페이지별 광고 허용 여부 확인
  const isAdAllowedOnPage = (ad, current_page) => {
    const page_mapping = {
      'main': ['main'],
      'news_list': ['news_list'],
      'news_detail': ['news_detail'],
      'board_list': ['board_list'],
      'board_detail': ['board_detail'],
      'mypage': ['mypage'],
      'login': ['login']
    };

    const allowed_pages = page_mapping[current_page] || [];
    return allowed_pages.some(page => 
      ad.title.includes(page) || 
      (ad.position.includes('header') && ['main', 'news_list', 'board_list'].includes(current_page)) ||
      (ad.position.includes('footer') && ['main', 'news_list', 'board_list'].includes(current_page)) ||
      (ad.position.includes('sidebar') && ['news_detail', 'board_detail'].includes(current_page)) ||
      (ad.position.includes('content') && ['news_detail', 'board_detail'].includes(current_page)) ||
      (ad.position.includes('floating') && ['main', 'news_list', 'news_detail'].includes(current_page))
    );
  };

  // 기기별 광고 허용 여부 확인
  const isAdAllowedOnDevice = (ad, device) => {
    if (device === 'all') return true;
    // 광고의 device target에 따른 필터링 로직을 여기에 추가
    return true;
  };

  // 광고 회전 (여러 광고가 있을 때)
  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      }, 10000); // 10초마다 광고 변경

      return () => clearInterval(interval);
    }
  }, [ads.length]);

  // 광고 클릭 이벤트
  const handleAdClick = (ad) => {
    // 클릭 이벤트 추적
    trackAdClick(ad);
    
    // 구글 광고인 경우 새 창에서 열기
    if (ad.ad_category === 'google') {
      // 구글 애드센스 클릭 처리
      console.log('Google AdSense 클릭:', ad.ad_unit_id);
    } else {
      // 직접 광고인 경우 해당 URL로 이동
      if (ad.target_url && ad.target_url !== '#') {
        window.open(ad.target_url, '_blank');
      }
    }
  };

  // 광고 클릭 추적
  const trackAdClick = (ad) => {
    // 백엔드 서버가 구현되면 활성화
    console.log('광고 클릭 추적:', {
      ad_id: ad.id,
      position: position,
      page: page,
      timestamp: new Date().toISOString()
    });
    
    // 실제 API로 클릭 이벤트 전송 (백엔드 구현 후 활성화)
    /*
    fetch('/api/ads/track_click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ad_id: ad.id,
        position: position,
        page: page,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.error('클릭 추적 실패:', error);
    });
    */
  };

  // 광고 노출 추적
  useEffect(() => {
    if (ads.length > 0) {
      // 백엔드 서버가 구현되면 활성화
      console.log('광고 노출 추적:', {
        ads: ads.map(ad => ad.id),
        position: position,
        page: page,
        timestamp: new Date().toISOString()
      });
      
      // 실제 API로 노출 이벤트 전송 (백엔드 구현 후 활성화)
      /*
      ads.forEach(ad => {
        fetch('/api/ads/track_impression', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ad_id: ad.id,
            position: position,
            page: page,
            timestamp: new Date().toISOString()
          })
        }).catch(error => {
          console.error('노출 추적 실패:', error);
        });
      });
      */
    }
  }, [ads, position, page]);

  // 로딩 중
  if (loading) {
    return (
      <div className={`ad_display ad_loading ${className}`}>
        <div className="ad_skeleton"></div>
      </div>
    );
  }

  // 광고가 없는 경우
  if (ads.length === 0) {
    return null;
  }

  const current_ad = ads[current_ad_index];

  // 구글 애드센스 광고 렌더링
  if (current_ad.ad_category === 'google') {
    return (
      <div className={`ad_display ad_google ${className}`} data-position={position}>
        <div className="ad_label">광고</div>
        <div className="ad_content">
          {/* 실제 구글 애드센스 코드가 여기에 들어갑니다 */}
          <div className="google_ad_placeholder">
            <img 
              src={current_ad.image_url} 
              alt={current_ad.title}
              className="ad_image"
            />
          </div>
          {/* 구글 애드센스 스크립트 */}
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-1234567890123456"
               data-ad-slot={current_ad.ad_unit_id?.split('/')[1]}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </div>
      </div>
    );
  }

  // 직접 광고 렌더링
  return (
    <div className={`ad_display ad_direct ${className}`} data-position={position}>
      <div className="ad_label">광고</div>
      <div 
        className="ad_content"
        onClick={() => handleAdClick(current_ad)}
        style={{ cursor: 'pointer' }}
      >
        {current_ad.image_url && (
          <img 
            src={current_ad.image_url} 
            alt={current_ad.title}
            className="ad_image"
          />
        )}
        <div className="ad_info">
          <div className="ad_advertiser">{current_ad.advertiser}</div>
        </div>
      </div>
      
      {ads.length > 1 && (
        <div className="ad_indicators">
          {ads.map((_, index) => (
            <span 
              key={index}
              className={`ad_indicator ${index === current_ad_index ? 'active' : ''}`}
              onClick={() => setCurrentAdIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdDisplay;