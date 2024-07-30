import gql from 'graphql-tag';

// Folder Queries
export const GET_ALL_FOLDERS = gql`
  query GetAllFolders {
    allFolders {
      id
      folderName
      parentId
      createdBy
      createdAt
      updatedAt
      documents {
        id
            documentName
            createdBy
            editedBy
            documentType
            status
            folderId
            documentSize
            createdAt
            updatedAt
            file
      }
    }
  }
`;
export const GET_FOLDER_BY_ID = gql`
query getFolderById($id: Int!) {
        folderById(id: $id) {
          id
          folderName
          createdBy
          editedBy
          createdAt
          updatedAt
          parentId
          documents {
            id
            documentName
            createdBy
            editedBy
            documentType
            status
            folderId
            documentSize
            createdAt
            updatedAt
            file
          }
          
        }
      }

      

`;

export const GET_FOLDERS_BY_PARENT_ID = gql`
  query getFoldersByParentId($parentId: Int!) {
    foldersByParentId(parentId: $parentId) {
      id
      folderName
      parentId
      createdBy
      createdAt
      updatedAt
      documents {
        id
        documentName
        createdBy
        editedBy
        documentType
        status
        folderId
        documentSize
        createdAt
        updatedAt
        file
      }
    }
  }
`;

// RootFolder Queries
export const GET_ROOT_FOLDER_BY_USER_AND_MODULE = gql`
  query GetRootFolderByUserAndModule($userId: String!, $moduleName: String!) {
    rootFolderByUserAndModule(userId: $userId, moduleName: $moduleName) {
      id
      userId
      moduleName
      folderId
    }
  }
`;

export const GET_ALL_ROOT_FOLDERS = gql`
  query GetAllRootFolders {
    allRootFolders {
      id
      userId
      moduleName
      folderId
    }
  }
`;
//getrootfolderbyid
export const GET_ROOT_FOLDER_BY_ID = gql`
query getRootFolderById($id: Int!) {
        rootFolderById(id: $id) {
          id
          userId
          moduleName
          folderId
        }
      }
`;