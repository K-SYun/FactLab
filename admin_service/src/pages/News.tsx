import React, { useState, useEffect, useRef } from 'react';
import StatusBadge from '../components/common/StatusBadge';
import { NEWS_STATUS_LABELS, NEWS_CATEGORY_LABELS } from '../services/newsApi';
import { newsApi } from '../services/api'; // 실제 백엔드 API 추가
import Pagination from '../components/common/Pagination';
import '../styles/Pagination.css';
import '../styles/News.css';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  url: string;
  source: string;
  publisher: string;
  category: string;
  publishDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft' | 'ai_completed' | 'review_pending' | 'processing';
  thumbnail?: string;  // 썸네일 이미지 URL
  aiSummary: string;
  aiKeywords: string[];
  reliabilityScore: number;
  confidenceScore: number;
  analysisType?: 'COMPREHENSIVE' | 'FACT_ANALYSIS' | 'BIAS_ANALYSIS'; // AI 분석 타입
  aiAnalysisResult: {
    summary: string;
    keywords: string[];
    sentiment: string;
    factCheck: string;
    reliability: number;
  };
  detailedAnalysis?: any; // 상세 AI 분석 결과 (JSON)
  suspiciousPoints?: string; // 의심 포인트
  comments: number;
  votes: { fact: number; doubt: number };
  createdAt: string;
  updatedAt: string;
  rejectReason?: string;
  isVisible?: boolean; // 사용자 화면 노출 여부
  mainFeatured?: boolean; // 메인 실시간 이슈 노출 여부
  mainDisplayOrder?: number; // 메인 노출 순서
  featuredAt?: string; // 메인 노출 설정 시간
}


// 분석 타입을 한글로 변환하는 함수
const getAnalysisTypeLabel = (analysisType?: string): string => {
  switch (analysisType?.toUpperCase()) {
    case 'COMPREHENSIVE':
      return '종합';
    case 'FACT_ANALYSIS':
      return '사실';
    case 'BIAS_ANALYSIS':
      return '편향';
    default:
      return '종합';
  }
};

const News: React.FC = () => {
  const [mainTab, setMainTab] = useState<'news_management' | 'main_featured'>('news_management');
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // 분야별 필터링
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [allNewsData, setAllNewsData] = useState<NewsItem[]>([]); // 필터링 전 전체 데이터
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedNewsIds, setSelectedNewsIds] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

  // 메인 실시간 이슈 관리용 상태
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);
  const [approvedNews, setApprovedNews] = useState<NewsItem[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [selectedCategoryForMain, setSelectedCategoryForMain] = useState<string>('all'); // 메인 추가용 카테고리 필터

  // 환경에 따라 백엔드 API 경로 설정하는 공통 함수
  const getBackendApiBase = () => {
    return window.location.port === '80' || window.location.port === '' ? '/api' : 'http://localhost/api';
  };

  // 뉴스 데이터 가져오기
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        // 실제 백엔드에서 뉴스 데이터 가져오기
        const success = await refreshNewsData();

        // 연결 실패 시에만 오류 표시 (빈 데이터는 정상)
        if (!success) {
          setError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
          setAllNewsData([]);
        }

      } catch (err: any) {
        console.error('뉴스 데이터 가져오기 실패:', err);
        setError('뉴스 데이터를 가져오는데 실패했습니다: ' + (err.message || err));
        setAllNewsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // 메인 탭이 변경될 때마다 데이터 로드
  useEffect(() => {
    if (mainTab === 'main_featured') {
      loadMainFeaturedData();
    }
  }, [mainTab]);

  // 선택된 탭과 카테고리에 따른 필터링 (데이터 업데이트는 페이지 리셋 없음)
  useEffect(() => {
    // News 화면에서는 AI 분석이 완료된 뉴스만 표시 (크롤링만 된 뉴스는 제외)
    // AI 분석 완료 = review_pending, approved, rejected, processing 상태만
    const newsForReview = allNewsData.filter(news =>
      news.status === 'review_pending' ||
      news.status === 'approved' ||
      news.status === 'rejected' ||
      news.status === 'processing'
    );

    // 상태별 필터링
    const statusMap: { [key: string]: string[] } = {
      'pending': ['review_pending', 'processing'], // AI 분석 완료된 뉴스와 처리 중인 뉴스만 승인 대기에 포함
      'approved': ['approved'],
      'rejected': ['rejected']
    };
    const targetStatuses = statusMap[selectedTab];
    let filteredNews = newsForReview.filter(news => targetStatuses.includes(news.status));

    // 카테고리별 필터링
    if (selectedCategory !== 'all') {
      filteredNews = filteredNews.filter(news => news.category === selectedCategory);
    }

    setNewsItems(filteredNews);
  }, [selectedTab, selectedCategory, allNewsData]);

  // 이전 값을 추적하기 위한 ref
  const prevSelectedTabRef = useRef(selectedTab);
  const prevSelectedCategoryRef = useRef(selectedCategory);

  // 탭이나 카테고리 변경 시에만 페이지 리셋
  useEffect(() => {
    if (selectedTab !== prevSelectedTabRef.current || selectedCategory !== prevSelectedCategoryRef.current) {
      console.log(`Tab/Category changed: ${prevSelectedTabRef.current}→${selectedTab}, ${prevSelectedCategoryRef.current}→${selectedCategory}`);
      setCurrentPage(1);
      prevSelectedTabRef.current = selectedTab;
      prevSelectedCategoryRef.current = selectedCategory;
    }
  }, [selectedTab, selectedCategory]);

  // 체크박스 토글
  const toggleSelectNews = (newsId: number) => {
    setSelectedNewsIds(prev =>
      prev.includes(newsId)
        ? prev.filter(id => id !== newsId)
        : [...prev, newsId]
    );
  };

  // 대기중인 뉴스 전체 선택
  const selectAllPendingNews = () => {
    const pendingNewsIds = newsItems
      .filter(news => news.status === 'review_pending')
      .map(news => news.id);
    setSelectedNewsIds(pendingNewsIds);
  };

  // 데이터 새로고침 함수 - AI 분석 완료된 뉴스만 가져오기
  const refreshNewsData = async () => {
    try {
      // News.status가 REVIEW_PENDING, APPROVED, REJECTED인 뉴스만 가져오기 (AI 분석 완료된 뉴스)
      let allNews: any[] = [];

      for (let page = 0; page < 10; page++) {
        // 뉴스 관리 화면에서는 AI 분석 완료된 뉴스만 가져오기
        const response = await fetch(`${getBackendApiBase()}/news?page=${page}&size=100&status=review_pending,approved,rejected`);
        const result = await response.json();
        if (result.success && result.data) {
          const pageNews = Array.isArray(result.data) ? result.data : (result.data as any)?.content || [];
          if (pageNews.length === 0) break;

          // 각 뉴스에 대해 AI 분석 결과 가져오기
          const newsWithAnalysisData = await Promise.all(
            pageNews.map(async (news: any) => {
              try {
                const summaryResponse = await fetch(`${getBackendApiBase()}/news-summary/news/${news.id}`);
                const summaryResult = await summaryResponse.json();

                // AI 분석 결과가 있으면 포함, 없어도 뉴스는 표시 (REVIEW_PENDING 상태이므로)
                if (summaryResult.success && summaryResult.data) {
                  return {
                    ...news,
                    aiSummary: summaryResult.data.summary || '요약 정보 없음',
                    aiKeywords: summaryResult.data.keywords ? summaryResult.data.keywords.split(',') : [],
                    reliabilityScore: summaryResult.data.reliabilityScore || 0,
                    analysisType: summaryResult.data.analysisType || 'COMPREHENSIVE'
                  };
                } else {
                  // AI 분석 결과가 없어도 뉴스는 포함 (기본값으로 설정)
                  return {
                    ...news,
                    aiSummary: 'AI 분석 결과 없음',
                    aiKeywords: [],
                    reliabilityScore: 0,
                    analysisType: 'COMPREHENSIVE'
                  };
                }
              } catch (err) {
                console.warn(`뉴스 ${news.id} 분석 결과 가져오기 실패:`, err);
                // 에러가 있어도 뉴스는 포함 (기본값으로 설정)
                return {
                  ...news,
                  aiSummary: 'AI 분석 결과 가져오기 실패',
                  aiKeywords: [],
                  reliabilityScore: 0,
                  analysisType: 'COMPREHENSIVE'
                };
              }
            })
          );

          allNews = [...allNews, ...newsWithAnalysisData];

          if (pageNews.length < 100) break;
        } else {
          break;
        }
      }

      if (allNews.length > 0) {
        const convertedNews: NewsItem[] = allNews.map((news: any) => ({
          id: news.id,
          title: news.title || '제목 없음',
          content: news.content || '',
          url: news.url || '',
          source: news.source || '알 수 없음',
          publisher: news.publisher || news.source || '알 수 없음',
          category: news.category || 'others',
          publishDate: news.publishDate || new Date().toISOString(),
          status: (news.status || 'pending') as NewsItem['status'],
          thumbnail: news.thumbnail,  // 썸네일 필드 추가
          aiSummary: news.aiSummary || '요약 정보 없음',
          aiKeywords: Array.isArray(news.aiKeywords) ? news.aiKeywords :
            (typeof news.aiKeywords === 'string' && news.aiKeywords ?
              news.aiKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0) : []),
          reliabilityScore: typeof news.reliabilityScore === 'number' ? news.reliabilityScore : 0,
          confidenceScore: typeof news.confidenceScore === 'number' ? news.confidenceScore : 0,
          aiAnalysisResult: {
            summary: news.aiSummary || '요약 정보 없음',
            keywords: Array.isArray(news.aiKeywords) ? news.aiKeywords :
              (typeof news.aiKeywords === 'string' && news.aiKeywords ?
                news.aiKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0) : []),
            sentiment: news.sentiment || '중립',
            factCheck: news.factCheck || '검증 필요',
            reliability: typeof news.reliabilityScore === 'number' ? news.reliabilityScore : 0
          },
          detailedAnalysis: (() => {
            if (news.detailedAnalysis && typeof news.detailedAnalysis === 'string') {
              try {
                return JSON.parse(news.detailedAnalysis);
              } catch (error) {
                console.error('Error parsing detailedAnalysis JSON:', error);
                return null;
              }
            }
            return news.detailedAnalysis || null;
          })(),
          suspiciousPoints: news.suspiciousPoints || null,
          comments: typeof news.comments === 'number' ? news.comments : 0,
          votes: {
            fact: typeof news.votes?.fact === 'number' ? news.votes.fact : 0,
            doubt: typeof news.votes?.doubt === 'number' ? news.votes.doubt : 0
          },
          createdAt: news.createdAt || news.publishDate || new Date().toISOString(),
          updatedAt: news.updatedAt || news.publishDate || new Date().toISOString(),
          rejectReason: news.rejectReason,
          isVisible: news.isVisible !== undefined ? news.isVisible : true, // 기본값: 노출
          analysisType: news.analysisType as NewsItem['analysisType'] // AI 분석 타입 추가
        }));

        setAllNewsData(convertedNews);
        return true;
      } else {
        setAllNewsData([]);
        return true;
      }
    } catch (error) {
      console.error('❌ 뉴스 데이터 새로고침 실패:', error);
      return false;
    }
  };

  // 개별 뉴스 승인
  const handleApprove = async (newsId: number) => {
    try {
      setActionLoading(true);

      // 실제 백엔드 API 호출로 뉴스 승인
      const result = await newsApi.approveNews(newsId);

      if (result.success) {
        // 백엔드에서 최신 데이터 다시 불러오기
        await refreshNewsData();
        alert('뉴스가 승인되었습니다.');
      } else {
        throw new Error('승인 실패');
      }
    } catch (err: any) {
      alert('승인 중 오류가 발생했습니다: ' + (err.message || err));
      console.error('Error approving news:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 개별 뉴스 거부
  const handleReject = async (newsId: number) => {
    const reason = prompt('거부 사유를 입력해주세요:');
    if (reason === null) return; // 취소한 경우

    try {
      setActionLoading(true);

      // 실제 백엔드 API 호출로 뉴스 거부
      const result = await newsApi.rejectNews(newsId);

      if (result.success) {
        // 백엔드에서 최신 데이터 다시 불러오기
        await refreshNewsData();
        alert('뉴스가 거부되었습니다.');
      } else {
        throw new Error('거부 실패');
      }
    } catch (err: any) {
      alert('거부 중 오류가 발생했습니다: ' + (err.message || err));
      console.error('Error rejecting news:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 전체 승인
  const handleApproveAll = async () => {
    if (selectedNewsIds.length === 0) {
      alert('선택된 뉴스가 없습니다.');
      return;
    }

    if (!window.confirm(`선택된 ${selectedNewsIds.length}개의 뉴스를 모두 승인하시겠습니까?`)) {
      return;
    }

    try {
      setActionLoading(true);

      // 실제 백엔드 API 호출로 일괄 승인
      const result = await newsApi.bulkApproveNews(selectedNewsIds);

      if (result.success) {
        // 백엔드에서 최신 데이터 다시 불러오기
        await refreshNewsData();
        alert(`${selectedNewsIds.length}개의 뉴스가 승인되었습니다.`);
        setSelectedNewsIds([]);
        setIsSelectMode(false);
      } else {
        throw new Error('일괄 승인 실패');
      }
    } catch (err: any) {
      alert('전체 승인 중 오류가 발생했습니다: ' + (err.message || err));
      console.error('Error approving multiple news:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 전체 거부
  const handleRejectAll = async () => {
    if (selectedNewsIds.length === 0) {
      alert('선택된 뉴스가 없습니다.');
      return;
    }

    const reason = prompt('거부 사유를 입력해주세요:');
    if (reason === null) return;

    if (!window.confirm(`선택된 ${selectedNewsIds.length}개의 뉴스를 모두 거부하시겠습니까?`)) {
      return;
    }

    try {
      setActionLoading(true);

      // 실제 백엔드 API 호출로 일괄 거부
      const result = await newsApi.bulkRejectNews(selectedNewsIds);

      if (result.success) {
        // 백엔드에서 최신 데이터 다시 불러오기
        await refreshNewsData();
        alert(`${selectedNewsIds.length}개의 뉴스가 거부되었습니다.`);
        setSelectedNewsIds([]);
        setIsSelectMode(false);
      } else {
        throw new Error('일괄 거부 실패');
      }
    } catch (err: any) {
      alert('전체 거부 중 오류가 발생했습니다: ' + (err.message || err));
      console.error('Error rejecting multiple news:', err);
    } finally {
      setActionLoading(false);
    }
  };


  // AI 재분석 함수 (거부된 뉴스 대상)
  const handleAIReanalysis = async (newsId: number) => {
    const news = newsItems.find(item => item.id === newsId);
    if (!news) {
      alert('뉴스를 찾을 수 없습니다.');
      return;
    }

    if (news.status !== 'rejected') {
      alert('거부된 뉴스만 재분석할 수 있습니다.');
      return;
    }

    if (!window.confirm(`"${news.title}"를 AI로 재분석하시겠습니까?\n\n재분석 후 승인 대기 상태로 변경됩니다.`)) {
      return;
    }

    try {
      setActionLoading(true);

      // 1. 뉴스 상태를 PROCESSING으로 변경
      await fetch(`http://localhost:8080/api/news/${newsId}/status?status=PROCESSING`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // UI에서 즉시 상태 반영
      setAllNewsData(prev => prev.map(news =>
        news.id === newsId ? { ...news, status: 'processing' as const } : news
      ));
      setNewsItems(prev => prev.map(news =>
        news.id === newsId ? { ...news, status: 'processing' as const } : news
      ));

      try {
        // 2. 백엔드에 재분석 작업 생성 요청
        console.log(`🤖 재분석 작업 생성: 뉴스 ID ${newsId}`);
        const backendResponse = await fetch(`http://localhost:8080/api/news-summary/admin/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newsId: newsId,
            analysisType: 'COMPREHENSIVE'
          })
        });

        if (!backendResponse.ok) {
          throw new Error('백엔드 분석 작업 생성 실패');
        }

        const backendResult = await backendResponse.json();
        if (!backendResult.success) {
          throw new Error(backendResult.error || '분석 작업 생성 실패');
        }

        const summaryId = backendResult.data?.id;
        if (!summaryId) {
          throw new Error('summary_id를 받지 못했습니다.');
        }

        console.log(`✅ 재분석 작업 생성 완료: 뉴스 ID ${newsId}, 요약 ID ${summaryId}`);

        // 3. 실제 AI 재분석 서비스 API 호출
        console.log(`🤖 실제 AI 재분석 실행: 뉴스 ID ${newsId}`);
        const aiResponse = await fetch(`/ai/analyze/news/${newsId}?analysis_type=COMPREHENSIVE&summary_id=${summaryId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          console.log(`✅ AI 재분석 완료: 뉴스 ID ${newsId}`, aiResult);

          // 3. 재분석 성공 시 REVIEW_PENDING으로 상태 변경
          await fetch(`http://localhost:8080/api/news/${newsId}/status?status=REVIEW_PENDING`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          // UI에서 상태 반영
          setAllNewsData(prev => prev.map(news =>
            news.id === newsId ? { ...news, status: 'review_pending' as const, rejectReason: undefined } : news
          ));
          setNewsItems(prev => prev.map(news =>
            news.id === newsId ? { ...news, status: 'review_pending' as const, rejectReason: undefined } : news
          ));

          alert('🤖 AI 재분석이 완료되었습니다!\n승인 대기 상태로 변경되었습니다.');

        } else {
          console.error(`❌ AI 재분석 실패: 뉴스 ID ${newsId}`, aiResponse.status, aiResponse.statusText);

          // 재분석 실패 시 REJECTED으로 되돌리기
          await fetch(`http://localhost:8080/api/news/${newsId}/status?status=REJECTED`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          setAllNewsData(prev => prev.map(news =>
            news.id === newsId ? { ...news, status: 'rejected' as const } : news
          ));
          setNewsItems(prev => prev.map(news =>
            news.id === newsId ? { ...news, status: 'rejected' as const } : news
          ));

          alert('AI 재분석에 실패했습니다.\ncrwaler_ai_service가 실행되고 있는지 확인해주세요.');
        }

      } catch (aiError) {
        console.error(`❌ AI 재분석 오류: 뉴스 ID ${newsId}`, aiError);

        // 재분석 오류 시 REJECTED으로 되돌리기
        await fetch(`http://localhost:8080/api/news/${newsId}/status?status=REJECTED`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        setAllNewsData(prev => prev.map(news =>
          news.id === newsId ? { ...news, status: 'rejected' as const } : news
        ));
        setNewsItems(prev => prev.map(news =>
          news.id === newsId ? { ...news, status: 'rejected' as const } : news
        ));

        alert('AI 재분석 중 오류가 발생했습니다.\n네트워크 연결을 확인해주세요.');
      }

    } catch (error) {
      console.error('AI 재분석 처리 오류:', error);
      alert('AI 재분석 요청 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 노출/미노출 토글 함수
  const handleToggleVisibility = async (newsId: number) => {
    const news = newsItems.find(item => item.id === newsId);
    if (!news) {
      alert('뉴스를 찾을 수 없습니다.');
      return;
    }

    if (news.status !== 'approved') {
      alert('승인된 뉴스만 노출 설정을 변경할 수 있습니다.');
      return;
    }

    const newVisibility = !news.isVisible;
    const action = newVisibility ? '노출' : '미노출';

    if (!window.confirm(`"${news.title}"를 사용자 화면에서 ${action} 상태로 변경하시겠습니까?`)) {
      return;
    }

    try {
      setActionLoading(true);

      // 백엔드 API 호출로 노출 상태 변경
      const response = await fetch(`http://localhost:8080/api/news/${newsId}/visibility?visible=${newVisibility}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // UI에서 즉시 상태 반영
        setAllNewsData(prev => prev.map(news =>
          news.id === newsId ? { ...news, isVisible: newVisibility } : news
        ));
        setNewsItems(prev => prev.map(news =>
          news.id === newsId ? { ...news, isVisible: newVisibility } : news
        ));

        alert(`뉴스가 사용자 화면에서 ${action} 상태로 변경되었습니다.`);
      } else {
        throw new Error('노출 상태 변경 실패');
      }

    } catch (error) {
      console.error('노출 상태 변경 오류:', error);
      alert('노출 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 뉴스 삭제 함수
  const handleDeleteNews = async (newsId: number) => {
    const news = newsItems.find(item => item.id === newsId);
    if (!news) {
      alert('뉴스를 찾을 수 없습니다.');
      return;
    }

    if (!window.confirm(`"${news.title}"를 완전히 삭제하시겠습니까?\n\n삭제된 뉴스는 복구할 수 없습니다.`)) {
      return;
    }

    try {
      setActionLoading(true);

      // 백엔드에서 뉴스 삭제
      const response = await fetch(`http://localhost:8080/api/news/${newsId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // UI에서 뉴스 제거
        setAllNewsData(prev => prev.filter(news => news.id !== newsId));
        setNewsItems(prev => prev.filter(news => news.id !== newsId));

        alert('뉴스가 삭제되었습니다.');
      } else {
        throw new Error('삭제 실패');
      }

    } catch (error) {
      console.error('뉴스 삭제 오류:', error);
      alert('뉴스 삭제 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 메인 실시간 이슈 데이터 로드
  const loadMainFeaturedData = async () => {
    try {
      setFeaturedLoading(true);

      // 메인에 노출된 뉴스 가져오기
      const featuredResponse = await fetch(`${getBackendApiBase()}/news/main/featured`);
      const featuredResult = await featuredResponse.json();

      if (featuredResult.success) {
        const convertedFeatured = featuredResult.data.map((news: any) => ({
          ...news,
          mainFeatured: news.mainFeatured,
          mainDisplayOrder: news.mainDisplayOrder,
          featuredAt: news.featuredAt,
          analysisType: news.analysisType as NewsItem['analysisType'] // AI 분석 타입 추가
        }));
        setFeaturedNews(convertedFeatured);
      }

      // 승인된 뉴스 목록 가져오기 (메인 노출 후보)
      const approvedResponse = await fetch(`${getBackendApiBase()}/news/approved?page=0&size=200`);
      const approvedResult = await approvedResponse.json();

      if (approvedResult.success) {
        const convertedApproved = approvedResult.data.map((news: any) => ({
          id: news.id,
          title: news.title || '제목 없음',
          content: news.content || '',
          url: news.url || '',
          source: news.source || '알 수 없음',
          publisher: news.publisher || news.source || '알 수 없음',
          category: news.category || 'others',
          publishDate: news.publishDate || new Date().toISOString(),
          status: (news.status || 'pending') as NewsItem['status'],
          thumbnail: news.thumbnail,
          aiSummary: news.aiSummary || '요약 정보 없음',
          aiKeywords: Array.isArray(news.aiKeywords) ? news.aiKeywords :
            (typeof news.aiKeywords === 'string' && news.aiKeywords ?
              news.aiKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0) : []),
          reliabilityScore: typeof news.reliabilityScore === 'number' ? news.reliabilityScore : 0,
          confidenceScore: typeof news.confidenceScore === 'number' ? news.confidenceScore : 0,
          aiAnalysisResult: {
            summary: news.aiSummary || '요약 정보 없음',
            keywords: Array.isArray(news.aiKeywords) ? news.aiKeywords :
              (typeof news.aiKeywords === 'string' && news.aiKeywords ?
                news.aiKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0) : []),
            sentiment: news.sentiment || '중립',
            factCheck: news.factCheck || '검증 필요',
            reliability: typeof news.reliabilityScore === 'number' ? news.reliabilityScore : 0
          },
          detailedAnalysis: (() => {
            if (news.detailedAnalysis && typeof news.detailedAnalysis === 'string') {
              try {
                return JSON.parse(news.detailedAnalysis);
              } catch (error) {
                console.error('Error parsing detailedAnalysis JSON:', error);
                return null;
              }
            }
            return news.detailedAnalysis || null;
          })(),
          suspiciousPoints: news.suspiciousPoints || null,
          comments: typeof news.comments === 'number' ? news.comments : 0,
          votes: {
            fact: typeof news.votes?.fact === 'number' ? news.votes.fact : 0,
            doubt: typeof news.votes?.doubt === 'number' ? news.votes.doubt : 0
          },
          createdAt: news.createdAt || news.publishDate || new Date().toISOString(),
          updatedAt: news.updatedAt || news.publishDate || new Date().toISOString(),
          rejectReason: news.rejectReason,
          isVisible: news.isVisible !== undefined ? news.isVisible : true,
          mainFeatured: news.mainFeatured || false,
          mainDisplayOrder: news.mainDisplayOrder,
          featuredAt: news.featuredAt,
          analysisType: news.analysisType as NewsItem['analysisType'] // AI 분석 타입 추가
        }));
        setApprovedNews(convertedApproved);
      }

    } catch (error) {
      console.error('메인 실시간 이슈 데이터 로드 실패:', error);
      alert('메인 실시간 이슈 데이터를 불러오는데 실패했습니다.');
    } finally {
      setFeaturedLoading(false);
    }
  };

  // 뉴스를 메인에 추가
  const handleAddToMain = async (newsId: number, displayOrder?: number) => {
    try {
      setActionLoading(true);

      const order = displayOrder || (featuredNews.length + 1);
      const response = await fetch(`${getBackendApiBase()}/news/${newsId}/main-featured?displayOrder=${order}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await loadMainFeaturedData(); // 데이터 새로고침
        alert('뉴스가 메인 실시간 이슈에 추가되었습니다.');
      } else {
        throw new Error('메인 추가 실패');
      }

    } catch (error) {
      console.error('메인 추가 오류:', error);
      alert('메인 실시간 이슈 추가 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 뉴스를 메인에서 제거
  const handleRemoveFromMain = async (newsId: number) => {
    try {
      setActionLoading(true);

      const response = await fetch(`${getBackendApiBase()}/news/${newsId}/main-featured`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await loadMainFeaturedData(); // 데이터 새로고침
        alert('뉴스가 메인 실시간 이슈에서 제거되었습니다.');
      } else {
        throw new Error('메인 제거 실패');
      }

    } catch (error) {
      console.error('메인 제거 오류:', error);
      alert('메인 실시간 이슈 제거 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 메인 노출 순서 변경
  const handleUpdateOrder = async (newsId: number, newOrder: number) => {
    try {
      setActionLoading(true);

      const response = await fetch(`${getBackendApiBase()}/news/${newsId}/main-display-order?newOrder=${newOrder}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await loadMainFeaturedData(); // 데이터 새로고침
        alert('노출 순서가 변경되었습니다.');
      } else {
        throw new Error('순서 변경 실패');
      }

    } catch (error) {
      console.error('순서 변경 오류:', error);
      alert('노출 순서 변경 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 시간 포맷팅
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 카테고리 레이블 가져오기
  const getCategoryLabel = (categoryKey: string) => {
    const categoryLabels: { [key: string]: string } = {
      'politics': '정치',
      'economy': '경제',
      'society': '사회',
      'technology': 'IT/과학',
      'world': '국제',
      'environment': '기후/환경',
      'others': '기타'
    };
    return categoryLabels[categoryKey] || categoryKey;
  };

  // 신뢰도 점수 색상 클래스
  const getReliabilityClass = (score: number) => {
    if (score >= 90) return 'admin-reliability-high';
    if (score >= 80) return 'admin-reliability-medium';
    if (score >= 70) return 'admin-reliability-low';
    return 'admin-reliability-very-low';
  };

  if (loading) {
    return (
      <div className="admin-fade-in">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800 admin-mb-6">뉴스 관리(분석 완료한 뉴스를 사용자화면에 출력합니다.)</h1>
        <div className="admin-flex-center" style={{ height: '200px' }}>
          <p className="admin-text-gray-500">데이터를 로드하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-fade-in">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800 admin-mb-6">뉴스 관리(분석 완료한 뉴스를 사용자화면에 출력합니다.)</h1>
        <div className="admin-card">
          <div className="admin-flex-center" style={{ padding: '40px' }}>
            <div className="admin-text-center">
              <p className="admin-text-red-500 admin-mb-4">오류가 발생했습니다: {error}</p>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-fade-in">
      <div className="admin-flex-between admin-mb-6">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800">뉴스 관리</h1>
        <div className="admin-flex" style={{ gap: '12px' }}>
          {selectedTab === 'pending' && newsItems.length > 0 && (
            <>
              <button
                className={`admin-btn ${isSelectMode ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  setSelectedNewsIds([]);
                }}
                disabled={actionLoading}
              >
                <i className={`fas ${isSelectMode ? 'fa-times' : 'fa-check-square'} mr-2`}></i>
                {isSelectMode ? '선택 취소' : '일괄 선택'}
              </button>

              {/* 전체 선택 버튼 */}
              {isSelectMode && (
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={selectAllPendingNews}
                  disabled={actionLoading}
                >
                  <i className="fas fa-check-double mr-2"></i>
                  전체 선택
                </button>
              )}

              {/* 전체 승인 버튼 */}
              {selectedNewsIds.length > 0 && (
                <>
                  <button
                    className="admin-btn admin-btn-success"
                    onClick={handleApproveAll}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-check mr-2"></i>
                    전체 승인 ({selectedNewsIds.length}개)
                  </button>

                  {/* 전체 거부 버튼 */}
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={handleRejectAll}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-times mr-2"></i>
                    전체 거부 ({selectedNewsIds.length}개)
                  </button>
                </>
              )}
            </>
          )}


          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => window.location.reload()}
            disabled={loading || actionLoading}
          >
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync'} mr-2`}></i>
            새로고침
          </button>
        </div>
      </div>

      {/* 메인 탭 네비게이션 */}
      <div className="admin-card admin-mb-6">
        <nav className="admin-tab-nav">
          <div className="admin-tab-container">
            <button
              onClick={() => setMainTab('news_management')}
              className={`admin-tab-button ${mainTab === 'news_management' ? 'active' : ''}`}
            >
              <i className="fas fa-newspaper"></i>
              뉴스 관리
              <span className="admin-text-xs admin-ml-2">(AI 분석 완료된 뉴스 승인/거부)</span>
            </button>
            <button
              onClick={() => setMainTab('main_featured')}
              className={`admin-tab-button ${mainTab === 'main_featured' ? 'active' : ''}`}
            >
              <i className="fas fa-star"></i>
              메인 실시간 이슈 관리
              <span className="admin-text-xs admin-ml-2">(승인된 뉴스 중 메인에 노출할 뉴스 선택)</span>
            </button>
          </div>
        </nav>
      </div>

      {/* 뉴스 관리 탭 내용 */}
      {mainTab === 'news_management' && (
        <>
          {/* 탭 네비게이션 */}
          <div className="admin-card admin-mb-6">
            <nav className="admin-tab-nav">
              <div className="admin-tab-container">
                {(() => {
                  // News 화면에서는 AI 분석 완료된 뉴스만 카운트 (소문자 상태값 사용)
                  const newsForReview = allNewsData.filter(news =>
                    news.status === 'review_pending' ||
                    news.status === 'approved' ||
                    news.status === 'rejected' ||
                    news.status === 'processing'
                  );

                  const tabs = [
                    { key: 'pending', label: '승인 대기', icon: 'fas fa-clock', count: newsForReview.filter(n => n.status === 'review_pending' || n.status === 'processing').length },
                    { key: 'approved', label: '승인완료', icon: 'fas fa-check-circle', count: newsForReview.filter(n => n.status === 'approved').length },
                    { key: 'rejected', label: '거부', icon: 'fas fa-times-circle', count: newsForReview.filter(n => n.status === 'rejected').length }
                  ];

                  return tabs;
                })().map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setSelectedTab(tab.key as any);
                      setSelectedCategory('all'); // 탭 변경 시 카테고리 초기화
                    }}
                    className={`admin-tab-button ${selectedTab === tab.key ? 'active' : ''}`}
                  >
                    <i className={tab.icon}></i>
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="admin-status-badge admin-status-blue admin-ml-1">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* 카테고리 필터 (승인대기, 승인완료 탭에만 표시) */}
          {(selectedTab === 'pending' || selectedTab === 'approved') && (
            <div className="admin-card admin-mb-6">
              <div className="admin-flex admin-items-center admin-gap-4 admin-p-4">
                <span className="admin-text-sm admin-font-medium admin-text-gray-700">
                  <i className="fas fa-filter mr-2"></i>분야별 정렬:
                </span>
                <div className="admin-flex admin-flex-wrap admin-gap-2">
                  {[
                    { key: 'all', label: '전체', icon: 'fas fa-list' },
                    { key: 'politics', label: '정치', icon: 'fas fa-landmark' },
                    { key: 'economy', label: '경제', icon: 'fas fa-chart-line' },
                    { key: 'society', label: '사회', icon: 'fas fa-users' },
                    { key: 'technology', label: 'IT/과학', icon: 'fas fa-microchip' },
                    { key: 'world', label: '국제', icon: 'fas fa-globe' },
                    { key: 'environment', label: '기후/환경', icon: 'fas fa-leaf' },
                    { key: 'others', label: '기타', icon: 'fas fa-ellipsis-h' }
                  ].map(category => {
                    // 현재 탭에서 해당 카테고리의 뉴스 개수 계산
                    const categoryCount = (() => {
                      const newsForReview = allNewsData.filter(news =>
                        news.status === 'review_pending' ||
                        news.status === 'approved' ||
                        news.status === 'rejected' ||
                        news.status === 'processing'
                      );
                      const statusMap: { [key: string]: string[] } = {
                        'pending': ['review_pending', 'processing'],
                        'approved': ['approved'],
                        'rejected': ['rejected']
                      };
                      const targetStatuses = statusMap[selectedTab];
                      let filteredNews = newsForReview.filter(news => targetStatuses.includes(news.status));

                      if (category.key === 'all') {
                        return filteredNews.length;
                      } else {
                        return filteredNews.filter(news => news.category === category.key).length;
                      }
                    })();

                    return (
                      <button
                        key={category.key}
                        onClick={() => setSelectedCategory(category.key)}
                        className={`admin-btn admin-btn-sm ${selectedCategory === category.key
                          ? 'admin-btn-primary'
                          : 'admin-btn-secondary'
                          }`}
                      >
                        <i className={`${category.icon} mr-1`}></i>
                        {category.label}
                        {categoryCount > 0 && (
                          <span className="admin-ml-1 admin-text-xs">
                            ({categoryCount})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 뉴스 목록 */}
          <div className="admin-flex admin-flex-col admin-gap-4">
            {newsItems.length === 0 ? (
              <div className="admin-card admin-empty-state">
                <div className="admin-text-gray-600">
                  <i className="fas fa-newspaper admin-empty-state-icon"></i>
                  <p className="admin-empty-state-text">
                    {selectedTab === 'pending' ?
                      (selectedCategory === 'all' ? '승인 대기 중인 뉴스가' : `승인 대기 중인 ${getCategoryLabel(selectedCategory)} 뉴스가`) :
                      selectedTab === 'approved' ?
                        (selectedCategory === 'all' ? '승인된 뉴스가' : `승인된 ${getCategoryLabel(selectedCategory)} 뉴스가`) :
                        (selectedCategory === 'all' ? '거부된 뉴스가' : `거부된 ${getCategoryLabel(selectedCategory)} 뉴스가`)
                    } 없습니다.
                  </p>
                </div>
              </div>
            ) : (
              (() => {
                // 현재 페이지에 표시할 뉴스 계산
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const currentNewsItems = newsItems.slice(startIndex, endIndex);

                return currentNewsItems.map(news => (
                  <React.Fragment key={news.id}>
                    <div className="admin-border admin-rounded-lg admin-p-4">
                      <div className="admin-news-header">
                        <div className="admin-flex-1">
                          <div className="admin-flex admin-items-start admin-gap-3 admin-mb-2">
                            {isSelectMode && (news.status === 'review_pending') && (
                              <input
                                type="checkbox"
                                checked={selectedNewsIds.includes(news.id)}
                                onChange={() => toggleSelectNews(news.id)}
                                className="admin-checkbox"
                                style={{ marginTop: '2px' }}
                              />
                            )}

                            {/* 썸네일 이미지 */}
                            {news.thumbnail && (
                              <div style={{
                                width: '100px',
                                height: '75px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                backgroundColor: '#f3f4f6'
                              }}>
                                <img
                                  src={news.thumbnail}
                                  alt="뉴스 썸네일"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            <div className="admin-flex-1">
                              <div className="admin-flex admin-items-center admin-gap-2 admin-mb-2">
                                <span className="admin-news-id-badge">
                                  ID: {news.id}
                                </span>
                                <span className="admin-analysis-type-badge">
                                  [{getAnalysisTypeLabel(news.analysisType)}]
                                </span>
                                <h3 className="admin-text-lg admin-font-medium admin-text-gray-900">
                                  {news.title}
                                </h3>
                              </div>
                              <div className="admin-flex admin-items-center admin-gap-2">
                                <StatusBadge
                                  status={news.status as 'pending' | 'approved' | 'rejected' | 'processing' | 'review_pending' | 'ai_completed' | 'draft'}
                                  text={(NEWS_STATUS_LABELS as any)[news.status] || (NEWS_STATUS_LABELS as any)[news.status.toLowerCase()] || '대기중'}
                                />
                                {news.status === 'review_pending' && (
                                  <span className="admin-ai-completed-badge">
                                    <i className="fas fa-robot mr-1"></i>AI 분석완료
                                  </span>
                                )}
                                {news.status === 'processing' && (
                                  <span className="admin-processing-badge">
                                    <i className="fas fa-spinner fa-spin mr-1"></i>AI 분석중
                                  </span>
                                )}
                                {news.status === 'approved' && (
                                  <span className={`admin-visibility-badge ${news.isVisible ? 'visible' : 'hidden'}`}>
                                    <i className={`fas ${news.isVisible ? 'fa-eye' : 'fa-eye-slash'} mr-1`}></i>
                                    {news.isVisible ? '노출중' : '미노출'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 오른쪽 위 버튼 영역 */}
                        <div className="admin-news-actions-top">
                          {(news.status === 'review_pending') && (
                            <>
                              <button
                                className="admin-btn admin-btn-success admin-btn-sm"
                                onClick={() => handleApprove(news.id)}
                                disabled={actionLoading}
                              >
                                <i className="fas fa-check mr-1"></i>승인
                              </button>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => handleReject(news.id)}
                                disabled={actionLoading}
                              >
                                <i className="fas fa-times mr-1"></i>거부
                              </button>
                            </>
                          )}

                          {/* 승인된 뉴스 노출/미노출 버튼 */}
                          {news.status === 'approved' && (
                            <button
                              className={`admin-btn admin-btn-sm ${news.isVisible ? 'admin-btn-warning' : 'admin-btn-success'}`}
                              onClick={() => handleToggleVisibility(news.id)}
                              disabled={actionLoading}
                              title={news.isVisible ? '사용자 화면에서 숨기기' : '사용자 화면에 노출하기'}
                            >
                              <i className={`fas ${news.isVisible ? 'fa-eye-slash' : 'fa-eye'} mr-1`}></i>
                              {news.isVisible ? '미노출' : '노출'}
                            </button>
                          )}

                          {news.status === 'processing' && (
                            <div className="admin-processing-text">
                              <i className="fas fa-spinner fa-spin mr-2"></i>AI 재분석 진행 중...
                            </div>
                          )}

                          <button
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => setSelectedNews(selectedNews?.id === news.id ? null : news)}
                          >
                            <i className="fas fa-eye mr-1"></i>상세보기
                          </button>

                          {/* 거부된 뉴스에 대한 추가 버튼들 */}
                          {news.status === 'rejected' && (
                            <>
                              <button
                                className="admin-btn admin-btn-info admin-btn-sm"
                                onClick={() => handleAIReanalysis(news.id)}
                                disabled={actionLoading}
                                title="AI로 재분석하여 승인 대기 상태로 변경합니다"
                              >
                                <i className={`fas ${actionLoading ? 'fa-spinner fa-spin' : 'fa-robot'} mr-1`}></i>AI 재분석
                              </button>
                              <button
                                className="admin-btn admin-btn-delete admin-btn-sm"
                                onClick={() => handleDeleteNews(news.id)}
                                disabled={actionLoading}
                                title="뉴스를 완전히 삭제합니다 (복구 불가)"
                              >
                                <i className={`fas ${actionLoading ? 'fa-spinner fa-spin' : 'fa-trash'} mr-1`}></i>삭제
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* AI 분석 결과 표시 (간소화된 형태) */}
                      {news.aiSummary && (
                        <div className="admin-mb-3" style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                          <div className="admin-text-sm admin-text-gray-700" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div><strong>AI 분석 요약:</strong> {news.aiSummary}</div>
                            {news.aiKeywords && Array.isArray(news.aiKeywords) && news.aiKeywords.length > 0 && (
                              <div><strong>추출 키워드:</strong> {news.aiKeywords.join(', ')}</div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="admin-flex admin-items-center admin-justify-between">
                        <div className="admin-flex admin-text-sm admin-text-gray-500" style={{ gap: '16px' }}>
                          <span><i className="fas fa-globe mr-1"></i>네이버 / {news.publisher}</span>
                          <span><i className="fas fa-comments mr-1"></i>{news.comments} 댓글</span>
                          <span><i className="fas fa-thumbs-up mr-1"></i>{news.votes.fact} 사실</span>
                          <span><i className="fas fa-thumbs-down mr-1"></i>{news.votes.doubt} 의심</span>
                          <span><i className="fas fa-clock mr-1"></i>{formatDateTime(news.createdAt)}</span>
                        </div>

                      </div>

                      {/* 펼쳐진 상세 정보 */}
                      {selectedNews?.id === news.id && (
                        <div className="admin-news-content" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>

                          {/* 뉴스 원본 링크 */}
                          <div className="admin-mb-3">
                            <p className="admin-text-sm admin-text-gray-600 admin-mb-2">
                              <i className="fas fa-external-link-alt mr-2"></i> 원본 기사
                            </p>
                            <a
                              href={news.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-news-link"
                            >
                              <i className="fas fa-newspaper mr-2"></i>
                              {news.title}
                              <i className="fas fa-external-link-alt ml-2"></i>
                            </a>
                          </div>

                          {/* AI 분석 기본 정보 */}
                          {news.aiSummary && (
                            <div className="admin-mb-3">
                              <p className="admin-text-sm admin-text-gray-600 admin-mb-2">
                                <i className="fas fa-chart-bar mr-2"></i>AI 분석 기본 정보
                              </p>
                              <div className="admin-grid admin-grid-cols-1 admin-gap-3">
                                <div className="admin-analysis-card">
                                  <span className="admin-analysis-label">
                                    <i className="fas fa-file-text mr-1"></i>핵심 주장
                                  </span>
                                  <p className="admin-analysis-value">
                                    {typeof news.aiAnalysisResult === 'string' ? news.aiAnalysisResult : news.aiAnalysisResult?.summary || 'AI 분석 중...'}
                                  </p>
                                </div>
                                {news.suspiciousPoints && (
                                  <div className="admin-analysis-card">
                                    <span className="admin-analysis-label">
                                      <i className="fas fa-exclamation-triangle mr-1"></i>의심 포인트
                                    </span>
                                    <p className="admin-analysis-value">
                                      {news.suspiciousPoints}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* AI 신뢰도 정보 */}
                          <div className="admin-mb-3">
                            <p className="admin-text-sm admin-text-gray-600 admin-mb-2">
                              <i className="fas fa-chart-line mr-2"></i>신뢰도 정보
                            </p>
                            <div className="admin-flex admin-gap-4">
                              <span className={`admin-reliability-badge ${getReliabilityClass(news.reliabilityScore || 0)}`}>
                                <i className="fas fa-shield-alt mr-1"></i>
                                콘텐츠 신뢰도: {news.reliabilityScore || 0}%
                                {(news.reliabilityScore || 0) === 0 && (
                                  <span className="admin-text-xs admin-text-gray-500 admin-italic admin-ml-2">(미분석)</span>
                                )}
                              </span>
                              <span className={`admin-reliability-badge ${getReliabilityClass(news.confidenceScore ? news.confidenceScore * 100 : 0)}`}>
                                <i className="fas fa-brain mr-1"></i>
                                AI 신뢰도: {news.confidenceScore ? Math.round(news.confidenceScore * 100) : 0}%
                                {(news.confidenceScore ? Math.round(news.confidenceScore * 100) : 0) === 0 && (
                                  <span className="admin-text-xs admin-text-gray-500 admin-italic admin-ml-2">(미분석)</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 거부 사유 */}
                    {news.status === 'rejected' && news.rejectReason && (
                      <div className="admin-rejection-reason">
                        <p className="admin-rejection-reason-text">
                          <i className="fas fa-exclamation-circle mr-2"></i>
                          거부 사유: {news.rejectReason}
                        </p>
                      </div>
                    )}

                    {/* 상세 정보 */}
                    {selectedNews?.id === news.id && (
                      <div className="admin-border-t admin-pt-4 admin-mt-4">
                        <div className="admin-grid admin-grid-cols-1 admin-gap-4">
                          {/* 상세 AI 분석 결과 */}
                          {news.detailedAnalysis && (
                            <div>
                              <h4 className="admin-text-sm admin-font-medium admin-text-gray-700 admin-mb-2">
                                <i className="fas fa-analytics mr-2"></i>AI 분석 상세 결과
                              </h4>

                              {/* 사실 분석 */}
                              {news.detailedAnalysis.fact_analysis && (
                                <div className="admin-mb-4">
                                  <h5 className="admin-text-sm admin-font-medium admin-text-blue-700 admin-mb-2">
                                    📊 사실 분석
                                  </h5>
                                  <div className="admin-text-sm admin-text-gray-600" style={{ lineHeight: '1.6' }}>
                                    {news.detailedAnalysis.fact_analysis.verifiable_facts && news.detailedAnalysis.fact_analysis.verifiable_facts.length > 0 && (
                                      <div className="admin-analysis-card admin-mb-2">
                                        <p><strong>검증 가능한 사실:</strong></p>
                                        {news.detailedAnalysis.fact_analysis.verifiable_facts.map((fact: any, index: number) => (
                                          <div key={index} className="admin-ml-4 admin-mb-1">
                                            <p>• 주장: {fact.claim}</p>
                                            <p>• 근거: {fact.evidence}</p>
                                            <p>• 신뢰도: {fact.reliability === 'high' ? '높음' : fact.reliability === 'medium' ? '보통' : '낮음'}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {news.detailedAnalysis.fact_analysis.questionable_claims && news.detailedAnalysis.fact_analysis.questionable_claims.length > 0 && (
                                      <div className="admin-analysis-card admin-mb-2">
                                        <p><strong>검증 필요한 주장:</strong></p>
                                        {news.detailedAnalysis.fact_analysis.questionable_claims.map((claim: any, index: number) => (
                                          <div key={index} className="admin-ml-4 admin-mb-1">
                                            <p>• 주장: {claim.claim}</p>
                                            <p>• 이유: {claim.reason}</p>
                                            <p>• 위험도: {claim.risk_level === 'high' ? '높음' : claim.risk_level === 'medium' ? '보통' : '낮음'}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {news.detailedAnalysis.fact_analysis.overall_assessment && (
                                      <div className="admin-analysis-card">
                                        <p><strong>전체 평가:</strong> {news.detailedAnalysis.fact_analysis.overall_assessment}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 편향성 분석 */}
                              {news.detailedAnalysis.bias_analysis && (
                                <div className="admin-mb-4">
                                  <h5 className="admin-text-sm admin-font-medium admin-text-orange-700 admin-mb-2">
                                    ⚖️ 편향성 분석
                                  </h5>
                                  <div className="admin-text-sm admin-text-gray-600" style={{ lineHeight: '1.6' }}>
                                    {news.detailedAnalysis.bias_analysis.political_leaning && (
                                      <div className="admin-analysis-card admin-mb-2">
                                        <p><strong>정치적 성향:</strong> {news.detailedAnalysis.bias_analysis.political_leaning}</p>
                                      </div>
                                    )}

                                    {news.detailedAnalysis.bias_analysis.bias_score && (
                                      <div className="admin-analysis-card admin-mb-2">
                                        <p><strong>편향성 점수:</strong> {news.detailedAnalysis.bias_analysis.bias_score}/100점</p>
                                      </div>
                                    )}

                                    {news.detailedAnalysis.bias_analysis.framing_analysis && (
                                      <div className="admin-analysis-card admin-mb-2">
                                        <p><strong>프레임 분석:</strong> {news.detailedAnalysis.bias_analysis.framing_analysis}</p>
                                      </div>
                                    )}

                                    {news.detailedAnalysis.bias_analysis.overall_assessment && (
                                      <div className="admin-analysis-card">
                                        <p><strong>전체 평가:</strong> {news.detailedAnalysis.bias_analysis.overall_assessment}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 신뢰도 분석 */}
                              {news.detailedAnalysis.credibility && (
                                <div className="admin-mb-4">
                                  <h5 className="admin-text-sm admin-font-medium admin-text-green-700 admin-mb-2">
                                    🎯 신뢰도 분석
                                  </h5>
                                  <div className="admin-text-sm admin-text-gray-600" style={{ lineHeight: '1.6' }}>
                                    {news.detailedAnalysis.credibility.overall_score && (
                                      <div className="admin-analysis-card admin-mb-2">
                                        <p><strong>전체 신뢰도:</strong> {news.detailedAnalysis.credibility.overall_score}/100점</p>
                                      </div>
                                    )}

                                    {news.detailedAnalysis.credibility.fact_score && (
                                      <div className="admin-analysis-card admin-mb-2">
                                        <p><strong>사실성 점수:</strong> {news.detailedAnalysis.credibility.fact_score}/100점</p>
                                      </div>
                                    )}

                                    {news.detailedAnalysis.credibility.bias_impact && (
                                      <div className="admin-analysis-card admin-mb-2">
                                        <p><strong>편향성 영향:</strong> {news.detailedAnalysis.credibility.bias_impact}</p>
                                      </div>
                                    )}

                                    {news.detailedAnalysis.credibility.assessment_reason && (
                                      <div className="admin-analysis-card">
                                        <p><strong>평가 근거:</strong> {news.detailedAnalysis.credibility.assessment_reason}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ));
              })()
            )}

            {/* 페이징 */}
            {newsItems.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(newsItems.length / itemsPerPage)}
                totalItems={newsItems.length}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => {
                  console.log('Page changed to:', page);
                  setCurrentPage(page);
                  setSelectedNewsIds([]);
                }}
                maxVisiblePages={10}
              />
            )}
          </div>
        </>
      )}

      {/* 메인 실시간 이슈 관리 탭 내용 */}
      {mainTab === 'main_featured' && (
        <div className="admin-flex admin-flex-col admin-gap-6">
          {featuredLoading ? (
            <div className="admin-flex-center" style={{ height: '200px' }}>
              <p className="admin-text-gray-500">데이터를 로드하는 중...</p>
            </div>
          ) : (
            <>
              {/* 현재 메인에 노출된 뉴스 */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h2 className="admin-text-xl admin-font-bold admin-text-gray-800">
                    <i className="fas fa-star mr-2"></i>
                    현재 메인 실시간 이슈 ({featuredNews.length}개)
                  </h2>
                  <p className="admin-text-sm admin-text-gray-600">
                    사용자 메인 화면에 실시간 이슈로 노출되는 뉴스입니다. 순서를 변경하거나 제거할 수 있습니다.
                  </p>
                </div>
                <div className="admin-card-content">
                  {featuredNews.length === 0 ? (
                    <div className="admin-empty-state">
                      <i className="fas fa-star admin-empty-state-icon"></i>
                      <p className="admin-empty-state-text">현재 메인에 노출된 뉴스가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="admin-flex admin-flex-col admin-gap-3">
                      {featuredNews
                        .sort((a, b) => (a.mainDisplayOrder || 0) - (b.mainDisplayOrder || 0))
                        .map((news, index) => (
                          <div key={news.id} className="admin-featured-news-item">
                            <div className="admin-flex admin-items-center admin-gap-3">
                              <div className="admin-featured-order-badge">
                                {news.mainDisplayOrder || index + 1}
                              </div>
                              {news.thumbnail && (
                                <img
                                  src={news.thumbnail}
                                  alt="뉴스 썸네일"
                                  className="admin-featured-thumbnail"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="admin-flex-1">
                                <div className="admin-flex admin-items-center admin-gap-2 admin-mb-1">
                                  <span className="admin-analysis-type-badge">
                                    [{getAnalysisTypeLabel(news.analysisType)}]
                                  </span>
                                  <h3 className="admin-text-base admin-font-medium admin-text-gray-900">
                                    {news.title}
                                  </h3>
                                </div>
                                <div className="admin-flex admin-items-center admin-gap-2 admin-text-sm admin-text-gray-600">
                                  <span><i className="fas fa-building mr-1"></i>{news.source}</span>
                                  <span><i className="fas fa-calendar mr-1"></i>{formatDateTime(news.featuredAt || news.createdAt)}</span>
                                </div>
                              </div>
                              <div className="admin-flex admin-gap-2">
                                <select
                                  value={news.mainDisplayOrder || index + 1}
                                  onChange={(e) => handleUpdateOrder(news.id, parseInt(e.target.value))}
                                  className="admin-select admin-select-sm"
                                  disabled={actionLoading}
                                >
                                  {Array.from({ length: featuredNews.length }, (_, i) => i + 1).map(order => (
                                    <option key={order} value={order}>{order}번째</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleRemoveFromMain(news.id)}
                                  className="admin-btn admin-btn-danger admin-btn-sm"
                                  disabled={actionLoading}
                                  title="메인에서 제거"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 승인된 뉴스 목록 (메인 추가 후보) */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h2 className="admin-text-xl admin-font-bold admin-text-gray-800">
                    <i className="fas fa-plus-circle mr-2"></i>
                    메인 추가 가능한 뉴스 ({approvedNews.filter(n => !n.mainFeatured && (selectedCategoryForMain === 'all' || n.category === selectedCategoryForMain)).length}개)
                  </h2>
                  <p className="admin-text-sm admin-text-gray-600">
                    승인된 뉴스 중에서 아직 메인에 노출되지 않은 뉴스입니다. 선택해서 메인 실시간 이슈에 추가할 수 있습니다.
                  </p>

                  {/* 분야별 탭 */}
                  <div className="admin-flex admin-items-center admin-gap-4 admin-mt-4">
                    <span className="admin-text-sm admin-font-medium admin-text-gray-700">
                      <i className="fas fa-filter mr-2"></i>분야별 정렬:
                    </span>
                    <div className="admin-flex admin-flex-wrap admin-gap-2">
                      {[
                        { key: 'all', label: '전체', icon: 'fas fa-list' },
                        { key: 'politics', label: '정치', icon: 'fas fa-landmark' },
                        { key: 'economy', label: '경제', icon: 'fas fa-chart-line' },
                        { key: 'society', label: '사회', icon: 'fas fa-users' },
                        { key: 'technology', label: 'IT/과학', icon: 'fas fa-microchip' },
                        { key: 'world', label: '국제', icon: 'fas fa-globe' },
                        { key: 'environment', label: '기후/환경', icon: 'fas fa-leaf' },
                        { key: 'others', label: '기타', icon: 'fas fa-ellipsis-h' }
                      ].map(category => {
                        const categoryCount = approvedNews.filter(n =>
                          !n.mainFeatured &&
                          (category.key === 'all' ? true : n.category === category.key)
                        ).length;

                        return (
                          <button
                            key={category.key}
                            onClick={() => setSelectedCategoryForMain(category.key)}
                            className={`admin-btn admin-btn-sm ${selectedCategoryForMain === category.key
                              ? 'admin-btn-primary'
                              : 'admin-btn-secondary'
                              }`}
                          >
                            <i className={`${category.icon} mr-1`}></i>
                            {category.label}
                            {categoryCount > 0 && (
                              <span className="admin-ml-1 admin-text-xs">
                                ({categoryCount})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="admin-card-content">
                  {(() => {
                    const filteredNews = approvedNews.filter(n =>
                      !n.mainFeatured &&
                      (selectedCategoryForMain === 'all' || n.category === selectedCategoryForMain)
                    );

                    if (filteredNews.length === 0) {
                      return (
                        <div className="admin-empty-state">
                          <i className="fas fa-newspaper admin-empty-state-icon"></i>
                          <p className="admin-empty-state-text">
                            {selectedCategoryForMain === 'all'
                              ? '메인에 추가할 수 있는 뉴스가 없습니다.'
                              : `${getCategoryLabel(selectedCategoryForMain)} 분야에서 메인에 추가할 수 있는 뉴스가 없습니다.`
                            }
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="admin-flex admin-flex-col admin-gap-3">
                        {filteredNews
                          .slice(0, 20) // 최대 20개만 표시
                          .map(news => (
                            <div key={news.id} className="admin-candidate-news-item">
                              <div className="admin-flex admin-items-center admin-gap-3">
                                {news.thumbnail && (
                                  <img
                                    src={news.thumbnail}
                                    alt="뉴스 썸네일"
                                    className="admin-candidate-thumbnail"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="admin-flex-1">
                                  <div className="admin-flex admin-items-center admin-gap-2 admin-mb-1">
                                    <span className="admin-analysis-type-badge">
                                      [{getAnalysisTypeLabel(news.analysisType)}]
                                    </span>
                                    <h3 className="admin-text-base admin-font-medium admin-text-gray-900">
                                      {news.title}
                                    </h3>
                                  </div>
                                  <div className="admin-flex admin-items-center admin-gap-2 admin-text-sm admin-text-gray-600">
                                    <span><i className="fas fa-building mr-1"></i>{news.source}</span>
                                    <span><i className="fas fa-calendar mr-1"></i>{formatDateTime(news.createdAt)}</span>
                                    <span><i className="fas fa-eye mr-1"></i>{news.isVisible ? '노출중' : '미노출'}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAddToMain(news.id)}
                                  className="admin-btn admin-btn-primary admin-btn-sm"
                                  disabled={actionLoading}
                                  title="메인 실시간 이슈에 추가"
                                >
                                  <i className="fas fa-plus mr-1"></i>
                                  메인 추가
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default News;