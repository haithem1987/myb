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
      isArchived
      companyId
      userId
    }
  }
`;
export const GET_Tax_BY_ID = gql`
  query GetTaxByID($id: Int!) {
    taxByID(id: $id) {
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
