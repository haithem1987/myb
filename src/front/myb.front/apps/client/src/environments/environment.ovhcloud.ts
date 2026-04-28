// Environment configuration for OVHCloud Kubernetes deployment
// All service URLs are relative to the ingress domain (window.location.origin)
export const environment = {
  production: true,
  apiBaseUrl: window.location.origin,

  services: {
    keycloak: {
      url: `${window.location.origin}/auth`,
      realm: 'MYB',
      clientId: 'MYB-client',
    },
    coproperty: {
      baseUrl: `${window.location.origin}/api/coproperty`,
    },
    invoice: {
      graphqlUrl: `${window.location.origin}/api/invoice/graphql`,
      baseUrl: `${window.location.origin}/api/invoice`,
    },
    payment: {
      baseUrl: `${window.location.origin}/api/payment`,
      apiPath: '/api/payment',
    },
    document: {
      graphqlUrl: `${window.location.origin}/api/document/graphql`,
      baseUrl: `${window.location.origin}/api/document`,
    },
    timesheet: {
      baseUrl: `${window.location.origin}/api/timesheet`,
    },
    notification: {
      baseUrl: `${window.location.origin}/api/notification`,
    },
  },
};
