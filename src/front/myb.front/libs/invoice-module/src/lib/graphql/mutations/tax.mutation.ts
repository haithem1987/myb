import gql from 'graphql-tag';

export const CREATE_TAX = gql`
  mutation AddTax($item: TaxInput!) {
    addTax(tax: $item) {
      createdAt
      id
      isPercentage
      name
      updatedAt
      value
    }
  }
`;
