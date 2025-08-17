/**
 * useAds.js
 * 광고 관련 기능을 제공하는 커스텀 Hook
 */

import { useState, useEffect } from 'react';

export const useAds = (options = {}) => {
  const {
    position = 'all',
    page = 'all',
    device_type = 'all',
    auto_refresh = false,
    refresh_interval = 30000
  } = options;

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 광고 데이터 로드
  const loadAds = async () => {
    try {
      setLoading(true);
      setError(null);

      // 실제 API 엔드포인트
      const params = new URLSearchParams({
        position: position,
        page: page,
        device_type: device_type,
        status: 'active'
      });

      const response = await fetch(`/api/ads/display?${params}`);
      
      if (!response.ok) {
        throw new Error('광고 데이터를 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      setAds(data.ads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      console.error('광고 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 광고 클릭 추적
  const trackAdClick = async (ad_id, additional_data = {}) => {
    try {
      await fetch('/api/ads/track_click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id,
          position,
          page,
          device_type,
          timestamp: new Date().toISOString(),
          ...additional_data
        }),
      });
    } catch (err) {
      console.error('클릭 추적 실패:', err);
    }
  };

  // 광고 노출 추적
  const trackAdImpression = async (ad_id, additional_data = {}) => {
    try {
      await fetch('/api/ads/track_impression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id,
          position,
          page,
          device_type,
          timestamp: new Date().toISOString(),
          ...additional_data
        }),
      });
    } catch (err) {
      console.error('노출 추적 실패:', err);
    }
  };

  // 광고 상호작용 추적 (호버, 뷰포트 진입 등)
  const trackAdInteraction = async (ad_id, interaction_type, additional_data = {}) => {
    try {
      await fetch('/api/ads/track_interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id,
          interaction_type,
          position,
          page,
          device_type,
          timestamp: new Date().toISOString(),
          ...additional_data
        }),
      });
    } catch (err) {
      console.error('상호작용 추적 실패:', err);
    }
  };

  // 현재 기기 타입 감지
  const detectDeviceType = () => {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  };

  // 광고 필터링
  const getFilteredAds = (filter_options = {}) => {
    const {
      position: filter_position = position,
      page: filter_page = page,
      device_type: filter_device_type = device_type
    } = filter_options;

    return ads.filter(ad => {
      if (filter_position !== 'all' && ad.position !== filter_position) return false;
      if (filter_page !== 'all' && !isAdAllowedOnPage(ad, filter_page)) return false;
      if (filter_device_type !== 'all' && !isAdAllowedOnDevice(ad, filter_device_type)) return false;
      return ad.status === 'active';
    });
  };

  // 페이지별 광고 허용 여부 확인
  const isAdAllowedOnPage = (ad, target_page) => {
    // 페이지별 광고 위치 매핑
    const page_ad_positions = {
      'main': ['header_banner', 'footer_banner', 'popup', 'floating'],
      'news_list': ['header_banner', 'footer_banner', 'native_feed', 'floating'],
      'news_detail': ['sidebar_right', 'sidebar_left', 'content_top', 'content_middle', 'content_bottom', 'floating'],
      'board_list': ['header_banner', 'footer_banner', 'native_feed', 'floating'],
      'board_detail': ['sidebar_right', 'sidebar_left', 'content_top', 'content_middle', 'content_bottom', 'floating'],
      'mypage': ['sidebar_right', 'content_top', 'content_bottom'],
      'login': ['content_top', 'content_bottom']
    };

    const allowed_positions = page_ad_positions[target_page] || [];
    return allowed_positions.includes(ad.position);
  };

  // 기기별 광고 허용 여부 확인
  const isAdAllowedOnDevice = (ad, target_device) => {
    // 모바일에서는 사이드바 광고 제외
    if (target_device === 'mobile' && (ad.position.includes('sidebar'))) {
      return false;
    }
    
    // 기타 기기별 필터링 로직
    return true;
  };

  // 초기 로드
  useEffect(() => {
    loadAds();
  }, [position, page, device_type]);

  // 자동 새로고침
  useEffect(() => {
    if (!auto_refresh) return;

    const interval = setInterval(() => {
      loadAds();
    }, refresh_interval);

    return () => clearInterval(interval);
  }, [auto_refresh, refresh_interval, position, page, device_type]);

  return {
    ads,
    loading,
    error,
    loadAds,
    trackAdClick,
    trackAdImpression,
    trackAdInteraction,
    getFilteredAds,
    detectDeviceType,
    isAdAllowedOnPage,
    isAdAllowedOnDevice
  };
};

// 광고 성능 데이터를 가져오는 Hook
export const useAdPerformance = (ad_id, time_range = '7d') => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPerformance = async () => {
      if (!ad_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/ads/${ad_id}/performance?range=${time_range}`);
        
        if (!response.ok) {
          throw new Error('성능 데이터를 가져오는데 실패했습니다.');
        }

        const data = await response.json();
        setPerformance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        console.error('성능 데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [ad_id, time_range]);

  return { performance, loading, error };
};

export default useAds;