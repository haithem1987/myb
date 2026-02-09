import gql from 'graphql-tag';

export const GET_ALL_FUND_CALLS = gql`
  query GetAllFundCalls {
    allFundCalls {
      id
      copropertyId
      amount
      dueDate
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_FUND_CALLS_BY_COPROPERTY = gql`
  query GetFundCallsByCoproperty($copropertyId: UUID!) {
    fundCallsByCoproperty(copropertyId: $copropertyId) {
      id
      copropertyId
      amount
      dueDate
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_FUND_CALL_BY_ID = gql`
  query GetFundCallById($id: UUID!) {
    fundCall(id: $id) {
      id
      copropertyId
      amount
      dueDate
      description
      isActive
      createdAt
      updatedAt
    }
  }
`;
