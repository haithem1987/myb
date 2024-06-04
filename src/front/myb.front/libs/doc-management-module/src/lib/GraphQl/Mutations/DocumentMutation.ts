import gql from 'graphql-tag';
// export const CREATE_DOCUMENT = gql`
//   mutation AddDocument($document: DocumentModelInput!) {
//     addDocument(document: $document) {
//       id
//       documentName
//       documentType
//       createdBy
//       editedBy
//       folderId
//       documentSize
//       status
//       createdAt
//       updatedAt
//     }
//   }
// `;
export const ADD_DOCUMENT = gql`
  mutation AddDocument($document: DocumentModelInput!) {
    addDocument(document: $document) {
      id
      documentName
      documentType
      createdBy
      editedBy
      folderId
      documentSize
      status
      createdAt
      updatedAt
      # file
      # url
    
    }
  }
`;

export const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument($document: DocumentModelInput!) {
    updateDocument(document: $document) {
      id
      documentName
      createdBy
      editedBy
      documentType
      status
      documentSize
      createdAt
      updatedAt
      folderId
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: Int!) {
    deleteDocument(id: $id)
  }
`;
