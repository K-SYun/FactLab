import React, { useState, useEffect, useRef } from 'react';
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

  // 조회수 증가 중복 호출 방지를 위한 ref
  const viewCountIncreasedRef = useRef(false);

  useEffect(() => {
    // 새로운 뉴스 ID일 때마다 ref 초기화
    viewCountIncreasedRef.current = false;

    const fetchNewsDetail = async () => {
      if (!newsId || newsId === 'null' || newsId === null) {
        console.error('Invalid newsId:', newsId);
        setError('뉴스 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 조회수 증가 (한 번만 실행되도록 ref 사용)
        if (!viewCountIncreasedRef.current) {
          try {
            await newsApi.increaseViewCount(newsId);
            viewCountIncreasedRef.current = true;
          } catch (viewError) {
            console.error('조회수 증가 실패:', viewError);
          }
        }

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
      if (!newsId || newsId === 'null' || newsId === null) return;

      try {
        const commentsData = await commentApi.getComments(newsId);
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
      if (!newsId || newsId === 'null' || newsId === null) return;

      try {
        // 투표 결과 조회
        const voteData = await newsApi.getVoteResults(newsId);

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

            // Axios response structure: userVoteData.data contains the actual API response
            const apiResponse = userVoteData.data;
            if (apiResponse.success && apiResponse.data && apiResponse.data.voteType) {
              setHasVoted(true);
              setSelectedVote(apiResponse.data.voteType);
            } else {
              // 투표하지 않은 경우 (data가 null이거나 없음)
              setHasVoted(false);
              setSelectedVote('');
            }
          } catch (error) {
            // API 오류 시 투표하지 않은 것으로 처리
            setHasVoted(false);
            setSelectedVote('');
          }
        } else {
          // 로그인하지 않은 경우 투표 상태 초기화
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
    return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

  // Analysis type을 한글로 변환하는 함수
  const getAnalysisTypeLabel = (analysisType) => {
    const typeMap = {
      'COMPREHENSIVE': '[AI분석:종합]',
      'FACT_ANALYSIS': '[AI분석:사실]',
      'BIAS_ANALYSIS': '[AI분석:편향]'
    };
    return typeMap[analysisType] || '';
  };

  // 분석 타입에 따른 질문 생성
  const getQuestionByAnalysisType = (analysisType, title) => {
    switch (analysisType) {
      case 'FACT_ANALYSIS':
        return `🤔 이 뉴스 사실일까요? ${title}`;
      case 'BIAS_ANALYSIS':
        return `🎯 이 뉴스의 편향성은 어떻게 생각하시나요? ${title}`;
      case 'COMPREHENSIVE':
        return `🔍 이 뉴스의 신뢰도는 어떻게 생각하시나요? ${title}`;
      default:
        return `🤔 이 뉴스 사실일까요? ${title}`;
    }
  };

  // 분석 타입에 따른 투표 옵션 생성
  const getVoteOptionsByAnalysisType = (analysisType) => {
    switch (analysisType) {
      case 'FACT_ANALYSIS':
        return [
          { key: 'completely_true', label: '완전 사실', sublabel: '제시된 내용 모두 사실', emoji: '✅' },
          { key: 'partially_true', label: '부분적으로 사실', sublabel: '일부만 사실', emoji: '🔸' },
          { key: 'slightly_doubtful', label: '조금 의심스럽다', sublabel: '일부 내용 의심', emoji: '🔹' },
          { key: 'completely_doubtful', label: '완전 의심', sublabel: '대부분 거짓', emoji: '❌' },
          { key: 'unknown', label: '모르겠다', sublabel: '판단하기 어려움', emoji: '❓' }
        ];
      case 'BIAS_ANALYSIS':
        return [
          { key: 'right_bias', label: '우편향(보수 우파)', sublabel: '보수적 관점 편향', emoji: '➡️' },
          { key: 'slight_right', label: '일부 우편향', sublabel: '약간 보수적', emoji: '🔸' },
          { key: 'slight_left', label: '일부 좌편향', sublabel: '약간 진보적', emoji: '🔹' },
          { key: 'left_bias', label: '좌편향(진보 좌파)', sublabel: '진보적 관점 편향', emoji: '⬅️' },
          { key: 'unknown', label: '잘 모르겠다', sublabel: '편향성 판단 어려움', emoji: '❓' }
        ];
      case 'COMPREHENSIVE':
        return [
          { key: 'reliable_neutral', label: '신뢰보도', sublabel: '사실적이고 중립적', emoji: '✅' },
          { key: 'reliable_right', label: '신뢰+우편향', sublabel: '사실적이나 우편향', emoji: '🔸' },
          { key: 'reliable_left', label: '신뢰+좌편향', sublabel: '사실적이나 좌편향', emoji: '🔹' },
          { key: 'problematic', label: '문제있음', sublabel: '사실성이나 편향성 문제', emoji: '❌' },
          { key: 'unknown', label: '모르겠음(판단유보)', sublabel: '종합적 판단 어려움', emoji: '❓' }
        ];
      default:
        return [
          { key: 'fact', label: '모두 사실', sublabel: '제시된 내용 사실', emoji: '✅' },
          { key: 'partial_fact', label: '부분적으로 사실', sublabel: '일부만 사실', emoji: '🔸' },
          { key: 'slight_doubt', label: '조금 의심스럽다', sublabel: '일부 내용 거짓', emoji: '🔹' },
          { key: 'doubt', label: '모두 의심', sublabel: '내용이 거짓', emoji: '❌' },
          { key: 'unknown', label: '모르겠다', sublabel: '정보부족', emoji: '❓' }
        ];
    }
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
    // newsId 유효성 체크
    if (!newsId || newsId === 'null' || newsId === null) {
      console.error('Invalid newsId for voting:', newsId);
      alert('뉴스 정보가 올바르지 않습니다.');
      return;
    }

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

  const copyLink = (e) => {
    e.preventDefault(); // 기본 링크 동작 방지
    navigator.clipboard.writeText(window.location.href);
    alert('링크가 복사되었습니다.');
  };

  // 글자 수 계산 함수 (한글, 영문 모두 1글자로 계산)
  const getCharLength = (str) => {
    return str.length;
  };

  // 로그인 체크 및 댓글 작성
  const submitComment = () => {
    // newsId 유효성 체크
    if (!newsId || newsId === 'null' || newsId === null) {
      console.error('Invalid newsId for comment:', newsId);
      alert('뉴스 정보가 올바르지 않습니다.');
      return;
    }

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
  const likeComment = async (commentId, isReply = false, parentId = null) => {
    // 로그인 체크
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      // API 호출
      await commentApi.likeComment(commentId, user?.id, newsId);

      // 로컬 상태 업데이트
      if (isReply) {
        setComments(prev => prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? { ...reply, likeCount: (reply.likeCount || 0) + 1 }
                  : reply
              )
            };
          }
          return comment;
        }));
      } else {
        setComments(prev => prev.map(comment =>
          comment.id === commentId
            ? { ...comment, likeCount: (comment.likeCount || 0) + 1 }
            : comment
        ));
      }
    } catch (error) {
      console.error('댓글 좋아요 오류:', error);
      alert('좋아요 처리에 실패했습니다.');
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
    // 해당 댓글의 답글 개수 확인
    const comment = comments.find(c => c.id === commentId);
    const hasReplies = comment && comment.replies && comment.replies.length > 0;

    const confirmMessage = hasReplies
      ? '이 댓글에 답글이 있습니다. 삭제하면 "작성자에 의해 글이 삭제되었습니다."로 표시됩니다. 계속하시겠습니까?'
      : '이 댓글을 삭제하시겠습니까?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await commentApi.deleteComment(commentId, user.id, newsId);

      if (hasReplies) {
        // 답글이 있는 경우: 로컬에서 삭제 표시로 변경
        setComments(prev => prev.map(c =>
          c.id === commentId
            ? {
              ...c,
              content: '작성자에 의해 글이 삭제되었습니다.',
              author: '삭제된 사용자',
              isDeleted: true
            }
            : c
        ));
      } else {
        // 답글이 없는 경우: 댓글 목록에서 제거
        setComments(prev => prev.filter(c => c.id !== commentId));
      }

      alert('댓글이 삭제되었습니다.');
    } catch (error) {
      console.error('댓글 삭제 오류:', error);

      // 백엔드 User 연관관계 오류인 경우 더 구체적인 메시지
      if (error.message && error.message.includes('User.getId()')) {
        alert('댓글 삭제 중 서버 오류가 발생했습니다. 관리자에게 문의해주세요.');
      } else {
        alert('댓글 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const reportComment = (id) => {
    // 로그인 체크
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }

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
          <div className="main-side-ad"></div>
          <div className="main-content">
            <div className="loading">뉴스를 불러오는 중...</div>
          </div>
          <div className="main-side-ad"></div>
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
          <div className="main-side-ad"></div>
          <div className="main-content">
            <div className="error">{error || '뉴스를 찾을 수 없습니다.'}</div>
          </div>
          <div className="main-side-ad"></div>
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
        <div className="main-side-ad"></div>
        {/* 메인 컨텐츠 - 좌우 분할 레이아웃 */}
        <div className="news-detail-container">
          {/* 좌측: 메인 콘텐츠 */}
          <div className="news-main-content">
            {/* News Header */}
            <div className="news_header">
              <h1 className="news_title">
                <span className="analysis-type-label">{getAnalysisTypeLabel(newsData.analysisType)}</span> {newsData.title}
              </h1>

              {/* 썸네일 이미지 */}
              {newsData.thumbnail && (
                <div className="news-thumbnail news-thumbnail-container">
                  <img
                    src={newsData.thumbnail}
                    alt="뉴스 썸네일"
                    className="news-thumbnail-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="news_meta">
                <div>{newsData.source} | {getCategoryName(newsData.category)} | {formatDate(newsData.publishDate)} | 👀 {newsData.viewCount || 0}</div>
                <div>
                  <a href="#" className="original_link" onClick={copyLink}>링크 복사</a>
                  <span className="news-meta-separator"></span>
                  <a href="#" className="original_link" onClick={(e) => { e.preventDefault(); window.open(newsData.url, '_blank'); }}>
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
                    <div className="ai-keywords news-ai-keywords">
                      <strong>주요 키워드:</strong><br />
                      {newsData.aiKeywords.split(',').map((keyword, index) => (
                        <span key={index} className="keyword-tag">#{keyword.trim()}</span>
                      ))}
                    </div>
                  )}

                  {newsData.reliabilityScore && (
                    <div className="ai-reliability news-ai-reliability">
                      <strong>신뢰도 점수:</strong> {newsData.reliabilityScore}/100점
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Voting Section */}
            <div className="voting_section">
              <div className="voting_title">💭 여러분의 의견을 들려주세요</div>

              {/* Dynamic Question based on Analysis Type */}
              <div className="content_section">
                <div className="fact_question">
                  {getQuestionByAnalysisType(newsData.analysisType, newsData.title)}
                </div>
              </div>

              <div className="vote_options">
                {getVoteOptionsByAnalysisType(newsData.analysisType).map((option) => (
                  <div
                    key={option.key}
                    className={`vote_option ${option.key} ${selectedVote === option.key ? 'selected' : ''} ${(hasVoted && selectedVote !== option.key) || voteLoading ? 'disabled' : ''}`}
                    onClick={() => !voteLoading && vote(option.key)}
                  >
                    {option.emoji} {option.label}<br />
                    <small>{option.sublabel}</small>
                  </div>
                ))}
              </div>

              {voteLoading && (
                <div className="news-vote-loading">
                  투표 중...
                </div>
              )}

              <div className="vote_results">
                {voteResults ? (
                  <>
                    {getVoteOptionsByAnalysisType(newsData.analysisType).map((option) => {
                      const count = voteResults[option.key] || 0;
                      const percentage = voteResults.total > 0 ? Math.round(count / voteResults.total * 100) : 0;

                      return (
                        <div key={option.key} className="result_item">
                          <span>{option.emoji} {option.label}</span>
                          <div className="result_bar_container">
                            <div
                              className={`result_bar result_${option.key}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span>{count}표 ({percentage}%)</span>
                        </div>
                      );
                    })}
                    <div className="news-vote-total-count">
                      총 {voteResults.total || 0}명 참여
                    </div>
                  </>
                ) : (
                  <div className="news-vote-results-loading">
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
                  <div className={`comment_content ${comment.isDeleted ? 'news-comment-deleted' : ''}`}>
                    {comment.content}
                  </div>
                  {!comment.isDeleted && (
                    <div className="comment_actions">
                      {/* 본인이 작성한 댓글만 비활성화, 미로그인은 클릭 가능 */}
                      {isLoggedIn && user?.id === comment.userId ? (
                        <span className="news-comment-like-disabled">👍 추천 {comment.likeCount || 0}</span>
                      ) : (
                        <a href="#" onClick={(e) => { e.preventDefault(); likeComment(comment.id); }}>👍 추천 {comment.likeCount || 0}</a>
                      )}

                      {isLoggedIn ? (
                        <a href="#" onClick={(e) => { e.preventDefault(); toggleReplyBox(comment.id); }}>답글</a>
                      ) : (
                        <a href="#" onClick={(e) => { e.preventDefault(); setIsLoginModalOpen(true); }}>답글</a>
                      )}

                      <a href="#" onClick={(e) => { e.preventDefault(); reportComment(comment.id); }}>신고</a>

                      {(() => {
                        const showDelete = isLoggedIn && user?.id === comment.userId;
                        return showDelete && (
                          <a href="#" onClick={(e) => { e.preventDefault(); deleteComment(comment.id); }} className="news-comment-delete">삭제</a>
                        );
                      })()}
                    </div>
                  )}

                  {/* Reply Box */}
                  {!comment.isDeleted && showReplyBox[comment.id] && (
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
                      <div className="reply_submit news-reply-submit-container">
                        <div className="reply_char_counter">
                          {getCharLength(replyTexts[comment.id] || '')}/1000자
                        </div>
                        <div className="news-reply-button-group">
                          <button className="news-btn news-btn-primary" onClick={() => submitReply(comment.id)}>
                            저장
                          </button>
                          <button className="news-btn" onClick={() => toggleReplyBox(comment.id)}>
                            취소
                          </button>
                        </div>
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
                        {/* 본인이 작성한 댓글만 비활성화, 미로그인은 클릭 가능 */}
                        {isLoggedIn && user?.id === reply.userId ? (
                          <span className="news-comment-like-disabled">👍 추천 {reply.likeCount || 0}</span>
                        ) : (
                          <a href="#" onClick={(e) => { e.preventDefault(); likeComment(reply.id, true, comment.id); }}>👍 추천 {reply.likeCount || 0}</a>
                        )}

                        <a href="#" onClick={(e) => { e.preventDefault(); reportComment(reply.id); }}>신고</a>

                        {isLoggedIn && user?.id === reply.userId && (
                          <a href="#" onClick={(e) => { e.preventDefault(); deleteComment(reply.id); }} className="news-comment-delete">삭제</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <div className="news-comments-load-more">
                <button className="btn" onClick={loadMoreComments}>댓글 더보기</button>
              </div>
            </div>

          </div>
        </div>
        {/* 우측 광고 */}
        <div className="main-side-ad"></div>
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