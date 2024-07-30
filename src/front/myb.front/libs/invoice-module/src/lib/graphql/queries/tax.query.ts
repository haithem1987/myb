import gql from 'graphql-tag';

export const GET_ALL_Taxes = gql`
  query GetAllTaxes {
    allTaxes {
        createdAt
        id
        name
        updatedAt
        value
        isPercentage
    }
  }
`;