import React, { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import '../styles/AIManagement.css';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  url: string;
  source: string;
  publisher: string;
  category: string;
  publishDate: string;
  status: 'PENDING' | 'PROCESSING' | 'REVIEW_PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;  // 썸네일 이미지 URL
  analysisProgress?: number;
  // AI analysis results
  summary?: string;
  claim?: string;
  keywords?: string;
  autoQuestion?: string;
  reliabilityScore?: number;
  aiConfidence?: number;
  aiModel?: string;
  processingTime?: number;
  errorMessage?: string;
}

// Real API data only - Mock data completely removed

const AIManagement: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [filteredNewsItems, setFilteredNewsItems] = useState<NewsItem[]>([]); // 카테고리 필터링된 뉴스
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // 선택된 카테고리
  const [selectedNewsIds, setSelectedNewsIds] = useState<number[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [crawlingStatus, setCrawlingStatus] = useState<string>('');
  const [aiServiceStatus, setAiServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  // 수동 크롤링 (뉴스크롤링 버튼 클릭) - 레이어 표시용
  const [isManualCrawling, setIsManualCrawling] = useState(false);
  const [manualCrawlingProgress, setManualCrawlingProgress] = useState(0);
  const [manualCrawlingMessage, setManualCrawlingMessage] = useState('');
  const [manualCrawlingDetails, setManualCrawlingDetails] = useState<string[]>([]);
  const [manualRemainingTime, setManualRemainingTime] = useState(0);

  // 스케줄 크롤링 (배치 자동 실행) - 카드 옆 상태 표시용 
  const [isScheduleCrawling, setIsScheduleCrawling] = useState(false);
  const [scheduleCrawlingProgress, setScheduleCrawlingProgress] = useState(0);
  const [scheduleCrawlingMessage, setScheduleCrawlingMessage] = useState('');
  const [scheduleRemainingTime, setScheduleRemainingTime] = useState(0)
  const [forceUpdate, setForceUpdate] = useState(0); // 강제 리렌더링용

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [totalNewsCount, setTotalNewsCount] = useState(0); // 전체 뉴스 수
  const [lastStatusCheck, setLastStatusCheck] = useState<Date>(new Date());

  // 카테고리 목록 정의
  const categories = [
    { key: 'all', label: '전체' },
    { key: 'politics', label: '정치' },
    { key: 'economy', label: '경제' },
    { key: 'society', label: '사회' },
    { key: 'technology', label: 'IT/과학' },
    { key: 'world', label: '세계' },
    { key: 'environment', label: '기후/환경' }
  ];


  // 환경에 따라 AI API 경로 설정하는 공통 함수
  const getAIApiBase = () => {
    // 크롤러 서비스의 AI 분석 API 사용 (이전 성공 방식)
    return '/ai';
  };

  // 크롤러 API 경로 설정 함수
  const getCrawlerApiBase = () => {
    // 개발 환경에서는 직접 포트 접근, 프로덕션에서는 nginx 프록시
    return window.location.port === '3001' ? 'http://localhost:3002' : '/crawler';
  };

  // 크롤링 상태 실시간 체크
  const checkCrawlingStatus = useCallback(async () => {
    try {
      // 진행중인 크롤링 상태 확인을 위한 더 정확한 체크
      const apiUrl = `${getCrawlerApiBase()}/scheduler/status`;
      const response = await fetch(apiUrl);
      if (response.ok) {
        const result = await response.json();
        const progressData = result.progress;

        if (progressData.is_running) {

          // React 상태 업데이트를 배치로 처리 (React 18 자동 배치)
          const progress = progressData.total_articles > 0
            ? (progressData.completed_articles / progressData.total_articles) * 100
            : 0;
          const newProgress = Math.round(progress);

          // 남은 시간 계산 (각 소스당 약 30-60초 소요)
          let estimatedMinutes = 0;
          if (progress > 0 && progress < 100) {
            const remainingSources = progressData.total_articles - progressData.completed_articles;
            estimatedMinutes = Math.ceil(remainingSources * 1); // 각 소스당 1분 예상
          } else if (progressData.completed_articles === 0 && progressData.total_articles > 0) {
            estimatedMinutes = Math.ceil(progressData.total_articles * 1); // 전체 약 3분 예상
          }

          const newMessage = progressData.current_category
            ? `${progressData.current_category} 분야 크롤링 중...`
            : '크롤링 중...';

          // 로그 포맷: 수집된 뉴스 번호-제목-출처
          const newDetails = progressData.details || [];

          // 크롤링 타입에 따라 적절한 상태 설정
          if (progressData.crawl_type === 'manual') {
            setIsManualCrawling(true);
            setManualCrawlingProgress(newProgress);
            setManualCrawlingMessage(newMessage);
            setManualRemainingTime(estimatedMinutes);
            setManualCrawlingDetails(newDetails);

            // 스케줄 크롤링 상태는 해제
            setIsScheduleCrawling(false);

          } else if (progressData.crawl_type === 'schedule') {
            setIsScheduleCrawling(true);
            setScheduleCrawlingProgress(newProgress);
            setScheduleCrawlingMessage(newMessage);
            setScheduleRemainingTime(estimatedMinutes);

            // 수동 크롤링 상태는 해제
            setIsManualCrawling(false);

          } else {
            // crawl_type이 없거나 알 수 없는 경우 - 기본적으로 스케줄 크롤링으로 처리 (카드만 표시)
            setIsScheduleCrawling(true);
            setScheduleCrawlingProgress(newProgress);
            setScheduleCrawlingMessage(newMessage);
            setScheduleRemainingTime(estimatedMinutes);

            // 수동 크롤링 상태는 해제
            setIsManualCrawling(false);
          }

          setLastStatusCheck(new Date());
          setForceUpdate(prev => prev + 1);


        } else {
          // 모든 크롤링 상태 해제
          setIsManualCrawling(false);
          setManualCrawlingProgress(0);
          setManualRemainingTime(0);
          setManualCrawlingMessage('');
          setManualCrawlingDetails([]);

          setIsScheduleCrawling(false);
          setScheduleCrawlingProgress(0);
          setScheduleRemainingTime(0);
          setScheduleCrawlingMessage('');
        }
      } else {
      }
    } catch (error) {
      // 네트워크 오류 시에도 상태 초기화
      setIsManualCrawling(false);
      setIsScheduleCrawling(false);
      setManualCrawlingProgress(0);
      setScheduleCrawlingProgress(0);
    }
  }, []);

  // 환경에 따라 백엔드 API 경로 설정하는 공통 함수
  const getBackendApiBase = () => {
    return window.location.port === '80' || window.location.port === '' ? '/api' : 'http://localhost/api';
  };

  // AI 서비스 상태 체크 (백엔드 서비스 확인)
  const checkAIServiceStatus = useCallback(async () => {
    try {
      const response = await fetch(`${getBackendApiBase()}/news?size=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setAiServiceStatus('online');
      } else {
        setAiServiceStatus('offline');
      }
    } catch (error) {
      setAiServiceStatus('offline');
    }
  }, []);

  // 초기 AI 서비스 상태 체크
  useEffect(() => {
    checkAIServiceStatus();
    checkCrawlingStatus(); // 크롤링 상태도 초기 체크

    // 전역 크롤링 상태 체크 (5초마다 - 크롤링 여부에 상관없이)
    const globalStatusCheck = setInterval(() => {
      checkCrawlingStatus();
    }, 5000);

    return () => clearInterval(globalStatusCheck);
  }, [checkCrawlingStatus, checkAIServiceStatus]);

  // 크롤링 상태 주기적 체크 (크롤링 중일 때만)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isManualCrawling || isScheduleCrawling) {
      interval = setInterval(() => {
        checkCrawlingStatus();
      }, 3000); // 3초마다 체크
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isManualCrawling, isScheduleCrawling, checkCrawlingStatus]);

  // 수동 크롤링 상태가 변경될 때 컴포넌트 강제 리렌더링 보장
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [isManualCrawling]);

  // 스케줄 크롤링 상태가 변경될 때 리렌더링 보장  
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [isScheduleCrawling]);

  // 실시간 타이머 카운트다운 (1초마다 시간 감소)
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;

    if (isManualCrawling || isScheduleCrawling) {
      countdownInterval = setInterval(() => {
        if (manualRemainingTime > 0) {
          setManualRemainingTime(prev => Math.max(0, prev - 1));
        }
        if (scheduleRemainingTime > 0) {
          setScheduleRemainingTime(prev => Math.max(0, prev - 1));
        }
      }, 1000); // 1초마다 실행
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isManualCrawling, isScheduleCrawling, manualRemainingTime, scheduleRemainingTime]);

  // 전체 뉴스 수 가져오기 (PENDING/PROCESSING 상태만)
  const getTotalNewsCount = async () => {
    try {
      // 전체 개수만 가져오기 (size=1000으로 큰 값 설정)
      const response = await fetch(`${getBackendApiBase()}/news?page=0&size=1000&status=pending,processing`);
      if (response.ok) {
        const result = await response.json();
        const totalCount = result.data?.length || 0;
        setTotalNewsCount(totalCount);
        return totalCount;
      } else {
        setTotalNewsCount(0);
        return 0;
      }
    } catch (error) {
      console.error('Total count fetch failed:', error);
      setTotalNewsCount(0);
      return 0;
    }
  };

  // 데이터 로드 함수 (페이징으로 100개씩 가져오기, 백엔드에서 status 필터링)
  const loadNewsData = async (page = 0, size = 100) => {
    try {
      // 백엔드에서 PENDING/PROCESSING 상태만 필터링해서 가져오기
      const response = await fetch(`${getBackendApiBase()}/news?page=${page}&size=${size}&status=pending,processing,review_pending`);
      if (response.ok) {
        const result = await response.json();
        const apiNews = result.data || [];

        // API 뉴스를 AIManagement 형식으로 변환 (이미 백엔드에서 필터링됨)
        const convertedNews: NewsItem[] = apiNews.map((news: any) => {
          // 크롤링 소스 경로 추출 (네이버/다음)
          let crawlSource = "알수없음";
          if (news.url && news.url.includes('naver.com')) {
            crawlSource = "네이버";
          } else if (news.url && news.url.includes('daum.net')) {
            crawlSource = "다음";
          }

          return {
            id: news.id,
            title: news.title,
            content: news.content,
            url: news.url,
            source: crawlSource,  // 크롤링 경로 (네이버/다음)
            publisher: news.source,  // 실제 언론사명 (세계일보 등)
            category: news.category,
            publishDate: news.publishDate,
            status: news.status,
            createdAt: news.publishDate,
            updatedAt: news.publishDate,
            thumbnail: news.thumbnail
          };
        });

        return convertedNews;
      } else {
        return [];
      }
    } catch (error) {
      console.error('API connection failed:', error);
      return [];
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // 1. 전체 뉴스 수 먼저 가져오기
        await getTotalNewsCount();

        // 2. 첫 페이지 데이터 로드
        const newsData = await loadNewsData(0, 100);
        setNewsItems(newsData);

        // 체크박스 모두 해제 상태로 시작
        setSelectedNewsIds([]);
        setIsSelectAll(false);
      } catch (error) {
        console.error('Initial data load failed:', error);
        setNewsItems([]);
        setTotalNewsCount(0);
      }
      setLoading(false);
    };
    loadInitialData();
  }, []);

  // 카테고리별 필터링
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredNewsItems(newsItems);
    } else {
      const filtered = newsItems.filter(news => news.category === selectedCategory);
      setFilteredNewsItems(filtered);
    }
    // 카테고리 변경시 첫 페이지로 이동
    setCurrentPage(1);
    // 체크박스 상태 초기화
    setSelectedNewsIds([]);
    setIsSelectAll(false);
  }, [newsItems, selectedCategory]);

  // 현재 페이지 변경시 체크박스 상태 업데이트
  useEffect(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const currentPageItems = filteredNewsItems.slice(startIdx, startIdx + itemsPerPage);

    if (currentPageItems.length > 0) {
      const currentPageIds = currentPageItems.map(news => news.id);
      const currentPageSelected = currentPageIds.filter(id => selectedNewsIds.includes(id));
      setIsSelectAll(currentPageSelected.length === currentPageIds.length && currentPageIds.length > 0);
    } else {
      setIsSelectAll(false);
    }
  }, [currentPage, filteredNewsItems, selectedNewsIds, itemsPerPage]);

  // 전체 선택 토글
  const handleSelectAll = () => {
    if (isSelectAll) {
      // 현재 페이지의 선택된 항목들을 제거
      const currentPageIds = currentNewsItems.map(news => news.id);
      setSelectedNewsIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // 현재 페이지의 모든 항목 선택
      const currentPageIds = currentNewsItems.map(news => news.id);
      setSelectedNewsIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
    setIsSelectAll(!isSelectAll);
  };

  // 개별 체크박스 토글
  const toggleSelectNews = (newsId: number) => {
    const news = newsItems.find(item => item.id === newsId);
    if (!news) return;

    setSelectedNewsIds(prev => {
      const newSelected = prev.includes(newsId)
        ? prev.filter(id => id !== newsId)
        : [...prev, newsId];

      // 전체 선택 상태 업데이트 (현재 페이지 기준)
      const currentPageIds = currentNewsItems.map(news => news.id);
      const currentPageSelected = currentPageIds.filter(id => newSelected.includes(id));
      setIsSelectAll(currentPageSelected.length === currentPageIds.length && currentPageIds.length > 0);

      return newSelected;
    });
  };

  // AI 분석 시작 (타입 지정)
  const handleStartAnalysisWithType = async (analysisType: 'COMPREHENSIVE' | 'FACT_ANALYSIS' | 'BIAS_ANALYSIS') => {

    if (selectedNewsIds.length === 0) {
      alert('분석할 뉴스를 선택해주세요.');
      return;
    }

    // AI 서비스 상태 체크
    if (aiServiceStatus === 'offline') {
      alert('❌ 백엔드 서비스가 오프라인 상태입니다.\n\nbackend-service를 먼저 실행해주세요.\n(포트 8080에서 실행되어야 합니다)');
      return;
    }

    // PENDING 상태인 뉴스만 분석 가능
    const pendingSelectedIds = selectedNewsIds.filter(id => {
      const news = newsItems.find(item => item.id === id);
      return news?.status?.toUpperCase() === 'PENDING';
    });

    if (pendingSelectedIds.length === 0) {
      alert('분석 대기 중인 뉴스를 선택해주세요.');
      return;
    }

    const analysisTypeNames = {
      'COMPREHENSIVE': '종합분석',
      'FACT_ANALYSIS': '사실분석', 
      'BIAS_ANALYSIS': '편향성분석'
    };

    if (!window.confirm(`선택된 ${pendingSelectedIds.length}개의 뉴스를 ${analysisTypeNames[analysisType]}하시겠습니까?`)) {
      return;
    }

    setActionLoading(true);

    try {
      // 실제 AI 분석 서비스 API 호출
      const analysisPromises = pendingSelectedIds.map(async (newsId) => {
        const news = newsItems.find(item => item.id === newsId);
        if (!news) return;

        // 1. 뉴스 상태를 PROCESSING으로 변경
        await fetch(`${getBackendApiBase()}/news/${newsId}/status?status=PROCESSING`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        try {
          // 2. 실제 AI 분석 API 호출 (분석 타입 포함)
          console.log(`🤖 ${analysisTypeNames[analysisType]} 시작: 뉴스 ID ${newsId}`);
          const aiResponse = await fetch(`${getBackendApiBase()}/news-summary/admin/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              newsId: newsId,
              analysisType: analysisType
            })
          });

          if (aiResponse.ok) {
            const aiResult = await aiResponse.json();
            console.log(`✅ AI 분석 완료: 뉴스 ID ${newsId}`, aiResult);

            // 3. 분석 성공 시 REVIEW_PENDING으로 상태 변경
            await fetch(`${getBackendApiBase()}/news/${newsId}/status?status=REVIEW_PENDING`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              }
            });

            // 4. 뉴스 관리로 자동 전송 (분석 완료된 뉴스는 AI 관리에서 제거)
            setNewsItems(prev => {
              const filteredItems = prev.filter(news => news.id !== newsId);

              // 분석 완료 알림 (마지막 뉴스 완료시) - 미사용 변수 제거

              // AI 분석 완료 후 자동으로 뉴스 관리로 전송됨 (alert 제거)

              return filteredItems;
            });

          } else {
            console.error(`❌ AI 분석 실패: 뉴스 ID ${newsId}`, aiResponse.status, aiResponse.statusText);

            // 분석 실패 시 PENDING으로 되돌리기
            await fetch(`${getBackendApiBase()}/news/${newsId}/status?status=PENDING`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              }
            });

            // UI 상태 업데이트
            setNewsItems(prev => prev.map(news =>
              news.id === newsId
                ? { ...news, status: 'PENDING' as const, errorMessage: 'AI 분석 실패' }
                : news
            ));
          }

        } catch (aiError) {
          console.error(`❌ AI 분석 오류: 뉴스 ID ${newsId}`, aiError);

          // 분석 오류 시 PENDING으로 되돌리기
          await fetch(`${getBackendApiBase()}/news/${newsId}/status?status=PENDING`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          // UI 상태 업데이트
          setNewsItems(prev => prev.map(news =>
            news.id === newsId
              ? { ...news, status: 'PENDING' as const, errorMessage: '네트워크 오류' }
              : news
          ));
        }
      });

      await Promise.all(analysisPromises);

      // UI에서 상태를 PROCESSING으로 즉시 변경
      setNewsItems(prev => prev.map(news =>
        pendingSelectedIds.includes(news.id)
          ? { ...news, status: 'PROCESSING' as const, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }
          : news
      ));

      setSelectedNewsIds([]);
      setIsSelectAll(false);

      alert(`🤖 ${pendingSelectedIds.length}개의 뉴스에 대한 ${analysisTypeNames[analysisType]}(Gemini)이 시작되었습니다!\n\n분석이 완료되면 뉴스 관리 화면으로 자동 전송됩니다.\n뉴스 관리에서 승인하여 사용자 화면에 노출하세요.`);

    } catch (error) {
      alert('백엔드 AI 분석 중 오류가 발생했습니다.\n\nbackend-service가 실행되고 있는지 확인해주세요.\n(포트 8080에서 실행되어야 합니다)');
      console.error('Backend AI Analysis Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 레거시 지원용 (기본은 종합분석)
  const handleStartAnalysis = async () => {
    return handleStartAnalysisWithType('COMPREHENSIVE');
  };

  // AI 분석 중지
  const handleStopAnalysis = async () => {
    if (selectedNewsIds.length === 0) {
      alert('중지할 뉴스를 선택해주세요.');
      return;
    }

    // PROCESSING 상태인 뉴스만 중지 가능
    const processingSelectedIds = selectedNewsIds.filter(id => {
      const news = newsItems.find(item => item.id === id);
      return news?.status === 'PROCESSING';
    });

    if (processingSelectedIds.length === 0) {
      alert('분석 중인 뉴스를 선택해주세요.');
      return;
    }

    if (!window.confirm(`선택된 ${processingSelectedIds.length}개의 뉴스 분석을 중지하시겠습니까?`)) {
      return;
    }

    setActionLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 상태를 PENDING으로 되돌리고 진행률 초기화
      setNewsItems(prev => prev.map(news =>
        processingSelectedIds.includes(news.id)
          ? { ...news, status: 'PENDING' as const, analysisProgress: undefined, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }
          : news
      ));

      setSelectedNewsIds([]);
      setIsSelectAll(false);

      alert(`${processingSelectedIds.length}개의 뉴스 분석이 중지되었습니다.`);

    } catch (error) {
      alert('분석 중지 중 오류가 발생했습니다.');
      console.error('Stop Analysis Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 실패한 뉴스 재분석
  const handleRetryAnalysis = async () => {
    if (selectedNewsIds.length === 0) {
      alert('재분석할 뉴스를 선택해주세요.');
      return;
    }

    // REJECTED 상태인 뉴스만 재분석 가능
    const rejectedSelectedIds = selectedNewsIds.filter(id => {
      const news = newsItems.find(item => item.id === id);
      return news?.status === 'REJECTED';
    });

    if (rejectedSelectedIds.length === 0) {
      alert('분석 실패한 뉴스를 선택해주세요.');
      return;
    }

    if (!window.confirm(`선택된 ${rejectedSelectedIds.length}개의 뉴스를 재분석하시겠습니까?`)) {
      return;
    }

    setActionLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 상태를 PROCESSING으로 변경
      setNewsItems(prev => prev.map(news =>
        rejectedSelectedIds.includes(news.id)
          ? { ...news, status: 'PROCESSING' as const, analysisProgress: 0, errorMessage: undefined, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }
          : news
      ));

      setSelectedNewsIds([]);
      setIsSelectAll(false);

      alert(`${rejectedSelectedIds.length}개의 뉴스 재분석이 시작되었습니다.`);

    } catch (error) {
      alert('재분석 중 오류가 발생했습니다.');
      console.error('Retry Analysis Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 뉴스 관리 화면으로 전송 (분석완료된 뉴스)
  const handleSendToNews = async () => {
    if (selectedNewsIds.length === 0) {
      alert('전송할 뉴스를 선택해주세요.');
      return;
    }

    // REVIEW_PENDING 상태인 뉴스만 전송 가능
    const reviewPendingSelectedIds = selectedNewsIds.filter(id => {
      const news = newsItems.find(item => item.id === id);
      return news?.status === 'REVIEW_PENDING';
    });

    if (reviewPendingSelectedIds.length === 0) {
      alert('분석 완료된 뉴스를 선택해주세요.');
      return;
    }

    if (!window.confirm(`선택된 ${reviewPendingSelectedIds.length}개의 분석완료 뉴스를 뉴스 관리로 전송하시겠습니까?`)) {
      return;
    }

    setActionLoading(true);

    try {
      // 실제 백엔드 API 호출로 뉴스 상태를 REVIEW_PENDING으로 변경
      const updatePromises = reviewPendingSelectedIds.map(async (newsId) => {
        const news = newsItems.find(item => item.id === newsId);
        if (!news) return;

        // 뉴스 상태를 REVIEW_PENDING으로 업데이트
        const response = await fetch(`${getBackendApiBase()}/news/${newsId}/status?status=REVIEW_PENDING`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`뉴스 ID ${newsId} 업데이트 실패`);
        }

        return response.json();
      });

      await Promise.all(updatePromises);

      // 전송된 뉴스들을 AI 관리 화면에서 제거
      setNewsItems(prev => prev.filter(news => !reviewPendingSelectedIds.includes(news.id)));

      setSelectedNewsIds([]);
      setIsSelectAll(false);

      alert(`${reviewPendingSelectedIds.length}개의 뉴스가 뉴스 관리로 전송되었습니다.\n뉴스 관리 화면(http://localhost:3001/news)에서 확인하세요.`);

    } catch (error) {
      alert('뉴스 전송 중 오류가 발생했습니다: ' + (error as Error).message);
      console.error('Send to News Management Error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 뉴스 크롤링
  const handleCrawlNews = async () => {
    if (!window.confirm('전체 뉴스 크롤링을 시작하시겠습니까?')) {
      return;
    }

    setActionLoading(true);

    try {
      const crawlerApiBase = getCrawlerApiBase();
      const response = await fetch(`${crawlerApiBase}/crawl/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Crawling started:', result);
        alert('뉴스 크롤링이 시작되었습니다. 백그라운드에서 수집 중입니다.');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

    } catch (error) {
      console.error('Crawling error:', error);
      alert('뉴스 크롤링 시작 중 오류가 발생했습니다: ' + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  // 선택된 AI 분석되지 않은 뉴스 삭제
  const handleClearData = async () => {
    if (selectedNewsIds.length === 0) {
      alert('삭제할 뉴스를 선택해주세요.');
      return;
    }

    // PENDING 상태인 뉴스만 삭제 가능
    const pendingSelectedIds = selectedNewsIds.filter(id => {
      const news = newsItems.find(item => item.id === id);
      return news?.status?.toUpperCase() === 'PENDING';
    });

    if (pendingSelectedIds.length === 0) {
      alert('AI 분석되지 않은 뉴스(분석 대기중)를 선택해주세요.');
      return;
    }

    if (!window.confirm(`선택된 ${pendingSelectedIds.length}개의 AI 분석되지 않은 뉴스를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setActionLoading(true);
    setCrawlingStatus('선택된 뉴스 삭제 중...');

    try {
      // 선택된 뉴스들을 개별적으로 삭제
      const deletePromises = pendingSelectedIds.map(async (newsId) => {
        const response = await fetch(`${getBackendApiBase()}/news/${newsId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`뉴스 ID ${newsId} 삭제 실패`);
        }

        return response.json();
      });

      await Promise.all(deletePromises);

      setCrawlingStatus('뉴스 삭제 완료, 데이터 새로고침 중...');

      // 전체 데이터를 다시 로드
      await getTotalNewsCount(); // 전체 뉴스 수 재계산
      const newsData = await loadNewsData(currentPage - 1, itemsPerPage); // 현재 페이지 데이터 다시 로드
      setNewsItems(newsData);

      // 체크박스 상태 초기화
      setSelectedNewsIds([]);
      setIsSelectAll(false);

      setCrawlingStatus('');
      alert(`${pendingSelectedIds.length}개의 AI 분석되지 않은 뉴스가 삭제되었습니다.`);

    } catch (error) {
      console.error('Delete news error:', error);
      setCrawlingStatus('');
      alert('뉴스 삭제 중 오류가 발생했습니다: ' + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };



  // 분석 완료된 뉴스 자동 뉴스 관리로 전송
  const handleAutoSendCompleted = useCallback(async () => {
    const completedNews = newsItems.filter(news =>
      news.status === 'REVIEW_PENDING' && news.analysisProgress === 100
    );

    if (completedNews.length === 0) {
      return;
    }

    try {
      console.log(`${completedNews.length}개의 완료된 뉴스를 자동으로 뉴스 관리로 전송 중...`);

      // 각 완료된 뉴스를 REVIEW_PENDING 상태로 변경
      const updatePromises = completedNews.map(async (news) => {
        const response = await fetch(`${getBackendApiBase()}/news/${news.id}/status?status=REVIEW_PENDING`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          console.error(`뉴스 ID ${news.id} 자동 전송 실패`);
          return null;
        }

        return response.json();
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(result => result !== null).length;

      if (successCount > 0) {
        // 전송 성공한 뉴스들을 AI 관리에서 제거
        const successNewsIds = completedNews.slice(0, successCount).map(news => news.id);
        setNewsItems(prev => prev.filter(news => !successNewsIds.includes(news.id)));

        console.log(`✅ ${successCount}개의 뉴스가 자동으로 뉴스 관리로 전송되었습니다.`);

        // 사용자에게 알림 (선택적)
        if (successCount >= 3) { // 3개 이상일 때만 알림
          alert(`🤖 AI 분석이 완료된 ${successCount}개의 뉴스가 자동으로 뉴스 관리로 전송되었습니다.`);
        }
      }

    } catch (error) {
      console.error('자동 전송 중 오류:', error);
    }
  }, [newsItems]);

  // 완료된 뉴스 자동 전송 (3초마다 체크, 더 빠른 전송)
  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoSendCompleted();
    }, 3000); // 3초마다 체크 (더 빠르게)

    return () => clearInterval(interval);
  }, [handleAutoSendCompleted]);

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

  // 상태별 라벨
  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '대기중';
      case 'PROCESSING': return 'AI분석중';
      case 'REVIEW_PENDING': return '분석완료';
      case 'APPROVED': return '승인됨';
      case 'REJECTED': return '거부됨';
      default: return '알수없음';
    }
  };

  // 상태별 배지 타입
  const getStatusBadgeType = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'pending' as const;
      case 'PROCESSING': return 'processing' as const;
      case 'REVIEW_PENDING': return 'completed' as const;
      case 'APPROVED': return 'completed' as const;
      case 'REJECTED': return 'rejected' as const;
      default: return 'pending' as const;
    }
  };


  if (loading) {
    return (
      <div className="admin-fade-in">
        <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800 admin-mb-6">AI 뉴스분석 (Gemini AI로 실제 분석합니다)</h1>
        <div className="admin-flex-center admin-loading-container">
          <p className="admin-text-gray-500">데이터를 로드하는 중...</p>
        </div>
      </div>
    );
  }

  const pendingNews = filteredNewsItems.filter(news => news.status?.toUpperCase() === 'PENDING');
  const processingNews = filteredNewsItems.filter(news => news.status?.toUpperCase() === 'PROCESSING');

  // 페이징 계산 (전체 뉴스 수 기준으로 수정)
  const totalItems = totalNewsCount; // 실제 전체 뉴스 수 사용
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNewsItems = filteredNewsItems.slice(0, itemsPerPage); // 현재 로드된 데이터에서 표시

  // 페이지 변경 핸들러
  const handlePageChange = async (page: number) => {
    console.log(`AIManagement handlePageChange called with page: ${page}`);
    
    // 즉시 페이지 상태 업데이트 (UI 반응성을 위해)
    setCurrentPage(page);
    
    // 체크박스 상태 초기화
    setSelectedNewsIds([]);
    setIsSelectAll(false);

    // 약간의 지연 후 데이터 로드 (상태 업데이트가 UI에 반영되도록)
    setTimeout(async () => {
      setLoading(true);
      
      try {
        // 새 페이지 데이터 로드
        const newsData = await loadNewsData(page - 1, itemsPerPage);
        setNewsItems(newsData);
      } catch (error) {
        console.error('Page change data load failed:', error);
      } finally {
        setLoading(false);
      }
    }, 0);
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-flex-between admin-mb-6">
        <div>
          <div className="admin-header-flex">
            <h1 className="admin-text-2xl admin-font-bold admin-text-gray-800">AI 뉴스분석</h1>
            <div className="admin-status-flex">
              <span className="admin-text-sm">크롤링:</span>
              <span
                className={`admin-text-xs admin-font-medium admin-status-badge`}
                style={{
                  backgroundColor:
                    (isManualCrawling || isScheduleCrawling) ? '#dbeafe' : '#d1fae5',
                  color:
                    (isManualCrawling || isScheduleCrawling) ? '#1d4ed8' : '#059669'
                }}
              >
                {(isManualCrawling || isScheduleCrawling) ?
                  `🔵 실행중(남은시간:${Math.floor((manualRemainingTime || scheduleRemainingTime) / 60).toString().padStart(2, '0')}:${((manualRemainingTime || scheduleRemainingTime) % 60).toString().padStart(2, '0')})` :
                  '🟢 대기중'
                }
              </span>
            </div>
          </div>
        </div>
        <div className="admin-buttons-flex">
          {/* AI 분석 버튼 그룹 */}
          <div className="admin-button-group">
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => handleStartAnalysisWithType('COMPREHENSIVE')}
              disabled={actionLoading}
              title="종합분석: 사실성, 편향성, 전체 요약을 포함한 완전한 분석"
            >
              <i className={`fas ${actionLoading ? 'fa-spinner fa-spin' : 'fa-brain'} mr-2`}></i>
              🧠 종합분석
              {(() => {
                const pendingCount = selectedNewsIds.filter(id => {
                  const news = newsItems.find(item => item.id === id);
                  return news?.status === 'PENDING';
                }).length;
                return pendingCount > 0 ? ` (${pendingCount})` : '';
              })()}
            </button>
            
            <button
              className="admin-btn admin-btn-info"
              onClick={() => handleStartAnalysisWithType('FACT_ANALYSIS')}
              disabled={actionLoading}
              title="사실분석: 팩트체크에 중점을 둔 분석"
            >
              <i className={`fas ${actionLoading ? 'fa-spinner fa-spin' : 'fa-search'} mr-2`}></i>
              🔍 사실분석
              {(() => {
                const pendingCount = selectedNewsIds.filter(id => {
                  const news = newsItems.find(item => item.id === id);
                  return news?.status === 'PENDING';
                }).length;
                return pendingCount > 0 ? ` (${pendingCount})` : '';
              })()}
            </button>
            
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => handleStartAnalysisWithType('BIAS_ANALYSIS')}
              disabled={actionLoading}
              title="편향성분석: 미디어 편향과 중립성 분석에 중점"
            >
              <i className={`fas ${actionLoading ? 'fa-spinner fa-spin' : 'fa-balance-scale'} mr-2`}></i>
              ⚖️ 편향성분석
              {(() => {
                const pendingCount = selectedNewsIds.filter(id => {
                  const news = newsItems.find(item => item.id === id);
                  return news?.status === 'PENDING';
                }).length;
                return pendingCount > 0 ? ` (${pendingCount})` : '';
              })()}
            </button>
          </div>

          {/* 크롤링 버튼 */}
          <button
            className={`admin-btn admin-btn-info admin-crawling-btn`}
            onClick={handleCrawlNews}
            disabled={actionLoading || isManualCrawling || isScheduleCrawling}
            title={(isManualCrawling || isScheduleCrawling) ? "크롤링이 진행 중입니다. 완료 후 다시 시도해주세요." : "뉴스를 크롤링하여 새로운 데이터를 수집합니다"}
            style={{
              color: 'white',
              cursor: (actionLoading || isManualCrawling || isScheduleCrawling) ? 'not-allowed' : 'pointer'
            }}
          >
            <i className={`fas ${(actionLoading || isManualCrawling || isScheduleCrawling) ? 'fa-spinner fa-spin' : 'fa-download'} mr-2`}></i>
            {(isManualCrawling || isScheduleCrawling) ? '크롤링 중...' : '뉴스 크롤링'}
          </button>

          {/* 뉴스삭제 버튼 */}
          <button
            className={`admin-btn admin-btn-warning admin-delete-btn`}
            onClick={handleClearData}
            disabled={actionLoading || selectedNewsIds.length === 0}
            title={selectedNewsIds.length === 0 ?
              "삭제할 뉴스를 먼저 선택해주세요" :
              "선택된 AI 분석되지 않은 뉴스(분석 대기중)를 삭제합니다"
            }
            style={{
              color: 'white',
              cursor: (actionLoading || selectedNewsIds.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            <i className={`fas ${actionLoading ? 'fa-spinner fa-spin' : 'fa-trash-alt'} mr-2`}></i>
            뉴스삭제
            {(() => {
              const pendingCount = selectedNewsIds.filter(id => {
                const news = newsItems.find(item => item.id === id);
                return news?.status?.toUpperCase() === 'PENDING';
              }).length;
              return pendingCount > 0 ? ` (${pendingCount}개)` : '';
            })()}
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="admin-grid admin-grid-cols-3 admin-gap-6 admin-mb-6">
        <div className="admin-stat-card">
          <div className="admin-stat-flex">
            <div className="admin-stat-icon admin-bg-blue-100">
              <i className="fas fa-clock admin-text-blue-600"></i>
            </div>
            <div className="admin-stat-label">분석 대기</div>
            <div className="admin-stat-number">{pendingNews.length}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-flex">
            <div className="admin-stat-icon admin-bg-yellow-100">
              <i className="fas fa-cogs admin-text-yellow-600"></i>
            </div>
            <div className="admin-stat-label">AI 분석중</div>
            <div className="admin-stat-number">{processingNews.length}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-flex">
            <div className={`admin-stat-icon ${isScheduleCrawling ? 'admin-bg-blue-100' : 'admin-bg-gray-100'}`}>
              <i className={`fas fa-newspaper ${isScheduleCrawling ? 'admin-text-blue-600' : 'admin-text-gray-600'}`}></i>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-label">전체 뉴스</div>
              {isScheduleCrawling && (
                <div className="admin-text-xs admin-text-blue-600 admin-progress-text">
                  <i className="fas fa-spinner fa-spin mr-1"></i>
                  {scheduleCrawlingProgress === 0 ? '스케줄 크롤링 중...' : `스케줄 크롤링 ${scheduleCrawlingProgress}%`}
                  {scheduleRemainingTime > 0 && ` (약 ${scheduleRemainingTime}분 남음)`}
                </div>
              )}
            </div>
            <div className="admin-stat-number">{newsItems.length}</div>
            {(isScheduleCrawling || isManualCrawling) && (
              <div className="admin-ml-2">
                <div className="admin-progress-bar" style={{
                  width: '60px',
                  height: '6px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div
                    className="admin-progress-fill"
                    style={{
                      width: `${manualCrawlingProgress}%`,
                      height: '100%',
                      backgroundColor: '#06b6d4',
                      transition: 'width 0.5s ease'
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="admin-card admin-mb-6">
        <div className="admin-card-content" >
          <div className="admin-category-tabs">
            {categories.map(category => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`admin-category-tab ${selectedCategory === category.key ? 'active' : 'inactive'
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 뉴스 목록 */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-flex-between">
            <div className="admin-stat-flex">
              <input
                type="checkbox"
                checked={isSelectAll}
                onChange={handleSelectAll}
                disabled={currentNewsItems.length === 0 || actionLoading}
                style={{ width: '16px', height: '16px' }}
              />
              <h3 className="admin-text-lg admin-font-medium">
                AI 분석 뉴스 목록 (전체 {totalItems}개, {currentPage}/{totalPages} 페이지)
              </h3>
            </div>
            {selectedNewsIds.length > 0 && (
              <span className="admin-text-sm admin-text-blue-600">
                {selectedNewsIds.length}개 선택됨
              </span>
            )}
          </div>
        </div>

        <div className="admin-card-content">
          {newsItems.length === 0 ? (
            <div className="admin-text-center admin-py-8">
              <i className="fas fa-newspaper fa-2x admin-text-gray-400 admin-mb-4"></i>
              <p className="admin-text-gray-500">수집된 뉴스가 없습니다.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentNewsItems.map(news => (
                <div key={news.id} className="admin-border admin-rounded-lg admin-p-4">
                  <div className="admin-flex-between admin-mb-3">
                    <div className="admin-flex" style={{ alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={selectedNewsIds.includes(news.id)}
                        onChange={() => toggleSelectNews(news.id)}
                        disabled={actionLoading}
                        style={{
                          width: '16px',
                          height: '16px',
                          opacity: 1,
                          marginTop: '2px'
                        }}
                      />

                      {/* 썸네일 이미지 */}
                      {news.thumbnail && (
                        <div style={{
                          width: '80px',
                          height: '60px',
                          borderRadius: '6px',
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

                      <div style={{ flex: 1 }}>
                        <h4 className="admin-text-md admin-font-medium admin-text-gray-900"
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '4px'
                          }}
                          title={`[${news.id}] ${news.title}`}
                        >
                          [{news.id}] {news.title}
                        </h4>
                        <div className="admin-flex" style={{ alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <StatusBadge
                            status={getStatusBadgeType(news.status)}
                            text={getStatusLabel(news.status)}
                          />
                          {news.status === 'PROCESSING' && news.analysisProgress !== undefined && (
                            <div className="admin-flex" style={{ alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '100px',
                                height: '8px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${news.analysisProgress}%`,
                                  height: '100%',
                                  backgroundColor: '#3b82f6',
                                  transition: 'width 0.3s ease'
                                }}></div>
                              </div>
                              <span className="admin-text-xs admin-text-gray-600">
                                {news.analysisProgress}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="admin-text-sm admin-text-gray-600 admin-mb-3" style={{ lineHeight: '1.5' }}>
                    {news.content.length > 200 ? `${news.content.substring(0, 200)}...` : news.content}
                  </p>

                  {/* AI 분석 결과 표시 (완료된 경우) */}
                  {news.status === 'REVIEW_PENDING' && news.summary && (
                    <div className="admin-mb-3" style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                      <h5 className="admin-text-sm admin-font-medium admin-text-gray-900 admin-mb-2">AI 분석 결과</h5>
                      <div className="admin-text-sm admin-text-gray-700" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>요약:</strong> {news.summary}</div>
                        {news.claim && <div><strong>핵심 주장:</strong> {news.claim}</div>}
                        {news.keywords && <div><strong>키워드:</strong> {news.keywords}</div>}
                        {news.autoQuestion && <div><strong>자동 질문:</strong> {news.autoQuestion}</div>}
                        {news.reliabilityScore && (
                          <div><strong>신뢰도:</strong> {news.reliabilityScore}점 (AI 신뢰도: {news.aiConfidence}%)</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 에러 메시지 표시 (실패한 경우) */}
                  {news.status === 'REJECTED' && news.errorMessage && (
                    <div className="admin-mb-3" style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                      <h5 className="admin-text-sm admin-font-medium admin-text-red-900 admin-mb-2">분석 실패</h5>
                      <div className="admin-text-sm admin-text-red-700">{news.errorMessage}</div>
                    </div>
                  )}

                  <div className="admin-flex admin-text-sm admin-text-gray-500" style={{ gap: '16px' }}>
                    <span><i className="fas fa-building mr-1"></i> {news.source} / {news.publisher}</span>
                    <span><i className="fas fa-folder mr-1"></i> {news.category}</span>
                    <span><i className="fas fa-clock mr-1"></i> {formatDateTime(news.createdAt)}</span>
                    <span><i className="fas fa-link mr-1"></i><a href={news.url} target="_blank" rel="noopener noreferrer" className="admin-text-blue-600 hover:admin-text-blue-800"> 원문 보기</a></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 페이징 - 뉴스가 있을 때 항상 표시 */}
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              maxVisiblePages={10}
            />
          )}
        </div>
      </div>

    </div>
  );
};

export default AIManagement;