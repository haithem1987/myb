import gql from 'graphql-tag';

export const GET_ALL_DOCUMENTS = gql`
  query GetAllDocuments {
    allDocuments {
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

export const GET_DOCUMENT_BY_ID = gql`
  query DocumentById($id: Int!) {
    documentById(id: $id) {
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
