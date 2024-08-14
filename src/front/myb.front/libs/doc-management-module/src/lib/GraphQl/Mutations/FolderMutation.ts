import { Folder } from './../../models/Folder';
import gql from 'graphql-tag';

export const DELETE_FOLDER = gql`
  mutation DeleteFolder($id: Int!) {
    deleteFolder(id: $id)
  }
`;


export const UPDATE_FOLDER = gql`
mutation UpdateFolder( $item: FolderInput!) {
  updateFolder(folder: $item) {
    id
    folderName
    createdBy
    editedBy
    createdAt
    updatedAt
    parentId
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
      parentId
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
      parentId
      documents {
        documentName
        documentType
      }
    }
  }
`;

// RootFolder Mutations
export const ADD_ROOT_FOLDER = gql`
  mutation AddRootFolder($rootFolder: RootFolderInput!) {
    addRootFolder(rootFolder: $rootFolder) {
      id
      userId
      moduleName
      folderId
    }
  }
`;

export const UPDATE_ROOT_FOLDER = gql`
  mutation UpdateRootFolder($rootFolder: RootFolderInput!) {
    updateRootFolder(rootFolder: $rootFolder) {
      id
      userId
      moduleName
      folderId
    }
  }
`;

export const DELETE_ROOT_FOLDER = gql`
  mutation DeleteRootFolder($id: Int!) {
    deleteRootFolder(id: $id)
  }
`;