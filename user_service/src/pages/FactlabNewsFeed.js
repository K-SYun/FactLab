import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/News.css';
import '../styles/Main.css';
import { newsApi } from '../services/api';

const FactlabNewsFeed = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  // state에서 category를 가져오되, 없으면 searchParams에서 가져오고, 둘 다 없으면 '전체' 사용
  const category = location.state?.category || searchParams.get('category') || '전체';
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voteResults, setVoteResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const trendingKeywords = [
    "경제정책", "K-팝", "빌보드", "AI 기술", "일자리", "탄소중립", 
    "기후변화", "부동산", "인플레이션", "재교육", "ESG", "친환경"
  ];

  useEffect(() => {
    const fetchNews = async (page = 1) => {
      try {
        setLoading(true);
        
        // 페이지 기반으로 뉴스 가져오기
        const offset = (page - 1) * ITEMS_PER_PAGE;
        let response;
        
        if (category === '전체') {
          response = await newsApi.getAllNews(offset, ITEMS_PER_PAGE);
        } else {
          response = await newsApi.getNewsByCategory(category, offset, ITEMS_PER_PAGE);
        }
        
        const newsData = response.data.data || [];
        
        // 전체 개수를 위한 별도 요청 (첫 번째 페이지에서만)
        if (page === 1) {
          try {
            let totalResponse;
            if (category === '전체') {
              totalResponse = await newsApi.getAllNews(0, 1000); // 충분히 큰 수로 전체 개수 확인
            } else {
              totalResponse = await newsApi.getNewsByCategory(category, 0, 1000);
            }
            const totalData = totalResponse.data.data || [];
            setTotalCount(totalData.length);
            setTotalPages(Math.ceil(totalData.length / ITEMS_PER_PAGE));
          } catch (totalErr) {
            console.warn('Total count fetch failed:', totalErr);
            setTotalCount(newsData.length);
            setTotalPages(1);
          }
        }
        
        setNews(newsData);
        setCurrentPage(page);
        setError(null);
        
        // 각 뉴스의 투표 결과 가져오기
        const voteResultsData = {};
        for (const newsItem of newsData) {
          try {
            const voteData = await newsApi.getVoteResults(newsItem.id);
            if (voteData.data.success && voteData.data.data) {
              voteResultsData[newsItem.id] = voteData.data.data;
            } else {
              voteResultsData[newsItem.id] = {
                fact: 0,
                partial_fact: 0,
                slight_doubt: 0,
                doubt: 0,
                unknown: 0,
                total: 0
              };
            }
          } catch (voteError) {
            console.warn(`투표 결과 로드 실패 for news ${newsItem.id}:`, voteError);
            voteResultsData[newsItem.id] = {
              fact: 0,
              partial_fact: 0,
              slight_doubt: 0,
              doubt: 0,
              unknown: 0,
              total: 0
            };
          }
        }
        setVoteResults(voteResultsData);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('뉴스를 가져오는데 실패했습니다.');
        setNews([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchNews(1);
  }, [category]);

  // 투표 버튼 클릭 시 상세 페이지로 이동
  const goToVote = (newsId) => {
    navigate(`/news_detail?id=${newsId}`);
  };

  // 뉴스 상세 페이지로 이동
  const goToNewsDetail = (newsId) => {
    navigate(`/news_detail?id=${newsId}`);
  };

  // 토론 이동 기능
  const goToDiscussion = (newsId) => {
    navigate(`/news_detail?id=${newsId}`);
  };

  // 페이지 변경 함수
  const changePage = async (page) => {
    if (page < 1 || page > totalPages || page === currentPage || loading) return;
    
    try {
      setLoading(true);
      
      const offset = (page - 1) * ITEMS_PER_PAGE;
      let response;
      
      if (category === '전체') {
        response = await newsApi.getAllNews(offset, ITEMS_PER_PAGE);
      } else {
        response = await newsApi.getNewsByCategory(category, offset, ITEMS_PER_PAGE);
      }
      
      const newsData = response.data.data || [];
      setNews(newsData);
      setCurrentPage(page);
      setError(null);
      
      // 페이지 변경 시에도 투표 결과 가져오기
      const voteResultsData = {};
      for (const newsItem of newsData) {
        try {
          const voteData = await newsApi.getVoteResults(newsItem.id);
          if (voteData.data.success && voteData.data.data) {
            voteResultsData[newsItem.id] = voteData.data.data;
          } else {
            voteResultsData[newsItem.id] = {
              fact: 0,
              partial_fact: 0,
              slight_doubt: 0,
              doubt: 0,
              unknown: 0,
              total: 0
            };
          }
        } catch (voteError) {
          console.warn(`투표 결과 로드 실패 for news ${newsItem.id}:`, voteError);
          voteResultsData[newsItem.id] = {
            fact: 0,
            partial_fact: 0,
            slight_doubt: 0,
            doubt: 0,
            unknown: 0,
            total: 0
          };
        }
      }
      setVoteResults(prev => ({...prev, ...voteResultsData}));
    } catch (err) {
      console.error('Error changing page:', err);
      setError('뉴스를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <>
      <Header />
      <div className="main-top-banner-ad">
        🎯 상단 배너 광고 영역 (1200px x 90px)
      </div>
      <div className="main-container">
        {/* 좌측 광고 */}
        <div className="main-side-ad">
          📢<br />좌측<br />광고<br />영역<br />(160px)
        </div>
        {/* 메인 컨텐츠 */}
        <div className="main-content">
          <div className="news_feed_container">
            {/* 카테고리 헤더 */}
            <div className="news_category_header">
              <h1 className="news_category_title">📰 {category} 뉴스 <span className="news_category_stats">(총 {news.length}개)</span></h1>
            </div>

            {/* 트렌딩 키워드 섹션 */}
            <div className="news_trending_keywords">
              <div className="news_trending_title">🔥 실시간 트렌드</div>
              <div className="news_keyword_list">
                {trendingKeywords.map((keyword, index) => (
                  <a 
                    key={index} 
                    href={`#search=${keyword}`} 
                    className="news_keyword_tag"
                  >
                    {keyword}
                  </a>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="loading">뉴스를 불러오는 중...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : (
              /* 뉴스 그리드 섹션 */
              <div className="news_grid">
                {news.map((newsItem, index) => (
                  <React.Fragment key={newsItem.id}>
                    <div className="news_card">
                      {/* 뉴스 썸네일 */}
                      <div className="news_thumbnail" onClick={() => goToNewsDetail(newsItem.id)}>
                        {newsItem.thumbnail ? (
                          <img 
                            src={newsItem.thumbnail} 
                            alt="뉴스 썸네일"
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="news_thumbnail_placeholder"
                          style={{ 
                            display: newsItem.thumbnail ? 'none' : 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px'
                          }}
                        >
                          <img 
                            src="/Logo.png" 
                            alt="FactLab Logo"
                            style={{ 
                              height: '30px',
                              width: 'auto',
                              maxWidth: '80px',
                              marginBottom: '5px',
                              opacity: '0.7',
                              objectFit: 'contain'
                            }}
                          />
                          <span style={{ 
                            color: '#6c757d',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}>
                            No Image
                          </span>
                        </div>
                      </div>

                      {/* 뉴스 콘텐츠 영역 */}
                      <div className="news_content_area">
                        {/* 뉴스 제목 */}
                        <h3 className="news_title" onClick={() => goToNewsDetail(newsItem.id)}>{newsItem.title}</h3>

                        {/* 뉴스 요약 */}
                        <p className="news_summary">{newsItem.content.substring(0, 150)}...</p>

                        {/* 팩트체크 질문 */}
                        <div className="news_fact_question">
                          🤔 이 뉴스 내용이 사실일까요?
                        </div>

                        {/* 투표 영역 */}
                        <div className="news_voting_area">
                          {(() => {
                            const newsVoteResult = voteResults[newsItem.id] || { fact: 0, partial_fact: 0, slight_doubt: 0, doubt: 0, unknown: 0, total: 0 };
                            
                            return (
                              <>
                                <button
                                  className="news_vote_option fact"
                                  onClick={() => goToVote(newsItem.id)}
                                >
                                  ✅ 사실 ({newsVoteResult.total > 0 ? Math.round((newsVoteResult.fact || 0) / newsVoteResult.total * 100) : 0}%)
                                </button>
                                <button
                                  className="news_vote_option partial_fact"
                                  onClick={() => goToVote(newsItem.id)}
                                >
                                  🔸 부분사실 ({newsVoteResult.total > 0 ? Math.round((newsVoteResult.partial_fact || 0) / newsVoteResult.total * 100) : 0}%)
                                </button>
                                <button
                                  className="news_vote_option slight_doubt"
                                  onClick={() => goToVote(newsItem.id)}
                                >
                                  🔹 조금 의심 ({newsVoteResult.total > 0 ? Math.round((newsVoteResult.slight_doubt || 0) / newsVoteResult.total * 100) : 0}%)
                                </button>
                                <button
                                  className="news_vote_option doubt"
                                  onClick={() => goToVote(newsItem.id)}
                                >
                                  ❌ 의심 ({newsVoteResult.total > 0 ? Math.round((newsVoteResult.doubt || 0) / newsVoteResult.total * 100) : 0}%)
                                </button>
                                <button
                                  className="news_vote_option unknown"
                                  onClick={() => goToVote(newsItem.id)}
                                >
                                  ❓ 모르겠다 ({newsVoteResult.total > 0 ? Math.round((newsVoteResult.unknown || 0) / newsVoteResult.total * 100) : 0}%)
                                </button>
                              </>
                            );
                          })()}
                        </div>

                        {/* 뉴스 통계 및 액션 */}
                        <div className="news_stats">
                          <div className="news_stats_left">
                            <span>{newsItem.source} | {newsItem.category} | {formatDate(newsItem.publishDate)} | 👀 {newsItem.viewCount || 0}</span>
                          </div>
                          <button 
                            className="news_discussion_btn"
                            onClick={() => goToDiscussion(newsItem.id)}
                          >
                            토론 참여
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* 10번째 뉴스 다음에 배너 광고 삽입 */}
                    {(index + 1) % 10 === 0 && index < news.length - 1 && (
                      <div className="news_banner_ad">
                        🎯 뉴스 중간 배너 광고 (1200px x 50px)
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="news_pagination">
                {/* 맨 처음 버튼 */}
                <button 
                  className="news_page_btn"
                  onClick={() => changePage(1)}
                  disabled={currentPage === 1 || loading}
                >
                  맨 처음
                </button>
                
                {/* 이전 버튼 */}
                <button 
                  className="news_page_btn"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  &lt;
                </button>
                
                {/* 페이지 번호들 */}
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                  const startPage = Math.max(1, Math.min(currentPage - 5, totalPages - 9));
                  const pageNum = startPage + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      className={`news_page_btn ${pageNum === currentPage ? 'active' : ''}`}
                      onClick={() => changePage(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {/* 다음 버튼 */}
                <button 
                  className="news_page_btn"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  &gt;
                </button>
                
                {/* 맨 끝 버튼 */}
                <button 
                  className="news_page_btn"
                  onClick={() => changePage(totalPages)}
                  disabled={currentPage === totalPages || loading}
                >
                  맨 끝
                </button>
              </div>
            )}
          </div>
        </div>
        {/* 우측 광고 */}
        <div className="main-side-ad">
          📢<br />우측<br />광고<br />영역<br />(160px)
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FactlabNewsFeed;