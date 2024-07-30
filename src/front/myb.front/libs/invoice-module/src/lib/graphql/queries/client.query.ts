import gql from 'graphql-tag';

export const GET_ALL_CLIENTS = gql`
  query {
    allClients {
      address
      clientType
      createdAt
      firstName
      id
      lastName
      updatedAt
      contacts {
        clientID
        createdAt
        credentials
        id
        type
        updatedAt
      }
    }
  }
`;
