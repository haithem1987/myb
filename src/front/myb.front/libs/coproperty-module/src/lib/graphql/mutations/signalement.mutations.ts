import gql from 'graphql-tag';

const SIGNALEMENT_FIELDS = `
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
`;

export const CREATE_SIGNALEMENT = gql`
  mutation CreateSignalement($input: CreateSignalementInput!) {
    createSignalement(input: $input) {
      ${SIGNALEMENT_FIELDS}
    }
  }
`;

export const UPDATE_SIGNALEMENT_STATUS = gql`
  mutation UpdateSignalementStatus($id: String!, $status: SignalementStatus!, $syndicComment: String) {
    updateSignalementStatus(id: $id, status: $status, syndicComment: $syndicComment) {
      ${SIGNALEMENT_FIELDS}
    }
  }
`;

export const INCREMENT_SIGNALEMENT_VIEWS = gql`
  mutation IncrementSignalementViews($id: String!) {
    incrementSignalementViews(id: $id)
  }
`;

export const DELETE_SIGNALEMENT = gql`
  mutation DeleteSignalement($id: String!) {
    deleteSignalement(id: $id)
  }
`;
