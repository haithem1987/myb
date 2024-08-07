import gql from 'graphql-tag';

export const CREATE_PRODUCT = gql`
  mutation AddProduct($item: ProductInput!) {
    addProduct(product: $item) {
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
