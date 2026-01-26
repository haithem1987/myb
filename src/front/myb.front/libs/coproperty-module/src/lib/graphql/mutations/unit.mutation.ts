import gql from 'graphql-tag';

export const CREATE_UNIT = gql`
  mutation CreateUnit($item: UnitInput!) {
    createUnit(unit: $item) {
      id
      copropertyId
      unitNumber
      floor
      unitType
      description
      area
      shares
      isOccupied
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_UNIT = gql`
  mutation UpdateUnit($item: UnitInput!) {
    updateUnit(unit: $item) {
      id
      copropertyId
      unitNumber
      floor
      unitType
      description
      area
      shares
      isOccupied
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_UNIT = gql`
  mutation DeleteUnit($id: UUID!) {
    deleteUnit(id: $id)
  }
`;
