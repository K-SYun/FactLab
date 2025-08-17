import React, { useState, useEffect } from 'react';
import './PopupDisplay.css';

const PopupDisplay = () => {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisplayPopups();
  }, []);

  const fetchDisplayPopups = async () => {
    try {
      const response = await fetch('/api/popups/display');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 쿠키에서 오늘 하루 안보기 설정한 팝업들 필터링
          const filteredPopups = result.data.filter(popup => !isHiddenToday(popup.id));
          setPopups(filteredPopups);
        }
      }
    } catch (error) {
      console.error('팝업 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 쿠키에서 오늘 하루 안보기 체크
  const isHiddenToday = (popupId) => {
    const today = new Date().toDateString();
    const hiddenPopups = JSON.parse(localStorage.getItem('hiddenPopups') || '{}');
    return hiddenPopups[popupId] === today;
  };

  // 오늘 하루 안보기 설정
  const hideToday = (popupId) => {
    const today = new Date().toDateString();
    const hiddenPopups = JSON.parse(localStorage.getItem('hiddenPopups') || '{}');
    hiddenPopups[popupId] = today;
    localStorage.setItem('hiddenPopups', JSON.stringify(hiddenPopups));
    
    // 해당 팝업을 목록에서 제거
    setPopups(popups.filter(popup => popup.id !== popupId));
  };

  // 팝업 닫기
  const closePopup = (popupId) => {
    setPopups(popups.filter(popup => popup.id !== popupId));
  };

  // 링크 클릭 처리
  const handleLinkClick = (linkUrl) => {
    if (linkUrl) {
      if (linkUrl.startsWith('http') || linkUrl.startsWith('https')) {
        window.open(linkUrl, '_blank');
      } else {
        window.location.href = linkUrl;
      }
    }
  };

  // 팝업 위치 스타일 계산
  const getPopupStyle = (popup) => {
    const baseStyle = {
      position: 'fixed',
      zIndex: 9999,
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      maxWidth: '500px',
      minWidth: '300px',
      maxHeight: '80vh',
      overflow: 'hidden'
    };

    if (popup.position === 'center') {
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    } else if (popup.position === 'custom' && popup.positionX && popup.positionY) {
      return {
        ...baseStyle,
        top: `${popup.positionY}px`,
        left: `${popup.positionX}px`
      };
    } else {
      // 기본값은 중앙
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }
  };

  if (loading || popups.length === 0) {
    return null;
  }

  return (
    <>
      {/* 오버레이 배경 */}
      {popups.length > 0 && (
        <div className="popup-overlay" />
      )}

      {/* 팝업들 */}
      {popups.map((popup, index) => (
        <div
          key={popup.id}
          className="popup-container"
          style={{
            ...getPopupStyle(popup),
            zIndex: 9999 + index // 여러 팝업이 있을 때 순서대로 표시
          }}
        >
          {/* 팝업 헤더 */}
          <div className="popup-header">
            <h3 className="popup-title">{popup.title}</h3>
            <button 
              className="popup-close-btn"
              onClick={() => closePopup(popup.id)}
              aria-label="팝업 닫기"
            >
              ×
            </button>
          </div>

          {/* 팝업 내용 */}
          <div className="popup-content">
            <div 
              className="popup-html-content"
              dangerouslySetInnerHTML={{ __html: popup.content }}
            />

            {/* 링크가 있는 경우 */}
            {popup.linkUrl && popup.linkText && (
              <div className="popup-link-section">
                <button
                  className="popup-link-btn"
                  onClick={() => handleLinkClick(popup.linkUrl)}
                >
                  {popup.linkText}
                </button>
              </div>
            )}
          </div>

          {/* 팝업 푸터 */}
          <div className="popup-footer">
            <label className="popup-checkbox-label">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    hideToday(popup.id);
                  }
                }}
              />
              <span>오늘 하루 안보기</span>
            </label>
            <button 
              className="popup-close-text-btn"
              onClick={() => closePopup(popup.id)}
            >
              닫기
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default PopupDisplay;