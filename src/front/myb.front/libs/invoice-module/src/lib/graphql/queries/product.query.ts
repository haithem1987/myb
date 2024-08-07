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
export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: Int!) {
    productByID(id: $id) {
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
