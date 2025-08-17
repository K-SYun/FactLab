/**
 * AdContainer.js
 * 페이지별 광고 레이아웃을 관리하는 컨테이너 컴포넌트
 */

import React from 'react';
import AdDisplay from './AdDisplay';
import './AdContainer.css';

const AdContainer = ({ page, children, className = '' }) => {
  const getDeviceType = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768 ? 'mobile' : 'desktop';
    }
    return 'desktop';
  };

  const device_type = getDeviceType();

  return (
    <div className={`ad_container ${className}`}>
      {/* 상단 배너 광고 */}
      <div className="ad_section ad_header">
        <AdDisplay 
          position="header_banner"
          page={page}
          device_type={device_type}
        />
      </div>

      {/* 메인 콘텐츠와 사이드바 */}
      <div className="ad_main_layout">
        {/* 좌측 사이드바 광고 (데스크톱만) */}
        {device_type === 'desktop' && (
          <div className="ad_sidebar ad_sidebar_left">
            <AdDisplay 
              position="sidebar_left"
              page={page}
              device_type={device_type}
            />
          </div>
        )}

        {/* 메인 콘텐츠 영역 */}
        <div className="ad_content_wrapper">
          {/* 콘텐츠 상단 광고 */}
          <div className="ad_section ad_content_top">
            <AdDisplay 
              position="content_top"
              page={page}
              device_type={device_type}
            />
          </div>

          {/* 실제 페이지 콘텐츠 */}
          <div className="ad_main_content">
            {children}
            
            {/* 콘텐츠 중간 광고 (긴 콘텐츠의 경우) */}
            {(page === 'news_detail' || page === 'board_detail') && (
              <div className="ad_section ad_content_middle">
                <AdDisplay 
                  position="content_middle"
                  page={page}
                  device_type={device_type}
                />
              </div>
            )}
          </div>

          {/* 콘텐츠 하단 광고 */}
          <div className="ad_section ad_content_bottom">
            <AdDisplay 
              position="content_bottom"
              page={page}
              device_type={device_type}
            />
          </div>
        </div>

        {/* 우측 사이드바 광고 (데스크톱만) */}
        {device_type === 'desktop' && (
          <div className="ad_sidebar ad_sidebar_right">
            <AdDisplay 
              position="sidebar_right"
              page={page}
              device_type={device_type}
            />
          </div>
        )}
      </div>

      {/* 하단 배너 광고 */}
      <div className="ad_section ad_footer">
        <AdDisplay 
          position="footer_banner"
          page={page}
          device_type={device_type}
        />
      </div>

      {/* 플로팅 광고 (모든 페이지) */}
      <AdDisplay 
        position="floating"
        page={page}
        device_type={device_type}
      />

      {/* 팝업 광고 (메인 페이지만) */}
      {page === 'main' && (
        <AdDisplay 
          position="popup"
          page={page}
          device_type={device_type}
        />
      )}

      {/* 네이티브 피드 광고 (목록 페이지) */}
      {(page === 'news_list' || page === 'board_list') && (
        <div className="ad_section ad_native_feed">
          <AdDisplay 
            position="native_feed"
            page={page}
            device_type={device_type}
          />
        </div>
      )}
    </div>
  );
};

export default AdContainer;