import AdBanner from './AdBanner';
import '../../styles/AdStyle.css';

const AdLayout = ({ children, showSideAds = true, showTopAd = true, showBottomAd = true }) => {
  return (
    <>
      {/* 상단 광고 */}
      {showTopAd && (
        <AdBanner
          className="main-top-banner-ad"
          adSlot="1471043815"
          adFormat="horizontal"
        />
      )}

      {/* 메인 컨테이너 */}
      <div className="main-container">
        {/* 좌측 광고 */}
        {showSideAds && (
          <AdBanner
            className="main-side-ad"
            adSlot="6197876443"
            adFormat="vertical"
          />
        )}

        {/* 메인 컨텐츠 */}
        <div className="main-content">
          {children}
        </div>

        {/* 우측 광고 */}
        {showSideAds && (
          <AdBanner
            className="main-side-ad"
            adSlot="7878052952"
            adFormat="vertical"
          />
        )}
      </div>

      {/* 하단 광고 */}
      {showBottomAd && (
        <>
          <AdBanner
            key="bottom-ad-1"
            className="main-bottom-banner-ad"
            adSlot="3571713105"
            adFormat="horizontal"
          />
          <div className="ad-separator" />
          <AdBanner
            key="bottom-ad-2"
            className="main-bottom-banner-ad-second"
            adSlot="9999999997" // TODO: 새 광고 슬롯 ID로 교체해야 합니다.
            adFormat="horizontal"
          />
        </>
      )}
    </>
  );
};

export default AdLayout;