// Environment configuration for production (Railway deployment)
export const environment = {
  production: true,
  apiBaseUrl: 'https://myb-client-production.up.railway.app',

  // Service URLs - Point to Railway services
  services: {
    keycloak: {
      url: 'https://keycloak-production.up.railway.app',
      realm: 'MYB',
      clientId: 'MYB-client',
    },
    coproperty: {
      graphqlUrl: 'https://myb-syndic-production.up.railway.app/graphql',
      baseUrl: 'https://myb-syndic-production.up.railway.app',
    },
    payment: {
      baseUrl: 'https://payment-production.up.railway.app',
      apiPath: '/api/payment',
    },
    document: {
      graphqlUrl: 'https://document-production.up.railway.app/graphql',
      baseUrl: 'https://document-production.up.railway.app',
    },
    invoice: {
      graphqlUrl: 'https://invoice-production.up.railway.app/graphql',
      baseUrl: 'https://invoice-production.up.railway.app',
    },
    timesheet: {
      baseUrl: 'https://timesheet-production.up.railway.app',
    },
    notification: {
      baseUrl: 'https://notification-production.up.railway.app',
    },
  },
};
