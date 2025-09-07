import AdBanner from './AdBanner';
import '../../styles/AdStyle.css';

const AdLayout = ({ children, showSideAds = true, showTopAd = true, showBottomAd = true }) => {
  return (
    <>
      {/* 상단 광고 */}
      {showTopAd && (
        <div className="main-top-banner-ad">
          <AdBanner
            adSlot="1471043815"
            adFormat="horizontal"
            style={{ display: 'block', width: '100%', height: '90px' }}
          />
        </div>
      )}

      {/* 메인 컨테이너 */}
      <div className="main-container">
        {/* 좌측 광고 */}
        {showSideAds && (
          <div className="main-side-ad">
            <AdBanner
              adSlot="6197876443"
              adFormat="vertical"
              style={{ display: 'block', width: '160px', minHeight: '600px' }}
            />
          </div>
        )}

        {/* 메인 컨텐츠 */}
        <div className="main-content">
          {children}
        </div>

        {/* 우측 광고 */}
        {showSideAds && (
          <div className="main-side-ad">
            <AdBanner 
              adSlot="7878052952" 
              adFormat="vertical" 
              style={{ display: 'block', width: '160px', minHeight: '600px' }} 
            />
          </div>
        )}
      </div>

      {/* 하단 광고 */}
      {showBottomAd && (
        <div className="main-bottom-banner-ad">
          <AdBanner
            adSlot="3571713105"
            adFormat="horizontal"
            style={{ display: 'block', width: '100%', height: '200px' }}
          />
        </div>
      )}
    </>
  );
};

export default AdLayout;