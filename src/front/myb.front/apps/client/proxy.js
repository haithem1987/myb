const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const commonProxyConfig = {
    target: 'http://localhost:8080',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyRes: function (proxyRes, req, res) {
      proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:4200';
      proxyRes.headers['Access-Control-Allow-Methods'] =
        'GET, POST, PUT, DELETE, PATCH, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] =
        'Origin, X-Requested-With, Content-Type, Accept, Authorization';
    },
  };

  app.use(
    '/auth',
    createProxyMiddleware({
      ...commonProxyConfig,
      pathRewrite: { '^/auth': '' },
    })
  );

  app.use('/realms', createProxyMiddleware(commonProxyConfig));

  // 👇 Add this to proxy /admin
  app.use('/admin', createProxyMiddleware(commonProxyConfig));
};
