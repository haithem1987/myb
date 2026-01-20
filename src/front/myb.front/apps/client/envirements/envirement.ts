export const environment = {
  production: false,
  baseUri: 'http://localhost:8088',  // Coproperty service
  
  // Service endpoints (all with CORS enabled)
  services: {
    coproperty: 'http://localhost:8088/graphql',
    invoice: 'http://localhost:8083/graphql',
    timesheet: 'http://localhost:8082/graphql',
    document: 'http://localhost:8086/graphql',
    payment: 'http://localhost:8084',
    notification: 'http://localhost:8085',
    keycloak: 'http://localhost:8080'
  },
  
  // Keycloak config
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'MYB',
    clientId: 'MYB-client'
  }
};
