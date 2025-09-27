import axios from 'axios';

// 환경에 따른 API URL 설정
const getBaseURL = () => {
  // 브라우저 환경에서만 window 객체 사용
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;

    // 운영환경 - polradar.com 도메인
    if (hostname === 'polradar.com' || hostname === 'www.polradar.com') {
      return '/api';  // nginx 프록시를 통한 접근
    }

    // 개발환경 - 직접 접근 (localhost:3001)
    if (hostname === 'localhost' && port === '3001') {
      return 'http://localhost:8080/api';
    }

    // 개발환경 - nginx 통해서 (localhost:80 또는 localhost)
    if (hostname === 'localhost' && (port === '80' || port === '')) {
      return '/api';
    }
  }

  // 기본값: nginx 프록시 경유
  return '/api';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🚀 API 요청:', {
      baseURL: config.baseURL,
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      port: typeof window !== 'undefined' ? window.location.port : 'unknown'
    });
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const adminId = typeof window !== 'undefined' ? localStorage.getItem('adminId') : null;
    
    if (token) {
      config.headers!.Authorization = `Bearer ${token}`;
    }

    // Admin-Id 헤더 추가 (백엔드 API에서 요구)
    if (adminId) {
      config.headers!['Admin-Id'] = adminId;
    } else {
      // 임시로 기본 Admin ID 설정 (개발용)
      config.headers!['Admin-Id'] = '1';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
