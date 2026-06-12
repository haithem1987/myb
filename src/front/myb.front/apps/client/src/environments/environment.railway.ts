// Environment configuration for local development (originally Railway, now localhost)
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:4200',

  // Service URLs - Point to localhost services
  services: {
    keycloak: {
      url: 'http://localhost:8080',
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
      graphqlUrl: 'http://localhost:8086/graphql',
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
