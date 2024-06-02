import gql from 'graphql-tag';

// Folder Queries
export const GET_ALL_FOLDERS = gql`
  query GetAllFolders {
    allFolders {
      id
      folderName
      parentId
      createdBy
      documents {
        documentName
        createdBy
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
          documents {
            id
            documentName
            createdBy
            editedBy
            documentType
            status
            folderId
            documentSize
          }
        }
      }

`;