// Environment for local Docker Compose deployment.
// All API calls go to relative paths; nginx inside the container proxies them to the right service.
// Keycloak is accessed directly by the browser on localhost:8080.
export const environment = {
  production: true,
  apiBaseUrl: window.location.origin,

  app: {
    currentApp: 'admin' as const,
    adminUrl: window.location.origin,
    clientUrl: window.location.origin,
  },

  services: {
    keycloak: {
      url: 'http://localhost:8080',
      adminUrl: 'http://localhost:8080',
      realm: 'MYB',
      clientId: 'MYB-client',
    },
    coproperty: {
      graphqlUrl: '/api/coproperty/graphql',
      baseUrl: '/api/coproperty',
    },
    payment: {
      baseUrl: '',
      apiPath: '/api/payment',
    },
    document: {
      graphqlUrl: '/api/document/graphql',
      baseUrl: '/api/document',
    },
    invoice: {
      graphqlUrl: '/api/invoice/graphql',
      baseUrl: '/api/invoice',
    },
    timesheet: {
      baseUrl: '/api/timesheet',
    },
    notification: {
      baseUrl: '/api/notification',
    },
  },
};
