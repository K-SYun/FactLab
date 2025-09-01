import { useEffect, useRef } from 'react';

const AdBanner = ({ 
  adSlot, 
  adFormat = 'auto', 
  style = { display: 'block' },
  className = '',
  fullWidthResponsive = true 
}) => {
  const adRef = useRef(null);

  useEffect(() => {
    // AdSense 스크립트가 이미 로드되어 있는지 확인
    if (window.adsbygoogle && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense 로드 오류:', e);
      }
    }
  }, []);

  return (
    <div className={`ad-banner ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-9530160990034599"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive}
      />
    </div>
  );
};

export default AdBanner;