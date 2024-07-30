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
      file
      # url
    
    }
  }
`;

export const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument($id: Int!, $document: DocumentModelInput!) {
          updateDocument(id: $id, document: $document) {
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
            file
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: Int!) {
    deleteDocument(id: $id){
      companyId
    createdAt
    createdBy
    documentName
    documentSize
    documentType
    editedBy
    file
    folderId
    id
    status
    updatedAt
    userId
    }
  }
`;
