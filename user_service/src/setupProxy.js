const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API 프록시 설정 (백엔드 서비스)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://backend-service:8080', // Docker 네트워크 환경
      changeOrigin: true
    })
  );
};
