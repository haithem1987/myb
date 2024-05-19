import {
  CREATE_TASK,
  DELETE_TASK,
  UPDATE_TASK,
} from './mutations/task.graphql';
import { 
  GET_ALL_TASKS, 
  GET_TASK_BY_ID  } 
  from './queries/task.graphql';
import { GET_ALL_DOCUMENTS , 
  GET_DOCUMENT_BY_ID } 
  from "../../../../../doc-management-module/src/lib/GraphQl/Queries/Document.graphql"
import { 
  CREATE_DOCUMENT , 
  UPDATE_DOCUMENT ,
  DELETE_DOCUMENT} 
  from "../../../../../doc-management-module/src/lib/GraphQl/Mutations/DocumentMutation"
import { 
  ADD_FOLDER, 
  DELETE_FOLDER, 
  UPDATE_FOLDER } 
  from "../../../../../doc-management-module/src/lib/GraphQl/Mutations/FolderMutation"
import {
  GET_ALL_FOLDERS,
   GET_FOLDER_BY_ID} 
  from "../../../../../doc-management-module/src/lib/GraphQl/Queries/Folder.graphql"




export const typeConfig: { [key: string]: any } = {
  User: {
    getAll: 'GET_ALL_USERS',
    getById: ' GET_USER_BY_ID',
    create: 'CREATE_USER',
    update: 'UPDATE_USER',
    delete: 'DELETE_USER',
  },
  Task: {
    getAll: GET_ALL_TASKS,
    getById: GET_TASK_BY_ID,
    create: CREATE_TASK,
    update: UPDATE_TASK,
    delete: DELETE_TASK,
  },
  DocumentModel:{
    getById: GET_DOCUMENT_BY_ID,
    getAll: GET_ALL_DOCUMENTS,
    update: UPDATE_DOCUMENT,
    delete: DELETE_DOCUMENT,
    create: CREATE_DOCUMENT,

  },
  //folder type
  Folder:{
    getById: GET_FOLDER_BY_ID,
    getAll: GET_ALL_FOLDERS,
    update: UPDATE_FOLDER,
    delete: DELETE_FOLDER,
    create: ADD_FOLDER,
    },


  




  // You can add more configurations for different types here
};
