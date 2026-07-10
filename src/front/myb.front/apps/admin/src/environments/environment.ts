// Environment configuration for development
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:4200',

  // App identity & cross-app URLs — easy to change for localhost or production
  app: {
    currentApp: 'admin' as const,
    adminUrl: 'http://localhost:4201',
    clientUrl: 'http://localhost:4200',
  },

  // Service URLs - Use localhost for development
  services: {
    keycloak: {
      url: 'http://localhost:8080',
      adminUrl: 'http://localhost:8080',
      realm: 'MYB',
      clientId: 'MYB-client',
    },
    coproperty: {
      graphqlUrl: 'http://localhost:8088/graphql',
      baseUrl: 'http://localhost:8088',
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
  },
};
