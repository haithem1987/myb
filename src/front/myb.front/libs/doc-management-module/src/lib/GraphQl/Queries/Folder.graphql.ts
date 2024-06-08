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
        documentName
        createdBy
        createdAt
          updatedAt
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
          }
        }
      }

`;