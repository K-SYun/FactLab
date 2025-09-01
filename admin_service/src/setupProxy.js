const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API 프록시 설정 (백엔드 서비스)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://backend-service:8080', // Docker 서비스 이름 사용
      changeOrigin: true,
      timeout: 60000, // 60초 타임아웃
      proxyTimeout: 60000,
      logLevel: 'debug', // 디버그 로그 활성화
      onError: (err, req, res) => {
        console.error('❌ 프록시 에러:', err.message, req.path);
        res.status(502).json({ 
          success: false, 
          message: '백엔드 서버 연결 실패' 
        });
      }
    })
  );

  // AI 서비스 프록시 설정 (API 경로만 프록시)
  app.use(
    '/ai/api',
    createProxyMiddleware({
      target: 'http://ai-service:8001', // Docker 서비스 이름 사용
      changeOrigin: true,
      timeout: 60000, // 60초 타임아웃
      proxyTimeout: 60000,
      logLevel: 'debug',
      pathRewrite: {
        '^/ai': '', // /ai/api/analyze/news/188 -> /api/analyze/news/188
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🤖 AI 프록시 요청:', req.method, req.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ AI 프록시 응답:', proxyRes.statusCode, req.path);
      },
      onError: (err, req, res) => {
        console.error('❌ AI 프록시 에러:', err.message, req.path);
        res.status(502).json({ 
          success: false, 
          message: 'AI 서비스 연결 실패' 
        });
      }
    })
  );

  // 크롤러 서비스 프록시 설정
  app.use(
    '/crawler',
    createProxyMiddleware({
      target: 'http://crawler-service:3002', // Docker 서비스 이름 사용
      changeOrigin: true,
      timeout: 60000, // 60초 타임아웃
      proxyTimeout: 60000,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🕷️ 크롤러 프록시 요청:', req.method, req.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ 크롤러 프록시 응답:', proxyRes.statusCode, req.path);
      },
      onError: (err, req, res) => {
        console.error('❌ 크롤러 프록시 에러:', err.message, req.path);
        res.status(502).json({ 
          success: false, 
          message: '크롤러 서비스 연결 실패' 
        });
      }
    })
  );
};
