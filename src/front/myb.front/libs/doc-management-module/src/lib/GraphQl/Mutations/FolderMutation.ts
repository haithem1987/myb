import { Folder } from './../../models/Folder';
import gql from 'graphql-tag';

export const DELETE_FOLDER = gql`
  mutation DeleteFolder($id: Int!) {
    deleteFolder(id: $id)
  }
`;


export const UPDATE_FOLDER = gql`
  mutation UpdateFolder($id: Int!, $folder: FolderInput!) {
    updateFolder(id: $id, folder: $folder) {
      id
      folderName
      createdBy
      editedBy
      createdDate
      lastModifiedDate
      updatedAt
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
      createdAt
      updatedAt
    }
  }
`;

export const ADD_FOLDER_WITH_DOCUMENTS = gql`
  mutation AddFolderWithDocuments($folder: FolderInput!) {
    addFoldere(folder: $folder) {
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