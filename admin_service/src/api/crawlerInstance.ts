import axios from 'axios';

// 크롤러 서비스 전용 axios 인스턴스 (포트 3002)
const crawlerInstance = axios.create({
  baseURL: 'http://localhost:3002',
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