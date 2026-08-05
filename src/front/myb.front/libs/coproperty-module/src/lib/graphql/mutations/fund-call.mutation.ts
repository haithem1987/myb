import gql from 'graphql-tag';
import { FUND_CALL_FRAGMENT } from '../queries/fund-call.query';

export const CREATE_FUND_CALL = gql`
  mutation CreateFundCall($input: CreateFundCallInput!) {
    createFundCall(input: $input) {
      id
      copropertyId
      ownerId
      amount
      dueDate
      description
      status
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
      ownerId
      amount
      dueDate
      description
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_FUND_CALL_STATUS = gql`
  mutation UpdateFundCallStatus($id: UUID!, $input: UpdateFundCallInput!) {
    updateFundCallStatus(id: $id, input: $input) {
      id
      status
      updatedAt
    }
  }
`;

export const ADD_FUND_CALL_PAYMENT = gql`
  mutation AddFundCallPayment($fundCallId: UUID!, $input: AddFundCallPaymentInput!) {
    addFundCallPayment(fundCallId: $fundCallId, input: $input) {
      id
      fundCallId
      amount
      paymentDate
      justificatif
      justificatifFileName
      justificatifContentType
      paymentMethod
      validationStatus
      rejectionReason
      createdAt
    }
  }
`;

export const DELETE_FUND_CALL = gql`
  mutation DeleteFundCall($id: UUID!) {
    deleteFundCall(id: $id)
  }
`;

export const CANCEL_FUND_CALL = gql`
  mutation CancelFundCall($id: UUID!, $reason: String!) {
    cancelFundCall(id: $id, reason: $reason) {
      id
      copropertyId
      ownerId
      amount
      dueDate
      description
      status
      isActive
      createdAt
      updatedAt
    }
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

export const REVIEW_FUND_CALL_PAYMENT = gql`
  mutation ReviewFundCallPayment($paymentId: UUID!, $approved: Boolean!, $rejectionReason: String) {
    reviewFundCallPayment(paymentId: $paymentId, approved: $approved, rejectionReason: $rejectionReason) {
      id
      fundCallId
      amount
      validationStatus
      rejectionReason
    }
  }
`;
