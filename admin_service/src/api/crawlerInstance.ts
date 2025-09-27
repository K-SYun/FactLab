import axios from 'axios';

// 환경에 따른 크롤러 서비스 URL 설정
const getCrawlerBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;

    // 운영환경 - polradar.com 도메인
    if (hostname === 'polradar.com' || hostname === 'www.polradar.com') {
      return '/crawler';  // nginx 프록시를 통한 접근
    }

    // 개발환경 - 직접 접근 (localhost:3001)
    if (hostname === 'localhost' && port === '3001') {
      return 'http://localhost:3002';
    }

    // 개발환경 - nginx 통해서 (localhost:80 또는 localhost)
    if (hostname === 'localhost' && (port === '80' || port === '')) {
      return '/crawler';
    }
  }

  // 기본값: nginx 프록시 경유
  return '/crawler';
};

// 크롤러 서비스 전용 axios 인스턴스
const crawlerInstance = axios.create({
  baseURL: getCrawlerBaseURL(),
  timeout: 30000, // 크롤링은 시간이 오래 걸릴 수 있으므로 타임아웃 증가
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
crawlerInstance.interceptors.request.use(
  (config) => {
    console.log('🕷️ Crawler API 요청:', {
      baseURL: config.baseURL,
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
crawlerInstance.interceptors.response.use(
  (response) => {
    console.log('🕷️ Crawler API 응답:', response.data);
    return response;
  },
  (error) => {
    console.error('🕷️ Crawler API 오류:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default crawlerInstance;