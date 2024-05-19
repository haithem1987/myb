import gql from 'graphql-tag';

export const DELETE_FOLDER = gql`
  mutation DeleteFolder($id: ID!) {
    deleteFolder(id: $id) {
      id
      folderName
    }
  }
`;

export const UPDATE_FOLDER = gql`
  mutation UpdateFolder($id: ID!, $folder: FolderInput!) {
    updateFolder(id: $id, folder: $folder) {
      id
      folderName
      createdBy
      editedBy
      createdDate
      lastModifiedDate
    }
  }
`;
// Folder Mutations
export const ADD_FOLDER = gql`
  mutation AddFolder($folder: FolderInput!) {
    addFolder(folder: $folder) {
      id
      folderName
      createdBy
      editedBy
      createdDate
      lastModifiedDate
    }
  }
`;

export const ADD_FOLDER_WITH_DOCUMENTS = gql`
  mutation AddFolderWithDocuments($folder: FolderInput!) {
    addFolder(folder: $folder) {
      id
      folderName
      createdBy
      editedBy
      createdDate
      lastModifiedDate
      documents {
        documentName
        documentType
      }
    }
  }
`;