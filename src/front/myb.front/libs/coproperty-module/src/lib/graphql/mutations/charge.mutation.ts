import gql from 'graphql-tag';

export const CREATE_CHARGE = gql`
  mutation CreateCharge($item: ChargeInput!) {
    createCharge(charge: $item) {
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

export const UPDATE_CHARGE = gql`
  mutation UpdateCharge($item: ChargeInput!) {
    updateCharge(charge: $item) {
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
  mutation DeleteCharge($id: Int!) {
    deleteCharge(id: $id)
  }
`;

export const CALCULATE_CHARGE_DISTRIBUTION = gql`
  mutation CalculateChargeDistribution($chargeId: Int!) {
    calculateChargeDistribution(chargeId: $chargeId) {
      unitId
      unitNumber
      amount
      shares
      area
    }
  }
`;
