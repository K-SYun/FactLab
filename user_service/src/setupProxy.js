const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API 프록시 설정 (nginx를 통한 백엔드 접근)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://nginx:80',
      changeOrigin: true,
      timeout: 30000,
      proxyTimeout: 30000,
      onError: (err, req, res) => {
        console.error('Proxy Error:', err.message);
        if (!res.headersSent) {
          res.status(504).json({ 
            error: 'Gateway Timeout',
            message: err.message 
          });
        }
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url} → nginx:80${req.url}`);
      }
    })
  );
};
