const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API 프록시 설정 (백엔드 서비스)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://backend-service:8080', // Docker 환경에서는 서비스명 사용
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 사용자 서비스 프록시 요청:', req.method, req.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ 사용자 서비스 프록시 응답:', proxyRes.statusCode, req.path);
      },
      onError: (err, req, res) => {
        console.error('❌ 사용자 서비스 프록시 에러:', err.message, req.path);
      }
    })
  );
};
