// Environment configuration for development
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:4200',

  // Service URLs - Use relative paths when possible for proxy routing
  services: {
    keycloak: {
      url: 'http://localhost:8080',
      realm: 'MYB',
      clientId: 'MYB-client',
    },
    payment: {
      baseUrl: 'http://localhost:8084',
      apiPath: '/api/payment',
    },
    document: {
      graphqlUrl: 'http://localhost:5117/graphql',
      baseUrl: 'http://localhost:8086',
    },
    invoice: {
      graphqlUrl: 'http://localhost:8083/invoice/graphql',
      baseUrl: 'http://localhost:8083',
    },
    timesheet: {
      baseUrl: 'http://localhost:8082',
    },
    notification: {
      baseUrl: 'http://localhost:8085',
    },
    coproperty: {
      baseUrl: 'http://localhost:8088',
    },
  },

  // Development proxy paths
  proxyPaths: {
    payment: '/api/payment',
    auth: '/auth',
    admin: '/admin/realms',
  },
};
