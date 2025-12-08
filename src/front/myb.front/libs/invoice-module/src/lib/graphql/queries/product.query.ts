import gql from 'graphql-tag';

export const GET_ALL_PRODUCTS = gql`
  query GetAllProducts {
    allProducts {
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
export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: Int!) {
    productByID(id: $id) {
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
