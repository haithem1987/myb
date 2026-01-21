import gql from 'graphql-tag';

export const GET_ALL_UNITS = gql`
  query GetAllUnits {
    allUnits {
      id
      copropertyId
      unitNumber
      floor
      type
      area
      shares
      ownerName
      ownerEmail
      ownerPhone
      isOccupied
      rentedTo
      createdAt
      updatedAt
    }
  }
`;

export const GET_UNIT_BY_ID = gql`
  query GetUnitById($id: Int!) {
    unitById(id: $id) {
      id
      copropertyId
      unitNumber
      floor
      type
      area
      shares
      ownerName
      ownerEmail
      ownerPhone
      isOccupied
      rentedTo
      createdAt
      updatedAt
    }
  }
`;

export const GET_UNITS_BY_COPROPERTY = gql`
  query GetUnitsByCoproperty($copropertyId: Int!) {
    unitsByCoproperty(copropertyId: $copropertyId) {
      id
      copropertyId
      unitNumber
      floor
      type
      area
      shares
      ownerName
      ownerEmail
      ownerPhone
      isOccupied
      rentedTo
      createdAt
      updatedAt
    }
  }
`;
