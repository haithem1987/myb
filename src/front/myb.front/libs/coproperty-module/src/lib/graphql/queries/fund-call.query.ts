import gql from 'graphql-tag';

export const FUND_CALL_FRAGMENT = gql`
  fragment FundCallFields on FundCall {
    id
    copropertyId
    ownerId
    owner {
      id
      firstName
      lastName
      email
    }
    amount
    dueDate
    description
    status
    isActive
    createdAt
    updatedAt
    currency
    payments {
      id
      fundCallId
      amount
      paymentDate
      justificatif
      createdAt
    }
  }
`;

export const GET_FUND_CALLS_BY_COPROPERTY = gql`
  query GetFundCallsByCoproperty($copropertyId: UUID!, $ownerId: UUID, $year: Int) {
    fundCallsByCoproperty(copropertyId: $copropertyId, ownerId: $ownerId, year: $year) {
      ...FundCallFields
    }
  }
  ${FUND_CALL_FRAGMENT}
`;

export const GET_ALL_FUND_CALLS = gql`
  query GetAllFundCalls {
    allFundCalls {
      ...FundCallFields
    }
  }
  ${FUND_CALL_FRAGMENT}
`;

export const GET_FUND_CALL_BY_ID = gql`
  query GetFundCallById($id: UUID!) {
    fundCall(id: $id) {
      ...FundCallFields
    }
  }
  ${FUND_CALL_FRAGMENT}
`;
