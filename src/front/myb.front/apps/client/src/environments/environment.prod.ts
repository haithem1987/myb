// Environment configuration for production (Docker)
export const environment = {
  production: true,
  apiBaseUrl: window.location.origin,

  // Service URLs - Use relative paths for Docker environment
  services: {
    keycloak: {
      url: window.location.origin.replace(/:\d+/, ':8080'),
      realm: 'MYB',
      clientId: 'MYB-client',
    },
    payment: {
      baseUrl: `${window.location.origin.replace(/:\d+/, ':8084')}`,
      apiPath: '/api/payment',
    },
    document: {
      graphqlUrl: `${window.location.origin.replace(/:\d+/, ':8086')}/graphql`,
      baseUrl: `${window.location.origin.replace(/:\d+/, ':8086')}`,
    },
    invoice: {
      graphqlUrl: `${window.location.origin.replace(/:\d+/, ':8083')}/graphql`,
      baseUrl: `${window.location.origin.replace(/:\d+/, ':8083')}`,
    },
    timesheet: {
      baseUrl: `${window.location.origin.replace(/:\d+/, ':8082')}`,
    },
    notification: {
      baseUrl: `${window.location.origin.replace(/:\d+/, ':8085')}`,
    },
    coproperty: {
      baseUrl: `${window.location.origin.replace(/:\d+/, ':8088')}`,
    },
  },

  // Production uses relative paths and CORS
  proxyPaths: {
    payment: '/api/payment',
    auth: '/auth',
    admin: '/admin/realms',
  },
};
