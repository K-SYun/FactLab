export interface AIAnalysisLogEntry {
  timestamp: string;
  newsId: number;
  newsTitle: string;
  analysisType: 'initial' | 'reanalysis';
  status: 'started' | 'completed' | 'failed';
  data?: {
    // AI 분석 요청 데이터
    requestData?: {
      title: string;
      content: string;
      url: string;
      source: string;
      category: string;
    };
    // AI 분석 응답 데이터
    responseData?: {
      aiSummary: string;
      aiKeywords: string[];
      reliabilityScore: number;
      confidenceScore: number;
      sentiment: string;
      factCheck: string;
      reliability: number;
    };
    // API 호출 정보
    apiInfo?: {
      endpoint: string;
      method: string;
      statusCode?: number;
      responseTime?: number;
    };
    // 에러 정보
    error?: {
      message: string;
      stack?: string;
      code?: string;
    };
  };
}

class AIAnalysisLogger {
  private logs: AIAnalysisLogEntry[] = [];
  private readonly LOG_KEY = 'factlab_ai_analysis_logs';
  private readonly MAX_LOGS = 1000; // 최대 로그 수

  constructor() {
    this.loadLogs();
  }

  // 로그 추가
  addLog(entry: Omit<AIAnalysisLogEntry, 'timestamp'>): void {
    const logEntry: AIAnalysisLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    this.logs.unshift(logEntry); // 최신 로그를 앞에 추가

    // 최대 로그 수 제한
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // 콘솔에 로그 출력 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(logEntry);
    }

    // 로컬 스토리지에 저장
    this.saveLogs();
  }

  // AI 분석 시작 로그
  logAnalysisStart(newsId: number, newsTitle: string, analysisType: 'initial' | 'reanalysis', requestData?: any): void {
    this.addLog({
      newsId,
      newsTitle,
      analysisType,
      status: 'started',
      data: {
        requestData
      }
    });
  }

  // AI 분석 완료 로그
  logAnalysisComplete(newsId: number, newsTitle: string, analysisType: 'initial' | 'reanalysis', responseData: any, apiInfo?: any): void {
    this.addLog({
      newsId,
      newsTitle,
      analysisType,
      status: 'completed',
      data: {
        responseData,
        apiInfo
      }
    });
  }

  // AI 분석 실패 로그
  logAnalysisError(newsId: number, newsTitle: string, analysisType: 'initial' | 'reanalysis', error: any, apiInfo?: any): void {
    this.addLog({
      newsId,
      newsTitle,
      analysisType,
      status: 'failed',
      data: {
        error: {
          message: error.message || String(error),
          stack: error.stack,
          code: error.code
        },
        apiInfo
      }
    });
  }

  // 로그 조회
  getLogs(filter?: {
    newsId?: number;
    status?: 'started' | 'completed' | 'failed';
    analysisType?: 'initial' | 'reanalysis';
    limit?: number;
  }): AIAnalysisLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.newsId) {
        filteredLogs = filteredLogs.filter(log => log.newsId === filter.newsId);
      }
      if (filter.status) {
        filteredLogs = filteredLogs.filter(log => log.status === filter.status);
      }
      if (filter.analysisType) {
        filteredLogs = filteredLogs.filter(log => log.analysisType === filter.analysisType);
      }
      if (filter.limit) {
        filteredLogs = filteredLogs.slice(0, filter.limit);
      }
    }

    return filteredLogs;
  }

  // 로그 통계
  getLogStats(): {
    total: number;
    started: number;
    completed: number;
    failed: number;
    byAnalysisType: {
      initial: number;
      reanalysis: number;
    };
  } {
    return {
      total: this.logs.length,
      started: this.logs.filter(log => log.status === 'started').length,
      completed: this.logs.filter(log => log.status === 'completed').length,
      failed: this.logs.filter(log => log.status === 'failed').length,
      byAnalysisType: {
        initial: this.logs.filter(log => log.analysisType === 'initial').length,
        reanalysis: this.logs.filter(log => log.analysisType === 'reanalysis').length
      }
    };
  }

  // 로그 지우기
  clearLogs(): void {
    this.logs = [];
    this.saveLogs();
    console.log('🗑️ AI 분석 로그가 모두 삭제되었습니다.');
  }

  // 로그 내보내기 (JSON 형태)
  exportLogs(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      stats: this.getLogStats(),
      logs: this.logs
    }, null, 2);
  }

  // 콘솔에 로그 출력
  private logToConsole(entry: AIAnalysisLogEntry): void {
    const emoji = {
      started: '🚀',
      completed: '✅',
      failed: '❌'
    };

    const typeEmoji = {
      initial: '🆕',
      reanalysis: '🔄'
    };

    console.group(`${emoji[entry.status]} ${typeEmoji[entry.analysisType]} AI 분석 로그 - ${entry.newsTitle} (ID: ${entry.newsId})`);
    console.log('⏰ 시간:', entry.timestamp);
    console.log('📰 뉴스 ID:', entry.newsId);
    console.log('📝 뉴스 제목:', entry.newsTitle);
    console.log('🔄 분석 유형:', entry.analysisType === 'initial' ? '초기 분석' : '재분석');
    console.log('📊 상태:', entry.status);

    if (entry.data) {
      if (entry.data.requestData) {
        console.log('📤 요청 데이터:', entry.data.requestData);
      }
      if (entry.data.responseData) {
        console.log('📥 응답 데이터:', entry.data.responseData);
      }
      if (entry.data.apiInfo) {
        console.log('🌐 API 정보:', entry.data.apiInfo);
      }
      if (entry.data.error) {
        console.error('🚨 오류 정보:', entry.data.error);
      }
    }

    console.groupEnd();
  }

  // 로컬 스토리지에서 로그 불러오기
  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(this.LOG_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('AI 분석 로그 불러오기 실패:', error);
      this.logs = [];
    }
  }

  // 로컬 스토리지에 로그 저장
  private saveLogs(): void {
    try {
      localStorage.setItem(this.LOG_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.warn('AI 분석 로그 저장 실패:', error);
    }
  }
}

// 싱글톤 인스턴스 생성
export const aiAnalysisLogger = new AIAnalysisLogger();

// 개발자 도구용 전역 함수 등록 (개발 환경에서만)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).aiAnalysisLogger = {
    getLogs: (filter?: any) => aiAnalysisLogger.getLogs(filter),
    getStats: () => aiAnalysisLogger.getLogStats(),
    clearLogs: () => aiAnalysisLogger.clearLogs(),
    exportLogs: () => aiAnalysisLogger.exportLogs()
  };
  
  console.log('🔧 개발자 도구에서 aiAnalysisLogger 객체를 사용할 수 있습니다.');
  console.log('   - aiAnalysisLogger.getLogs(): 로그 조회');
  console.log('   - aiAnalysisLogger.getStats(): 로그 통계');
  console.log('   - aiAnalysisLogger.clearLogs(): 로그 삭제');
  console.log('   - aiAnalysisLogger.exportLogs(): 로그 내보내기');
}
