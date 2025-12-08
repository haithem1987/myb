import gql from 'graphql-tag';

export const CREATE_PRODUCT = gql`
  mutation AddProduct($item: ProductInput!) {
    addProduct(product: $item) {
      companyId
      createdAt
      description
      id
      isArchived
      name
      price
      productType
      taxId
      unit
      updatedAt
      userId
      tax {
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
  }
`;
export const UPDATE_PRODUCT = gql`
  mutation updateProduct($item: ProductInput!) {
    updateProduct(product: $item) {
      companyId
      createdAt
      description
      id
      isArchived
      name
      price
      productType
      taxId
      unit
      updatedAt
      userId
      tax {
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
  }
`;
