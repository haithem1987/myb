const proxy = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    proxy('/auth', {
      target: 'https://www.keycloak.forlink-group.com',
      secure: false,
      changeOrigin: true,
      pathRewrite: {
        '^/auth': '',
      },
      logLevel: 'debug',
      onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] =
          'http://localhost:4200';
        proxyRes.headers['Access-Control-Allow-Methods'] =
          'GET, POST, PUT, DELETE, PATCH, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] =
          'Origin, X-Requested-With, Content-Type, Accept, Authorization';
      },
    })
  );

  app.use(
    proxy('/realms', {
      target: 'https://www.keycloak.forlink-group.com',
      secure: false,
      changeOrigin: true,
      logLevel: 'debug',
      onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] =
          'http://localhost:4200';
        proxyRes.headers['Access-Control-Allow-Methods'] =
          'GET, POST, PUT, DELETE, PATCH, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] =
          'Origin, X-Requested-With, Content-Type, Accept, Authorization';
      },
    })
  );
};
