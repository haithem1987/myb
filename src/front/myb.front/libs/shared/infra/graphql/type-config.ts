import { 
  ADD_DOCUMENT, DELETE_DOCUMENT, UPDATE_DOCUMENT } from './../../../doc-management-module/src/lib/GraphQl/Mutations/DocumentMutation';
import { GET_ALL_DOCUMENTS, GET_DOCUMENT_BY_ID } from './../../../doc-management-module/src/lib/GraphQl/Queries/Document.graphql';
import {
  GET_ALL_TIMESHEETS,
  GET_TIMESHEETS_BY_USER_ID,
} from 'libs/time-sheet-module/src/lib/graphql/queries/timesheet.graphql';
import {
  GET_ALL_INVOICES,
  GET_INVOICE_BY_ID,
} from '../../../invoice-module/src/lib/graphql/queries/invoice.query';
import {
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
} from '../../../time-sheet-module/src/lib/graphql/mutations/task.graphql';
import {
  GET_ALL_PROJECTS,
  GET_PROJECT_BY_ID,
} from '../../../time-sheet-module/src/lib/graphql/queries/project.graphql';
import {
  GET_ALL_TASKS,
  GET_TASKS_BY_PROJECT_ID,
  GET_TASK_BY_ID,
} from '../../../time-sheet-module/src/lib/graphql/queries/task.graphql';
import {
  GET_ALL_EMPLOYEES,
  GET_EMPLOYEES_BY_MANAGER_ID,
  GET_EMPLOYEE_BY_ID,
} from 'libs/time-sheet-module/src/lib/graphql/queries/employee.graphql';
import {
  CREATE_PROJECT,
  DELETE_PROJECT,
  UPDATE_PROJECT,
} from 'libs/time-sheet-module/src/lib/graphql/mutations/project.graphql';
import {
  CREATE_TIMESHEET,
  DELETE_TIMESHEET,
  UPDATE_TIMESHEET,
} from 'libs/time-sheet-module/src/lib/graphql/mutations/timesheet.graphql';
import {
  CREATE_EMPLOYEE,
  DELETE_EMPLOYEE,
  UPDATE_EMPLOYEE,
} from 'libs/time-sheet-module/src/lib/graphql/mutations/employee.graphql';
import { GET_ALL_FOLDERS, GET_FOLDERS_BY_PARENT_ID, GET_FOLDER_BY_ID } from 'libs/doc-management-module/src/lib/GraphQl/Queries/Folder.graphql';
import { ADD_FOLDER, DELETE_FOLDER, UPDATE_FOLDER } from 'libs/doc-management-module/src/lib/GraphQl/Mutations/FolderMutation';
import { CREATE_INVOICE } from "libs/invoice-module/src/lib/graphql/mutations/invoice.mutation";


// src/app/graphql/type-config.ts
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
    create: CREATE_TIMESHEET,
    update: UPDATE_TIMESHEET,
    delete: DELETE_TIMESHEET,
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
    create: CREATE_EMPLOYEE,
    update: UPDATE_EMPLOYEE,
    delete: DELETE_EMPLOYEE,
    getEmployeesByManagerId: GET_EMPLOYEES_BY_MANAGER_ID,
  },
  Invoice: {
    getAll: GET_ALL_INVOICES,
    getById: GET_INVOICE_BY_ID,
    create: CREATE_INVOICE
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
    getFoldersByParentId:GET_FOLDERS_BY_PARENT_ID

    },

  // You can add more configurations for different types here
};


 
  
