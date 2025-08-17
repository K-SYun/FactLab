import axios from 'axios';

// 환경에 따라 API 기본 URL 설정하는 함수
const getApiBaseURL = () => {
  // nginx 프록시 사용 - CORS 우회
  return 'http://localhost/api';
};

const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터에서 동적으로 baseURL 설정
axiosInstance.interceptors.request.use(
  (config) => {
    // 런타임에 baseURL을 동적으로 설정 (환경 변수보다 우선)
    const dynamicBaseURL = getApiBaseURL();
    config.baseURL = dynamicBaseURL;
    
    console.log('🚀 API 요청:', {
      baseURL: config.baseURL,
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      port: window.location.port
    });
    
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;