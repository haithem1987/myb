import gql from 'graphql-tag';

export const GET_SIGNALEMENTS = gql`
  query GetSignalements($copropertyId: UUID!) {
    signalements(copropertyId: $copropertyId) {
      id
      copropertyId
      reportedBy
      reporterName
      type
      zone
      description
      photoUrl
      status
      viewsCount
      syndicComment
      createdAt
      updatedAt
    }
  }
`;

export const GET_SIGNALEMENTS_BY_STATUS = gql`
  query GetSignalementsByStatus($copropertyId: UUID!, $status: SignalementStatus!) {
    signalementsByStatus(copropertyId: $copropertyId, status: $status) {
      id
      copropertyId
      reportedBy
      reporterName
      type
      zone
      description
      photoUrl
      status
      viewsCount
      syndicComment
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_SIGNALEMENTS = gql`
  query GetMySignalements($userId: UUID!) {
    mySignalements(userId: $userId) {
      id
      copropertyId
      reportedBy
      reporterName
      type
      zone
      description
      photoUrl
      status
      viewsCount
      syndicComment
      createdAt
      updatedAt
    }
  }
`;

export const GET_SIGNALEMENT_BY_ID = gql`
  query GetSignalementById($id: UUID!) {
    signalementById(id: $id) {
      id
      copropertyId
      reportedBy
      reporterName
      type
      zone
      description
      photoUrl
      status
      viewsCount
      syndicComment
      createdAt
      updatedAt
    }
  }
`;
