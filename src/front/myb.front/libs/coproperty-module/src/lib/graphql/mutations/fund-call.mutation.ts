import gql from 'graphql-tag';

export const CREATE_FUND_CALL = gql`
  mutation CreateFundCall($input: CreateFundCallInput!) {
    createFundCall(input: $input) {
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

export const UPDATE_FUND_CALL = gql`
  mutation UpdateFundCall($id: UUID!, $input: CreateFundCallInput!) {
    updateFundCall(id: $id, input: $input) {
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

export const DELETE_FUND_CALL = gql`
  mutation DeleteFundCall($id: UUID!) {
    deleteFundCall(id: $id)
  }
`;

export const GENERATE_INVOICES_FROM_FUND_CALL = gql`
  mutation GenerateInvoicesFromFundCall($fundCallId: UUID!) {
    generateInvoicesFromFundCall(fundCallId: $fundCallId) {
      id
      invoiceNumber
      totalAmount
      status
    }
  }
`;
