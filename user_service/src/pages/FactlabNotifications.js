import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Common.css';
import '../styles/Notifications.css';

const FactlabNotifications = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showEmptyState, setShowEmptyState] = useState(false);

  // 샘플 알림 데이터
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'comment',
      title: '새로운 댓글이 달렸습니다',
      content: '경제분석가님이 "새로운 정부 정책에 대한 여러분의 의견은?" 게시글에 댓글을 작성했습니다.',
      time: '5분 전',
      isUnread: true,
      link: '/board_view/1234#comment-567'
    },
    {
      id: 2,
      type: 'news',
      title: '관심 키워드 뉴스',
      content: '관심 키워드 "AI 기술"과 관련된 새로운 뉴스가 등록되었습니다.',
      time: '1시간 전',
      isUnread: true,
      link: '/news_detail?id=5'
    },
    {
      id: 3,
      type: 'vote',
      title: '게시글 추천',
      content: '"AI 기술의 윤리적 문제점들" 게시글이 10개의 추천을 받았습니다.',
      time: '3시간 전',
      isUnread: true,
      link: '/board_view/1220'
    },
    {
      id: 4,
      type: 'comment',
      title: '답글 알림',
      content: '부동산전문가님이 회원님의 댓글에 답글을 작성했습니다.',
      time: '5시간 전',
      isUnread: true,
      link: '/board_view/1205#comment-890'
    },
    {
      id: 5,
      type: 'system',
      title: '레벨업 축하',
      content: '축하합니다! 레벨 5 "활발한 토론자"로 승급하셨습니다.',
      time: '1일 전',
      isUnread: true,
      link: '/mypage'
    },
    {
      id: 6,
      type: 'news',
      title: '팩트체크 완료',
      content: '회원님이 투표한 "새로운 백신 개발, 효과 95% 입증" 뉴스의 팩트체크가 완료되었습니다.',
      time: '1일 전',
      isUnread: false,
      link: '/news_detail?id=3'
    },
    {
      id: 7,
      type: 'comment',
      title: '댓글 좋아요',
      content: '회원님의 댓글이 5개의 좋아요를 받았습니다.',
      time: '2일 전',
      isUnread: false,
      link: '/board_view/1187#comment-445'
    },
    {
      id: 8,
      type: 'system',
      title: '공지사항',
      content: '새로운 공지사항: "FactLab 서비스 이용약관 개정 안내"가 등록되었습니다.',
      time: '3일 전',
      isUnread: false,
      link: '/notice?id=1'
    },
    {
      id: 9,
      type: 'vote',
      title: '뉴스 투표 마감',
      content: '"AI 기술 발전으로 일자리 30% 감소 예상" 뉴스 투표가 마감되었습니다. (총 169표)',
      time: '3일 전',
      isUnread: false,
      link: '/news_detail?id=1'
    },
    {
      id: 10,
      type: 'system',
      title: '활동 점수 획득',
      content: '활발한 활동으로 50점을 획득하셨습니다! (현재 1,350점)',
      time: '5일 전',
      isUnread: false,
      link: '/mypage'
    }
  ]);

  // 읽지 않은 알림 개수 계산
  const unreadCount = notifications.filter(n => n.isUnread).length;

  // 타입별 읽지 않은 알림 개수
  const getUnreadCountByType = (type) => {
    return notifications.filter(n => n.isUnread && n.type === type).length;
  };

  // 필터링된 알림 목록
  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter);

  // 필터 변경
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowEmptyState(filteredNotifications.length === 0);
  };

  // 알림 읽음 처리
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isUnread: false }
          : notification
      )
    );
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    if (window.confirm('모든 알림을 읽음 처리하시겠습니까?')) {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isUnread: false }))
      );
    }
  };

  // 읽은 알림 삭제
  const deleteReadNotifications = () => {
    if (window.confirm('읽은 알림을 모두 삭제하시겠습니까?')) {
      setNotifications(prev => prev.filter(notification => notification.isUnread));
    }
  };

  // 모든 알림 삭제
  const deleteAllNotifications = () => {
    if (window.confirm('모든 알림을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setNotifications([]);
    }
  };

  // 알림 클릭 처리
  const handleNotificationClick = (notification) => {
    if (notification.isUnread) {
      markAsRead(notification.id);
    }
    // 실제 구현에서는 React Router를 사용하여 페이지 이동
    console.log(`알림 클릭: ${notification.title}, 이동할 경로: ${notification.link}`);
  };

  // 타입별 스타일 클래스
  const getTypeClassName = (type) => {
    return `news-notification-type ${type}`;
  };

  // 타입별 텍스트
  const getTypeText = (type) => {
    switch (type) {
      case 'comment': return '댓글';
      case 'vote': return '투표';
      case 'system': return '시스템';
      case 'news': return '뉴스';
      default: return '일반';
    }
  };

  // 페이지 제목 업데이트
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) 알림 - FactLab`;
    } else {
      document.title = '알림 - FactLab';
    }

    return () => {
      document.title = 'FactLab';
    };
  }, [unreadCount]);

  return (
    <>
      <Header />
      
      <div className="news-notification-container">
        {/* Page Header */}
        <div className="news-notification-page-header">
          <div className="news-notification-page-title">🔔 알림</div>
          <div className="news-notification-stats">
            읽지 않은 알림 
            {unreadCount > 0 && <span className="news-notification-unread-count">{unreadCount}</span>}
            개 | 전체 {notifications.length}개
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="news-notification-filter-tabs">
          <div
            className={`news-notification-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            전체
          </div>
          <div
            className={`news-notification-filter-tab ${activeFilter === 'comment' ? 'active' : ''}`}
            onClick={() => handleFilterChange('comment')}
          >
            댓글
            {getUnreadCountByType('comment') > 0 && (
              <span className="news-notification-unread-count">{getUnreadCountByType('comment')}</span>
            )}
          </div>
          <div
            className={`news-notification-filter-tab ${activeFilter === 'vote' ? 'active' : ''}`}
            onClick={() => handleFilterChange('vote')}
          >
            투표
            {getUnreadCountByType('vote') > 0 && (
              <span className="news-notification-unread-count">{getUnreadCountByType('vote')}</span>
            )}
          </div>
          <div
            className={`news-notification-filter-tab ${activeFilter === 'system' ? 'active' : ''}`}
            onClick={() => handleFilterChange('system')}
          >
            시스템
            {getUnreadCountByType('system') > 0 && (
              <span className="news-notification-unread-count">{getUnreadCountByType('system')}</span>
            )}
          </div>
          <div
            className={`news-notification-filter-tab ${activeFilter === 'news' ? 'active' : ''}`}
            onClick={() => handleFilterChange('news')}
          >
            뉴스
            {getUnreadCountByType('news') > 0 && (
              <span className="news-notification-unread-count">{getUnreadCountByType('news')}</span>
            )}
          </div>
        </div>
        
        {/* Notification Actions */}
        <div className="news-notification-actions">
          <button className="news-btn" onClick={markAllAsRead}>모두 읽음 처리</button>
          <button className="news-btn" onClick={deleteReadNotifications}>읽은 알림 삭제</button>
          <button className="news-btn" onClick={deleteAllNotifications}>전체 삭제</button>
          <Link to="/settings" className="news-btn news-btn-primary">알림 설정</Link>
        </div>
        
        {/* Notification List */}
        <div className="news-notification-list">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`news-notification-item ${notification.isUnread ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="news-notification-header">
                  <div>
                    <span className={getTypeClassName(notification.type)}>
                      {getTypeText(notification.type)}
                    </span>
                    <span>{notification.title}</span>
                  </div>
                  <span className="news-notification-time">{notification.time}</span>
                </div>
                <div className="news-notification-content">
                  {notification.content}
                </div>
                <span className="news-notification-link">상세보기 →</span>
              </div>
            ))
          ) : (
            <div className="news-notification-empty-state">
              <p>표시할 알림이 없습니다.</p>
              <p>필터 조건을 변경하거나 새로운 알림을 기다려주세요.</p>
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredNotifications.length > 0 && (
          <div className="news-notification-load-more">
            <button className="news-btn" onClick={() => console.log('더 많은 알림 로드')}>
              더 많은 알림 보기
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default FactlabNotifications;