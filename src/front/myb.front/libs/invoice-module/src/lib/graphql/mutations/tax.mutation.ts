import gql from 'graphql-tag';

export const CREATE_TAX = gql`
  mutation AddTax($item: TaxInput!) {
    addTax(tax: $item) {
      createdAt
      id
      name
      updatedAt
      value
      isPercentage
      isArchived
      companyId
      userId
    }
  }
`;
export const UPDATE_TAX = gql`
  mutation updateTax($item: TaxInput!) {
    updateTax(tax: $item) {
     createdAt
      id
      name
      updatedAt
      value
      isPercentage
      isArchived
      companyId
      userId
    }
  }
`;
