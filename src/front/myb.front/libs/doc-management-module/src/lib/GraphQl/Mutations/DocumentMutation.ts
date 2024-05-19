import gql from 'graphql-tag';

export const CREATE_DOCUMENT = gql`
  mutation AddDocument($document: DocumentModel!) {
    addDocument(document: $document) {
      id
      documentName
      createdBy
      editedBy
      documentType
      status
      documentSize
      createdDate
      lastModifiedDate
      folderId
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
      createdDate
      lastModifiedDate
      folderId
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: Int!) {
    deleteDocument(id: $id)
  }
`;
