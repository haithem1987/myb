import gql from 'graphql-tag';

export const CREATE_CLIENT = gql`
  mutation AddClient($item: ClientInput!) {
    addClient(client: $item) {
      address
      clientType
      createdAt
      firstName
      isArchived
      companyId
      userId
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

export const UPDATE_CLIENT = gql`
  mutation updateClient($item: ClientInput!) {
    updateClient(client: $item) {
      address
      clientType
      createdAt
      firstName
      isArchived
      companyId
      userId
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
