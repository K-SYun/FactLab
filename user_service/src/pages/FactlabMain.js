import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import PopupDisplay from '../components/PopupDisplay';
import '../styles/Main.css';
import '../styles/Common.css';
import '../styles/AdStyle.css';
import { newsApi } from '../services/api';
import { AdBanner } from '../components/ads';

const FactlabMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [bestNews, setBestNews] = useState([]);
  const [bestNewsPeriod, setBestNewsPeriod] = useState('daily');
  const [todaysNews, setTodaysNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);

        // 관리자가 메인에 지정한 실시간 이슈 뉴스만 가져오기
        const response = await newsApi.getFeaturedNews();
        const newsData = response.data.data || [];

        // 관리자가 지정한 뉴스만 표시 (fallback 제거)
        setNews(newsData);

        setError(null);
      } catch (err) {
        console.error('메인 뉴스 로드 실패:', err);
        setError('뉴스를 가져오는데 실패했습니다.');
        setNews([]); // 오류 시 빈 배열 (관리자가 지정한 뉴스가 없으면 표시하지 않음)
      } finally {
        setLoading(false);
      }
    };

    const fetchTrendingKeywords = async () => {
      try {
        // 실제 API에서 트렌딩 키워드 가져오기
        const response = await newsApi.getTrendingKeywords();
        if (response.data.success) {
          const keywordsData = response.data.data || [];
          // 키워드 데이터를 순위와 함께 표시하기 위해 가공
          const formattedKeywords = keywordsData.map((item, index) => ({
            rank: index + 1,
            keyword: item.keyword,
            count: item.count
          }));
          setTrendingKeywords(formattedKeywords.slice(0, 10)); // 상위 10개만
        } else {
          throw new Error('API response not successful');
        }
      } catch (err) {
        // 에러 시 기본 키워드 사용 (순위와 함께)
        const defaultKeywords = [
          "AI일자리", "백신효과", "탄소중립", "팩트체크", "기후변화",
          "집중호우", "태풍", "갑질폭로", "부동산", "주식시장"
        ];
        setTrendingKeywords(defaultKeywords.map((keyword, index) => ({
          rank: index + 1,
          keyword: keyword,
          count: Math.floor(Math.random() * 100) + 20 // 임시 카운트
        })));
      }
    };

    const fetchTodaysNews = async () => {
      try {
        // 오늘 날짜의 승인된 뉴스 가져오기
        const response = await newsApi.getLatestNews(30); // 더 많은 뉴스 가져와서 오늘 것만 필터링
        if (response.data.success) {
          const allNews = response.data.data || [];

          const today = new Date();
          const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식

          // 최근 뉴스들을 가져오되, 오늘 날짜를 우선적으로 필터링 
          // 만약 오늘 뉴스가 없으면 최근 뉴스로 대체
          let todayNews = allNews
            .filter(news => {
              const newsDate = new Date(news.publishDate).toISOString().split('T')[0];
              return newsDate === todayStr;
            });

          // 오늘 뉴스가 없으면 최근 뉴스 사용
          if (todayNews.length === 0) {
            todayNews = allNews.slice(0, 10);
          }

          // 시간순 정렬 (최신 것부터)
          todayNews = todayNews
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, 10); // 최대 10개

          setTodaysNews(todayNews);
        }
      } catch (err) {
        setTodaysNews([]); // 에러 시 빈 배열
      }
    };

    fetchNews();
    fetchTrendingKeywords();
    fetchTodaysNews();
  }, []);

  // 베스트 뉴스 가져오기
  useEffect(() => {
    const fetchBestNews = async () => {
      try {
        const response = await newsApi.getBestNews(bestNewsPeriod, 10);
        if (response.data.success) {
          setBestNews(response.data.data || []);
        } else {
          throw new Error('API response not successful');
        }
      } catch (err) {
        setBestNews([]); // 에러 시 빈 배열
      }
    };

    fetchBestNews();
  }, [bestNewsPeriod]);

  // 회원가입 완료 후 로그인 모달 표시
  useEffect(() => {
    if (location.state?.showLoginModal) {
      setShowLoginModal(true);

      // 회원가입 시 사용한 이메일 저장
      if (location.state.email) {
        setRegistrationEmail(location.state.email);
      }

      // 회원가입 완료 메시지 표시
      if (location.state.message) {
        setTimeout(() => {
          alert(location.state.message);
        }, 500);
      }

      // location state 정리 (뒤로가기 시 모달이 다시 나타나지 않도록)
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getCategoryName = (category) => {
    const categoryMap = {
      'politics': '정치',
      'economy': '경제',
      'society': '사회',
      'technology': 'IT/과학',
      'world': '세계',
      'entertainment': '연예',
      'sports': '스포츠',
      'environment': '기후/환경'
    };
    return categoryMap[category] || category;
  };

  const goToNewsDetail = (newsId) => {
    // 조회수는 뉴스 상세 페이지에서만 증가
    navigate(`/news_detail?id=${newsId}`);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      <Header />
      <div className="main-top-banner-ad">
        <AdBanner
          adSlot="1471043815"
          adFormat="horizontal"
          style={{ display: 'block', width: '100%', height: '90px' }}
        />
      </div>
      <div className="main-container">
        {/* 좌측 광고 */}
        <div className="main-side-ad">
          <AdBanner
            adSlot="6197876443"
            adFormat="vertical"
            style={{ display: 'block', width: '160px', minHeight: '600px' }}
          />
        </div>
        {/* 메인 컨텐츠 */}
        <div className="main-content">
          <div className="main-content-grid">
            {/* 뉴스 섹션 */}
            <div className="main-news-section">
              <h2 className="main-section-title">🔥 실시간 이슈 뉴스</h2>
              {loading ? (
                <div className="loading">뉴스를 불러오는 중...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : (
                news.map((item) => (
                  <div key={item.id} className="main-news-card">
                    <div className="main-news-thumbnail" onClick={() => goToNewsDetail(item.id)}>
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt="뉴스 썸네일"
                          className="main-news-thumbnail-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`main-news-thumbnail-placeholder ${item.thumbnail ? 'hidden' : ''}`}
                      >
                        <img
                          src="/Logo.png"
                          alt="FactLab Logo"
                          className="main-news-placeholder-logo"
                        />
                        <span className="main-news-placeholder-text">
                          No Image
                        </span>
                      </div>
                    </div>
                    <div className="main-news-content">
                      <h3 className="main-news-title" onClick={() => goToNewsDetail(item.id)}>{item.title}</h3>
                      <p className="main-news-summary" onClick={() => goToNewsDetail(item.id)}>{item.content.substring(0, 120)}...</p>
                      <div className="main-news-meta">
                        <span>{item.source} | {getCategoryName(item.category)} | {formatDate(item.publishDate)} | 👀 {item.viewCount || 0}</span>
                        <div className="main-vote-buttons">
                          <span className="main-vote-btn agree">사실 ({item.factCount || 0})</span>
                          <span className="main-vote-btn disagree">의심 ({item.doubtCount || 0})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* 사이드바 */}
            <div className="">
              <div className="news-content-banner-ad">
                🎯 법안 카드 영역
              </div>

              <div className="news-sidebar-item">
                <div className="news-sidebar-title">📈 트렌딩 키워드</div>
                {trendingKeywords.map((item, index) => (
                  <div key={index} className="news-trending-item">
                    <span className="trending-rank">{item.rank}위</span>
                    <span className="trending-keyword">#{item.keyword}</span>
                    <span className="trending-count">({item.count})</span>
                  </div>
                ))}
                {trendingKeywords.length === 0 && (
                  <div className="news-trending-item">키워드 로딩 중...</div>
                )}
              </div>
              <div className="news-content-banner-ad">
                🎯 콘텐츠 배너 광고 영역 (210px x 370px)
              </div>
              <div className="news-sidebar-item">
                <div className="news-sidebar-title">🏆 인기 게시판</div>
                <div className="news-board-item"><span>자유Lab</span><span className="news-board-posts">987</span></div>
                <div className="news-board-item"><span>정치Lab</span><span className="news-board-posts">756</span></div>
                <div className="news-board-item"><span>경제Lab</span><span className="news-board-posts">654</span></div>
                <div className="news-board-item"><span>주식(국장)</span><span className="news-board-posts">543</span></div>
                <div className="news-board-item"><span>주식(미장/기타)</span><span className="news-board-posts">432</span></div>
                <div className="news-board-item"><span>부동산</span><span className="news-board-posts">321</span></div>
                <div className="news-board-item"><span>골프</span><span className="news-board-posts">298</span></div>
                <div className="news-board-item"><span>축구</span><span className="news-board-posts">276</span></div>
                <div className="news-board-item"><span>게임</span><span className="news-board-posts">254</span></div>
                <div className="news-board-item"><span>게임</span><span className="news-board-posts">254</span></div>
              </div>

            </div>
          </div>
          {/* 하단 섹션 */}
          <div className="bottom-section">
            <div className="weekly-best">
              <div className="main-best-header">
                <div className="main-best-title-row">
                  <h2 className="main-section-title main-best-title">🏅 베스트 뉴스</h2>
                  <div className="best-period-filter">
                    <span
                      className={`main-best-filter-clickable ${bestNewsPeriod === 'daily' ? 'active' : ''}`}
                      onClick={() => setBestNewsPeriod('daily')}
                    >
                      일일
                    </span>
                    |
                    <span
                      className={`main-best-filter-clickable ${bestNewsPeriod === 'weekly' ? 'active' : ''}`}
                      onClick={() => setBestNewsPeriod('weekly')}
                    >
                      주간
                    </span>
                    |
                    <span
                      className={`main-best-filter-clickable ${bestNewsPeriod === 'monthly' ? 'active' : ''}`}
                      onClick={() => setBestNewsPeriod('monthly')}
                    >
                      월간
                    </span>
                  </div>
                </div>
                <div className="main-best-divider"></div>
              </div>
              {bestNews.map((item, index) => (
                <div key={item.id} className="best-item">
                  <div className="best-rank">{index + 1}</div>
                  <div
                    className="main-best-item-clickable"
                    onClick={() => goToNewsDetail(item.id)}
                  >
                    {item.title}
                  </div>
                </div>
              ))}
              {bestNews.length === 0 && (
                <div className="best-item">베스트 뉴스를 불러오는 중...</div>
              )}
            </div>
            <div className="todays-news">
              <h2 className="main-section-title">📰 오늘의 뉴스</h2>
              {todaysNews.map((item, index) => (
                <div key={item.id} className="news-item">
                  <strong>{formatTime(item.originalPublishDate || item.publishDate)}</strong>
                  <span
                    className="main-todays-news-clickable"
                    onClick={() => goToNewsDetail(item.id)}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
              {todaysNews.length === 0 && (
                <div className="news-item">오늘의 뉴스를 불러오는 중...</div>
              )}
            </div>
          </div>
        </div>
        {/* 우측 광고 */}
        <div className="main-side-ad">
          <AdBanner adSlot="7878052952" adFormat="vertical" style={{ display: 'block', width: '160px', minHeight: '600px' }} />
        </div>
      </div>

      {/* 하단 광고 */}
      <div className="main-bottom-banner-ad">
        <AdBanner
          adSlot="3571713105"
          adFormat="horizontal"
          style={{ display: 'block', width: '100%', height: '200px' }}
        />
      </div>

      <Footer />

      {/* 회원가입 완료 후 로그인 모달 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        initialEmail={registrationEmail}
      />

      {/* 팝업 표시 */}
      <PopupDisplay />
    </>
  );
};

export default FactlabMain;
