export const getBackendApiBase = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;

  // 운영환경 (polradar.com)
  if (hostname === 'polradar.com' || hostname === 'www.polradar.com') {
    return '/api';
  }

  // 개발환경 - 직접 접근 (localhost:3001)
  if (hostname === 'localhost' && port === '3001') {
    return 'http://localhost:8080/api';
  }

  // 개발환경 - nginx 통해서 (localhost:80 또는 localhost)
  if (hostname === 'localhost' && (port === '80' || port === '')) {
    return '/api';
  }

  // 기본값: nginx 프록시 경유
  return '/api';
};