const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API 프록시 설정 (nginx를 통한 백엔드 서비스)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://nginx:80', // nginx를 통해 백엔드 서비스로 프록시
      changeOrigin: true
    })
  );
};
