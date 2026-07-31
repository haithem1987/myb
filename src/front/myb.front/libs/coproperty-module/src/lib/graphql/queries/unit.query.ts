import gql from 'graphql-tag';

export const GET_ALL_UNITS_BY_SYNDIC = gql`
  query GetAllUnitsBySyndic($managerId: UUID) {
    allUnitsBySyndic(managerId: $managerId) {
      id
      copropertyId
      copropertyName
      unitNumber
      floor
      unitType
      description
      area
      shares
      isOccupied
      createdAt
      updatedAt
      currency
    }
  }
`;

export const GET_UNIT_BY_ID = gql`
  query GetUnitById($id: UUID!) {
    unitById(id: $id) {
      id
      copropertyId
      copropertyName
      unitNumber
      floor
      unitType
      description
      area
      shares
      isOccupied
      createdAt
      updatedAt
      currency
    }
  }
`;

export const GET_UNITS_BY_COPROPERTY = gql`
  query GetUnitsByCoproperty($copropertyId: UUID!) {
    units(copropertyId: $copropertyId) {
      id
      copropertyId
      copropertyName
      unitNumber
      floor
      unitType
      description
      area
      shares
      isOccupied
      createdAt
      updatedAt
      currency
    }
  }
`;
