// Environment configuration for production (Railway deployment)
export const environment = {
  production: true,
  apiBaseUrl: window.location.origin,

  // Service URLs - Point to Railway services using Railway's service references
  services: {
    keycloak: {
      url: 'https://keycloak-production-2591.up.railway.app',
      realm: 'MYB',
      clientId: 'MYB-client',
    },
    coproperty: {
      graphqlUrl: 'https://myb-syndic-production.up.railway.app/graphql',
      baseUrl: 'https://myb-syndic-production.up.railway.app',
    },
    payment: {
      baseUrl: 'https://payment-service.up.railway.app', // Update when deployed
      apiPath: '/api/payment',
    },
    document: {
      graphqlUrl: 'https://document-service.up.railway.app/graphql', // Update when deployed
      baseUrl: 'https://document-service.up.railway.app',
    },
    invoice: {
      graphqlUrl: 'https://invoice-service.up.railway.app/graphql', // Update when deployed
      baseUrl: 'https://invoice-service.up.railway.app',
    },
    timesheet: {
      baseUrl: 'https://timesheet-service.up.railway.app', // Update when deployed
    },
    notification: {
      baseUrl: 'https://notification-service.up.railway.app', // Update when deployed
    },
  },
};
