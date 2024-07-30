import {
  CREATE_PROJECT,
  DELETE_PROJECT,
  UPDATE_PROJECT,
} from './mutations/project.graphql';
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

  UPDATE_DOCUMENT ,
  DELETE_DOCUMENT,
  ADD_DOCUMENT} 
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



import {
  GET_ALL_EMPLOYEES,
  GET_EMPLOYEE_BY_ID,
} from './queries/employee.graphql';
import { GET_ALL_PROJECTS, GET_PROJECT_BY_ID } from './queries/project.graphql';
import {
  GET_ALL_TASKS,
  GET_TASKS_BY_PROJECT_ID,
  GET_TASK_BY_ID,
} from './queries/task.graphql';
import {
  GET_ALL_TIMESHEETS,
  GET_TIMESHEETS_BY_USER_ID,
} from './queries/timesheet.graphql';

export const typeConfig: { [key: string]: any } = {
  User: {
    getAll: 'GET_ALL_USERS',
    getById: ' GET_USER_BY_ID',
    create: 'CREATE_USER',
    update: 'UPDATE_USER',
    delete: 'DELETE_USER',
  },
  Timesheet: {
    getAll: GET_ALL_TIMESHEETS,
    getById: GET_TASK_BY_ID,
    create: CREATE_TASK,
    update: UPDATE_TASK,
    delete: DELETE_TASK,
    getTimesheetsByUserId: GET_TIMESHEETS_BY_USER_ID,
  },
  Task: {
    getAll: GET_ALL_TASKS,
    getById: GET_TASK_BY_ID,
    create: CREATE_TASK,
    update: UPDATE_TASK,
    delete: DELETE_TASK,
    getTasksByProjectId: GET_TASKS_BY_PROJECT_ID,
  },
  DocumentModel:{
    getById: GET_DOCUMENT_BY_ID,
    getAll: GET_ALL_DOCUMENTS,
    update: UPDATE_DOCUMENT,
    delete: DELETE_DOCUMENT,
    create: ADD_DOCUMENT,

  },
  //folder type
  Folder:{
    getById: GET_FOLDER_BY_ID,
    getAll: GET_ALL_FOLDERS,
    update: UPDATE_FOLDER,
    delete: DELETE_FOLDER,
    create: ADD_FOLDER,
    },


  



  Project: {
    getAll: GET_ALL_PROJECTS,
    getById: GET_PROJECT_BY_ID,
    create: CREATE_PROJECT,
    update: UPDATE_PROJECT,
    delete: DELETE_PROJECT,
  },
  Employee: {
    getAll: GET_ALL_EMPLOYEES,
    getById: GET_EMPLOYEE_BY_ID,
    create: CREATE_PROJECT,
    update: UPDATE_PROJECT,
    delete: DELETE_PROJECT,
  },

  // You can add more configurations for different types here
};
