import gql from 'graphql-tag';

export const GET_ALL_CHARGES = gql`
  query GetAllCharges {
    allCharges {
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

export const GET_CHARGE_BY_ID = gql`
  query GetChargeById($id: UUID!) {
    chargeById(id: $id) {
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

export const GET_CHARGES_BY_COPROPERTY = gql`
  query GetChargesByCoproperty($copropertyId: UUID!) {
    charges(copropertyId: $copropertyId) {
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
