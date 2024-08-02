import gql from 'graphql-tag';

export const GET_ALL_PRODUCTS = gql`
  query GetAllProducts {
    allProducts {
      createdAt
      description
      id
      name
      price
      productType
      taxId
      unit
      updatedAt
    }
  }
`;
