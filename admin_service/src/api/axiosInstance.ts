import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api', // 환경변수 사용
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
      port: window.location.port
    });
    
    const token = localStorage.getItem('adminToken');
    const adminId = localStorage.getItem('adminId');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Admin-Id 헤더 추가 (백엔드 API에서 요구)
    if (adminId) {
      config.headers['Admin-Id'] = adminId;
    } else {
      // 임시로 기본 Admin ID 설정 (개발용)
      config.headers['Admin-Id'] = '1';
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
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
