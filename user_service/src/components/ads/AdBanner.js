import { useEffect, useRef, useState } from 'react';

const AdBanner = ({
  adSlot,
  adFormat = 'auto',
  className = '',
  fullWidthResponsive = true,
  style = {}
}) => {
  const adRef = useRef(null);
  const containerRef = useRef(null);
  const [shouldShowAd, setShouldShowAd] = useState(false);

  useEffect(() => {
    // 컨테이너 너비 확인
    const checkWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // 최소 너비 120px 이상일 때만 광고 표시
        setShouldShowAd(width >= 120);
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);

    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    // AdSense 스크립트가 이미 로드되어 있고, 광고 표시 조건이 충족되면 로드
    if (shouldShowAd && window.adsbygoogle && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // 너비가 작아서 발생하는 오류는 무시 (개발 환경에서만 로그)
        if (process.env.NODE_ENV === 'development') {
          console.warn('AdSense 로드 경고:', e.message);
        }
      }
    }
  }, [shouldShowAd]);

  return (
    <div ref={containerRef} className={className} style={style}>
      {shouldShowAd ? (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', ...style }}
          data-ad-client="ca-pub-9530160990034599"
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidthResponsive}
        />
      ) : (
        <div style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px' }}>
          {/* 광고 공간이 충분하지 않음 */}
        </div>
      )}
    </div>
  );
};

export default AdBanner;