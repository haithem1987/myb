import gql from 'graphql-tag';

export const CREATE_CLIENT = gql`
  mutation AddClient($item: ClientInput!) {
    addClient(client: $item) {
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
