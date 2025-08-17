import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import '../styles/News.css';
import '../styles/Main.css';
import { newsApi } from '../services/api';
import { commentApi } from '../services/commentApi';
import { useAuth } from '../contexts/AuthContext';

const FactlabNewsDetail = () => {
  const [searchParams] = useSearchParams();
  const newsId = searchParams.get('id');
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState('');
  const [voteResults, setVoteResults] = useState(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  
  // 댓글 관련 상태 추가
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});
  const [showReplyBox, setShowReplyBox] = useState({});
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Auth context
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    const fetchNewsDetail = async () => {
      if (!newsId) {
        setError('뉴스 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await newsApi.getNewsById(newsId);
        setNewsData(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching news detail:', err);
        setError('뉴스를 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [newsId]);

  // 댓글 로드
  useEffect(() => {
    const fetchComments = async () => {
      if (!newsId) return;
      
      try {
        const commentsData = await commentApi.getComments(newsId);
        console.log('📝 댓글 데이터:', commentsData);
        console.log('👤 현재 사용자 ID:', user?.id);
        setComments(commentsData);
      } catch (error) {
        console.error('댓글 로드 오류:', error);
        // API 오류 시 빈 배열로 설정
        setComments([]);
      }
    };

    fetchComments();
  }, [newsId, user]);

  // 투표 결과 로드
  useEffect(() => {
    const fetchVoteData = async () => {
      if (!newsId) return;
      
      try {
        // 투표 결과 조회
        const voteData = await newsApi.getVoteResults(newsId);
        console.log('🗳️ 투표 결과 API 응답:', voteData);
        console.log('🗳️ voteData.data:', voteData.data);
        console.log('🗳️ voteData.data.data:', voteData.data.data);
        
        // Axios response structure: voteData.data contains API response, voteData.data.data contains actual vote results
        if (voteData.data.success && voteData.data.data) {
          setVoteResults(voteData.data.data);
        } else {
          console.error('투표 결과 데이터 구조 오류:', voteData.data);
          setVoteResults({
            fact: 0,
            partial_fact: 0,
            slight_doubt: 0,
            doubt: 0,
            unknown: 0,
            total: 0
          });
        }
        
        // 사용자가 로그인했다면 투표 여부 확인
        if (isLoggedIn && user?.id) {
          try {
            const userVoteData = await newsApi.checkUserVote(newsId, user.id);
            console.log('🔍 투표 확인 API 응답:', userVoteData);
            console.log('🔍 userVoteData.data:', userVoteData.data);
            console.log('🔍 userVoteData.data?.data:', userVoteData.data?.data);
            
            // Axios response structure: userVoteData.data contains the actual API response
            const apiResponse = userVoteData.data;
            if (apiResponse.success && apiResponse.data && apiResponse.data.voteType) {
              console.log('✅ 투표 이력 있음:', apiResponse.data.voteType);
              setHasVoted(true);
              setSelectedVote(apiResponse.data.voteType);
            } else {
              // 투표하지 않은 경우 (data가 null이거나 없음)
              console.log('❌ 투표 이력 없음');
              setHasVoted(false);
              setSelectedVote('');
            }
          } catch (error) {
            // API 오류 시 투표하지 않은 것으로 처리
            console.log('사용자 투표 기록 확인 오류:', error);
            setHasVoted(false);
            setSelectedVote('');
          }
        } else {
          // 로그인하지 않은 경우 투표 상태 초기화
          console.log('📱 로그인하지 않은 사용자');
          setHasVoted(false);
          setSelectedVote('');
        }
      } catch (error) {
        console.error('투표 데이터 로드 오류:', error);
        // 기본 투표 결과 설정
        setVoteResults({
          fact: 0,
          partial_fact: 0,
          slight_doubt: 0,
          doubt: 0,
          unknown: 0,
          total: 0
        });
      }
    };

    fetchVoteData();
  }, [newsId, isLoggedIn, user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 카테고리를 한글로 변환하는 함수
  const getCategoryName = (category) => {
    const categoryMap = {
      'politics': '정치',
      'economy': '경제',
      'society': '사회',
      'technology': 'IT/과학',
      'world': '세계',
      'environment': '기후/환경',
      'sports': '스포츠',
      'entertainment': '연예'
    };
    return categoryMap[category] || category;
  };

  // AI 분석 내용을 문장 단위로 분리하는 함수
  const formatAIAnalysis = (content) => {
    if (!content) return [];
    
    // 문장 단위로 분리 (마침표, 느낌표, 물음표 기준)
    const sentences = content.split(/(?<=[.!?])\s+/)
      .filter(sentence => sentence.trim().length > 0)
      .map(sentence => sentence.trim());
    
    return sentences;
  };


  const vote = async (voteType) => {
    // 로그인 체크
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    
    if (hasVoted) {
      alert('이미 투표하셨습니다.');
      return;
    }
    
    if (voteLoading) {
      return; // 이미 투표 중인 경우 중복 요청 방지
    }
    
    setVoteLoading(true);
    
    try {
      // 서버에 투표 전송
      await newsApi.voteNews(newsId, voteType, user.id);
      
      // 투표 결과 다시 조회
      const voteData = await newsApi.getVoteResults(newsId);
      console.log('🗳️ 투표 후 결과 업데이트:', voteData.data);
      
      // Axios response structure: voteData.data.data contains actual vote results
      if (voteData.data.success && voteData.data.data) {
        setVoteResults(voteData.data.data);
      }
      
      // 로컬 상태 업데이트
      setSelectedVote(voteType);
      setHasVoted(true);
      
      alert('투표가 완료되었습니다!');
    } catch (error) {
      console.error('투표 오류:', error);
      alert('투표 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setVoteLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('링크가 복사되었습니다.');
  };

  // 글자 수 계산 함수 (한글, 영문 모두 1글자로 계산)
  const getCharLength = (str) => {
    return str.length;
  };

  // 로그인 체크 및 댓글 작성
  const submitComment = () => {
    // 로그인 체크
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!commentText.trim()) {
      alert('댓글 내용을 입력하세요.');
      return;
    }

    if (getCharLength(commentText) > 1000) {
      alert('댓글은 1000자를 초과할 수 없습니다.');
      return;
    }

    if (commentLoading) {
      return; // 이미 댓글 작성 중인 경우 중복 요청 방지
    }

    // API 호출로 DB 저장
    const saveComment = async () => {
      setCommentLoading(true);
      try {
        const newComment = await commentApi.createComment(
          newsId, 
          commentText.trim(), 
          user.id
        );
        
        // 댓글 목록 새로고침
        const updatedComments = await commentApi.getComments(newsId);
        setComments(updatedComments);
        setCommentText('');
      } catch (error) {
        console.error('댓글 저장 오류:', error);
        alert('댓글 저장에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setCommentLoading(false);
      }
    };

    saveComment();
  };

  // 댓글 좋아요
  const likeComment = (commentId, isReply = false, parentId = null) => {
    if (isReply) {
      setComments(prev => prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === commentId 
                ? { ...reply, likes: reply.likes + 1 }
                : reply
            )
          };
        }
        return comment;
      }));
    } else {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes: comment.likes + 1 }
          : comment
      ));
    }
  };

  // 답글 보기 토글
  const toggleReplyBox = (commentId) => {
    setShowReplyBox(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // 로그인 체크 및 답글 작성
  const submitReply = (commentId) => {
    // 로그인 체크
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }

    const replyText = replyTexts[commentId];
    
    if (!replyText || !replyText.trim()) {
      alert('답글 내용을 입력하세요.');
      return;
    }

    if (getCharLength(replyText) > 1000) {
      alert('답글은 1000자를 초과할 수 없습니다.');
      return;
    }

    // API 호출로 DB 저장
    const saveReply = async () => {
      try {
        const newReply = await commentApi.createReply(
          newsId, 
          commentId, 
          replyText.trim(), 
          user.id
        );
        
        // 댓글 목록 새로고침
        const updatedComments = await commentApi.getComments(newsId);
        setComments(updatedComments);
        
        // 답글 텍스트 초기화 및 답글창 닫기
        setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
        setShowReplyBox(prev => ({ ...prev, [commentId]: false }));
      } catch (error) {
        console.error('답글 저장 오류:', error);
        alert('답글 저장에 실패했습니다. 다시 시도해주세요.');
      }
    };

    saveReply();
  };

  // 답글 텍스트 변경
  const handleReplyTextChange = (commentId, text) => {
    setReplyTexts(prev => ({
      ...prev,
      [commentId]: text
    }));
  };

  // 댓글 삭제
  const deleteComment = async (commentId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await commentApi.deleteComment(commentId, user.id);
      
      // 댓글 목록 새로고침
      const updatedComments = await commentApi.getComments(newsId);
      setComments(updatedComments);
      
      alert('댓글이 삭제되었습니다.');
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      alert('댓글 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const reportComment = (id) => {
    if (window.confirm('이 댓글을 신고하시겠습니까?')) {
      alert('신고가 접수되었습니다.');
    }
  };

  const loadMoreComments = () => {
    alert('댓글을 더 불러옵니다.');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="main-top-banner-ad">
          🎯 상단 배너 광고 영역 (1200px x 90px)
        </div>
        <div className="main-container">
          <div className="main-side-ad">📢<br />좌측<br />광고<br />영역<br />(160px)</div>
          <div className="main-content">
            <div className="loading">뉴스를 불러오는 중...</div>
          </div>
          <div className="main-side-ad">📢<br />우측<br />광고<br />영역<br />(160px)</div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !newsData) {
    return (
      <>
        <Header />
        <div className="main-top-banner-ad">
          🎯 상단 배너 광고 영역 (1200px x 90px)
        </div>
        <div className="main-container">
          <div className="main-side-ad">📢<br />좌측<br />광고<br />영역<br />(160px)</div>
          <div className="main-content">
            <div className="error">{error || '뉴스를 찾을 수 없습니다.'}</div>
          </div>
          <div className="main-side-ad">📢<br />우측<br />광고<br />영역<br />(160px)</div>
        </div>
        <Footer />
      </>
    );
  }

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
        {/* 메인 컨텐츠 - 좌우 분할 레이아웃 */}
        <div className="news-detail-container">
          {/* 좌측: 메인 콘텐츠 */}
          <div className="news-main-content">
            {/* News Header */}
            <div className="news_header">
              <div className="news_source">{newsData.source}</div>
              <h1 className="news_title">{newsData.title}</h1>
              
              {/* 썸네일 이미지 */}
              {newsData.thumbnail && (
                <div className="news-thumbnail" style={{ 
                  margin: '20px 0',
                  textAlign: 'center'
                }}>
                  <img 
                    src={newsData.thumbnail} 
                    alt="뉴스 썸네일"
                    style={{ 
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="news_meta">
                <div>{formatDate(newsData.publishDate)}</div>
                <div>
                  <a href="#" className="original_link" onClick={copyLink}>링크 복사</a>
                  <span style={{margin: '0 5px'}}></span>
                  <a href="#" className="original_link" onClick={(e) => {e.preventDefault(); window.open(newsData.url, '_blank');}}>
                    원문 보기 →
                  </a>
                </div>
              </div>
            </div>
            
            {/* News Content */}
            <div className="news_content">
              {/* Original Content */}
              <div className="content_section">
                <div className="section_title">📰 뉴스 AI요약</div>
                <div className="original_content">
                  {newsData.aiSummary ? (
                    formatAIAnalysis(newsData.aiSummary).map((sentence, index) => (
                      <p key={index} className="content-sentence">
                        {sentence}
                      </p>
                    ))
                  ) : (
                    <p className="content-sentence">AI 분석이 진행 중입니다...</p>
                  )}
                    <div className="metadata-info">
                      • 출처: {newsData.source}<br />
                      • 카테고리: {getCategoryName(newsData.category)}<br />
                    </div>
                  <div className="news-metadata">

                    {showFullContent && newsData.content.length > 300 && (
                      <div className="full-content">
                        {newsData.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* AI Analysis Results */}
              <div className="content_section">
                <div className="section_title">🤖 AI 핵심 주장 및 의심포인트</div>
                <div className="summary_content">
                  <strong>핵심 주장:</strong><br />
                  <div className="ai-claim">
                    {newsData.aiAnalysisResult || "AI가 핵심 주장을 분석 중입니다..."}
                  </div><br />
                  
                  <strong>의심 포인트:</strong><br />
                  <div className="ai-suspicious">
                    {newsData.suspiciousPoints ? (
                      newsData.suspiciousPoints.split('.').map((point, index) => 
                        point.trim() && (
                          <div key={index} className="suspicious-point">
                            • {point.trim()}
                          </div>
                        )
                      )
                    ) : (
                      <>
                        • 제시된 사실과 수치의 근거 부족<br />
                        • 정보 출처의 신뢰성<br />
                        • 추가적인 검증 자료의 필요성
                      </>
                    )}
                  </div>
                  
                  {newsData.aiKeywords && (
                    <div className="ai-keywords" style={{marginTop: '15px'}}>
                      <strong>주요 키워드:</strong><br />
                      {newsData.aiKeywords.split(',').map((keyword, index) => (
                        <span key={index} className="keyword-tag">#{keyword.trim()}</span>
                      ))}
                    </div>
                  )}
                  
                  {newsData.reliabilityScore && (
                    <div className="ai-reliability" style={{marginTop: '15px'}}>
                      <strong>신뢰도 점수:</strong> {newsData.reliabilityScore}/100점
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Voting Section */}
            <div className="voting_section">
              <div className="voting_title">💭 여러분의 의견을 들려주세요</div>
              
              {/* Fact Check Question */}
              <div className="content_section">
                <div className="fact_question">
                  🤔 이 뉴스 사실일까요? {newsData.title}
                </div>
              </div>

              <div className="vote_options">
                <div 
                  className={`vote_option fact ${selectedVote === 'fact' ? 'selected' : ''} ${(hasVoted && selectedVote !== 'fact') || voteLoading ? 'disabled' : ''}`}
                  onClick={() => !voteLoading && vote('fact')}
                >
                  ✅ 사실이다<br />
                  <small>제시된 내용 사실</small>
                </div>
                <div 
                  className={`vote_option partial_fact ${selectedVote === 'partial_fact' ? 'selected' : ''} ${(hasVoted && selectedVote !== 'partial_fact') || voteLoading ? 'disabled' : ''}`}
                  onClick={() => !voteLoading && vote('partial_fact')}
                >
                  🔸 부분적으로 사실<br />
                  <small>일부만 사실</small>
                </div>
                <div 
                  className={`vote_option slight_doubt ${selectedVote === 'slight_doubt' ? 'selected' : ''} ${(hasVoted && selectedVote !== 'slight_doubt') || voteLoading ? 'disabled' : ''}`}
                  onClick={() => !voteLoading && vote('slight_doubt')}
                >
                  🔹 조금 의심스럽다<br />
                  <small>일부 내용 거짓</small>
                </div>
                <div 
                  className={`vote_option doubt ${selectedVote === 'doubt' ? 'selected' : ''} ${(hasVoted && selectedVote !== 'doubt') || voteLoading ? 'disabled' : ''}`}
                  onClick={() => !voteLoading && vote('doubt')}
                >
                  ❌ 의심스럽다<br />
                  <small>내용이 거짓</small>
                </div>
                <div 
                  className={`vote_option unknown ${selectedVote === 'unknown' ? 'selected' : ''} ${(hasVoted && selectedVote !== 'unknown') || voteLoading ? 'disabled' : ''}`}
                  onClick={() => !voteLoading && vote('unknown')}
                >
                  ❓ 모르겠다<br />
                  <small>정보부족</small>
                </div>
              </div>
              
              {voteLoading && (
                <div style={{textAlign: 'center', marginTop: '10px', color: '#666'}}>
                  투표 중...
                </div>
              )}
              
              <div className="vote_results">
                {voteResults ? (
                  <>
                    <div className="result_item">
                      <span>✅ 사실이다</span>
                      <div className="result_bar_container">
                        <div className="result_bar result_fact" style={{
                          width: voteResults.total > 0 ? `${Math.round((voteResults.fact || 0) / voteResults.total * 100)}%` : '0%'
                        }}></div>
                      </div>
                      <span>{voteResults.fact || 0}표 ({voteResults.total > 0 ? Math.round((voteResults.fact || 0) / voteResults.total * 100) : 0}%)</span>
                    </div>
                    <div className="result_item">
                      <span>🔸 부분적으로 사실이다</span>
                      <div className="result_bar_container">
                        <div className="result_bar result_partial_fact" style={{
                          width: voteResults.total > 0 ? `${Math.round((voteResults.partial_fact || 0) / voteResults.total * 100)}%` : '0%'
                        }}></div>
                      </div>
                      <span>{voteResults.partial_fact || 0}표 ({voteResults.total > 0 ? Math.round((voteResults.partial_fact || 0) / voteResults.total * 100) : 0}%)</span>
                    </div>
                    <div className="result_item">
                      <span>🔹 조금 의심스럽다</span>
                      <div className="result_bar_container">
                        <div className="result_bar result_slight_doubt" style={{
                          width: voteResults.total > 0 ? `${Math.round((voteResults.slight_doubt || 0) / voteResults.total * 100)}%` : '0%'
                        }}></div>
                      </div>
                      <span>{voteResults.slight_doubt || 0}표 ({voteResults.total > 0 ? Math.round((voteResults.slight_doubt || 0) / voteResults.total * 100) : 0}%)</span>
                    </div>
                    <div className="result_item">
                      <span>❌ 의심스럽다</span>
                      <div className="result_bar_container">
                        <div className="result_bar result_doubt" style={{
                          width: voteResults.total > 0 ? `${Math.round((voteResults.doubt || 0) / voteResults.total * 100)}%` : '0%'
                        }}></div>
                      </div>
                      <span>{voteResults.doubt || 0}표 ({voteResults.total > 0 ? Math.round((voteResults.doubt || 0) / voteResults.total * 100) : 0}%)</span>
                    </div>
                    <div className="result_item">
                      <span>❓ 모르겠다</span>
                      <div className="result_bar_container">
                        <div className="result_bar result_unknown" style={{
                          width: voteResults.total > 0 ? `${Math.round((voteResults.unknown || 0) / voteResults.total * 100)}%` : '0%'
                        }}></div>
                      </div>
                      <span>{voteResults.unknown || 0}표 ({voteResults.total > 0 ? Math.round((voteResults.unknown || 0) / voteResults.total * 100) : 0}%)</span>
                    </div>
                    <div style={{textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#666'}}>
                      총 {voteResults.total || 0}명 참여
                    </div>
                  </>
                ) : (
                  <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                    투표 결과를 불러오는 중...
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="navigation">
              <a href="/news_feed" className="btn">뉴스 목록</a>
            </div>
          </div>

          {/* 우측: 댓글 섹션 */}
          <div className="news-sidebar">
            <div className="comments_section">
              <div className="comments_header">💬 토론 및 댓글 ({comments.length + comments.reduce((acc, comment) => acc + comment.replies.length, 0)}개)</div>
              
              {/* Comment Write */}
              <div className="comment_write">
                <textarea 
                  className="comment_textarea" 
                  placeholder="이 뉴스에 대한 의견을 남겨주세요..."
                  value={commentText}
                  onChange={(e) => {
                    if (e.target.value.length > 1000) {
                      alert('댓글은 1000자를 초과할 수 없습니다.');
                      return;
                    }
                    setCommentText(e.target.value);
                  }}
                  maxLength={1000}
                ></textarea>
                <div className="comment_submit">
                  <div className="comment_char_counter">
                    {getCharLength(commentText)}/1000자
                  </div>
                  <button 
                    className="comment_submit_btn btn-primary" 
                    onClick={submitComment}
                    disabled={commentLoading}
                  >
                    {commentLoading ? '작성 중...' : '댓글 작성'}
                  </button>
                </div>
              </div>
              
              {/* Comments List */}
              {comments.map((comment) => (
                <div key={comment.id} className="comment_item">
                  <div className="comment_header">
                    <span className="comment_author">{comment.author}</span>
                    <span className="comment_date">{comment.date}</span>
                  </div>
                  <div className="comment_content">
                    {comment.content}
                  </div>
                  <div className="comment_actions">
                    <a href="#" onClick={(e) => {e.preventDefault(); likeComment(comment.id);}}>👍 {comment.likes}</a>
                    <a href="#" onClick={(e) => {e.preventDefault(); toggleReplyBox(comment.id);}}>답글</a>
                    <a href="#" onClick={(e) => {e.preventDefault(); reportComment(comment.id);}}>신고</a>
                    {(() => {
                      const showDelete = isLoggedIn && user?.id === comment.userId;
                      console.log(`🔍 댓글 ${comment.id} 삭제 버튼:`, {
                        isLoggedIn,
                        userId: user?.id,
                        commentUserId: comment.userId,
                        showDelete
                      });
                      return showDelete && (
                        <a href="#" onClick={(e) => {e.preventDefault(); deleteComment(comment.id);}} style={{color: '#dc3545'}}>삭제</a>
                      );
                    })()}
                  </div>
                  
                  {/* Reply Box */}
                  {showReplyBox[comment.id] && (
                    <div className="reply_write">
                      <textarea 
                        className="reply_textarea" 
                        placeholder="답글을 입력하세요..."
                        value={replyTexts[comment.id] || ''}
                        onChange={(e) => {
                          if (e.target.value.length > 1000) {
                            alert('답글은 1000자를 초과할 수 없습니다.');
                            return;
                          }
                          handleReplyTextChange(comment.id, e.target.value);
                        }}
                        maxLength={1000}
                      ></textarea>
                      <div className="reply_submit">
                        <div className="reply_char_counter">
                          {getCharLength(replyTexts[comment.id] || '')}/1000자
                        </div>
                        <button className="reply_submit_btn btn-primary" onClick={() => submitReply(comment.id)}>
                          답글 작성
                        </button>
                        <button className="reply_cancel_btn btn" onClick={() => toggleReplyBox(comment.id)}>
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Replies */}
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="reply_item">
                      <div className="comment_header">
                        <span className="comment_author">{reply.author}</span>
                        <span className="comment_date">{reply.date}</span>
                      </div>
                      <div className="comment_content">
                        {reply.content}
                      </div>
                      <div className="comment_actions">
                        <a href="#" onClick={(e) => {e.preventDefault(); likeComment(reply.id, true, comment.id);}}>👍 {reply.likes}</a>
                        <a href="#" onClick={(e) => {e.preventDefault(); reportComment(reply.id);}}>신고</a>
                        {isLoggedIn && user?.id === reply.userId && (
                          <a href="#" onClick={(e) => {e.preventDefault(); deleteComment(reply.id);}} style={{color: '#dc3545'}}>삭제</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              
              <div style={{textAlign: 'center', marginTop: '15px'}}>
                <button className="btn" onClick={loadMoreComments}>댓글 더보기</button>
              </div>
            </div>

          </div>
        </div>
        {/* 우측 광고 */}
        <div className="main-side-ad">
          📢<br />우측<br />광고<br />영역<br />(160px)
        </div>
      </div>
      <Footer />
      
      {/* 로그인 모달 */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
};

export default FactlabNewsDetail;