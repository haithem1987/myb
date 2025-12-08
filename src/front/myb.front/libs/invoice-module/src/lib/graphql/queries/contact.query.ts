import gql from 'graphql-tag';

export const GET_ALL_CONTACTS = gql`
  allContacts {
    clientID
    createdAt
    credentials
    id
    type
    updatedAt
  }
`;
