import gql from 'graphql-tag';

export const CREATE_CHARGE = gql`
  mutation CreateCharge($item: CreateChargeInput!) {
    createChargeWithDates(chargeInput: $item) {
      id
      copropertyId
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
      createdBy
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CHARGE = gql`
  mutation UpdateCharge($item: UpdateChargeInput!) {
    updateChargeWithDates(chargeInput: $item) {
      id
      copropertyId
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CHARGE = gql`
  mutation DeleteCharge($id: UUID!) {
    deleteCharge(id: $id)
  }
`;

export const CALCULATE_CHARGE_DISTRIBUTION = gql`
  mutation CalculateChargeDistribution($chargeId: UUID!) {
    distributeCharge(chargeId: $chargeId) {
      unitId
      unitNumber
      amount
      shares
      area
    }
  }
`;
