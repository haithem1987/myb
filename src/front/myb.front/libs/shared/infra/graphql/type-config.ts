import {
  GET_ALL_FOLDERS,
  GET_FOLDERS_BY_PARENT_ID,
  GET_FOLDER_BY_ID,
} from 'libs/doc-management-module/src/lib/GraphQl/Queries/Folder.graphql';
import {
  GET_ALL_ROOT_FOLDERS,
  GET_ROOT_FOLDER_BY_ID,
  GET_ROOT_FOLDER_BY_USER_AND_MODULE,
} from 'libs/doc-management-module/src/lib/GraphQl/Queries/Folder.graphql';
import {
  ADD_FOLDER,
  ADD_ROOT_FOLDER,
  DELETE_FOLDER,
  DELETE_ROOT_FOLDER,
  UPDATE_FOLDER,
  UPDATE_ROOT_FOLDER,
} from 'libs/doc-management-module/src/lib/GraphQl/Mutations/FolderMutation';

import {
  ADD_DOCUMENT,
  DELETE_DOCUMENT,
  UPDATE_DOCUMENT,
} from './../../../doc-management-module/src/lib/GraphQl/Mutations/DocumentMutation';
import {
  GET_ALL_DOCUMENTS,
  GET_DOCUMENT_BY_ID,
} from './../../../doc-management-module/src/lib/GraphQl/Queries/Document.graphql';

import {
  GET_ALL_TIMESHEETS,
  GET_TIMESHEETS_BY_EMPLOYEE_ID,
  GET_TIMESHEETS_BY_USER_ID,
  GET_TIMESHEETS_BY_MANAGER_ID,
} from '../../../time-sheet-module/src/lib/graphql/queries/timesheet.graphql';

import {
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
} from '../../../time-sheet-module/src/lib/graphql/mutations/task.graphql';
import {
  GET_ACTIVE_PROJECTS,
  GET_ALL_PROJECTS,
  GET_ARCHIVED_PROJECTS,
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
  GET_MANAGER_ID_BY_USER_ID,
} from '../../../time-sheet-module/src/lib/graphql/queries/employee.graphql';
import {
  CREATE_PROJECT,
  DELETE_PROJECT,
  UPDATE_PROJECT,
} from '../../../time-sheet-module/src/lib/graphql/mutations/project.graphql';
import {
  CREATE_TIMESHEET,
  DELETE_TIMESHEET,
  GENERATE_TIMESHEET_PDF,
  UPDATE_MULTIPLE_TIMESHEETS,
  UPDATE_TIMESHEET,
} from '../../../time-sheet-module/src/lib/graphql/mutations/timesheet.graphql';
import {
  CREATE_EMPLOYEE,
  DELETE_EMPLOYEE,
  UPDATE_EMPLOYEE,
} from '../../../time-sheet-module/src/lib/graphql/mutations/employee.graphql';
import {
  CREATE_TIMEOFF,
  UPDATE_TIMEOFF,
} from '../../../time-sheet-module/src/lib/graphql/mutations/timeoff.graphql';
import { GET_TIMEOFFS_BY_EMPLOYEE_ID } from '../../../time-sheet-module/src/lib/graphql/queries/timeoff.graphql';

import {
  GET_ALL_INVOICES,
  GET_INVOICE_BY_ID,
} from '../../../invoice-module/src/lib/graphql/queries/invoice.query';
import {
  CREATE_TAX,
  UPDATE_TAX,
} from '../../../invoice-module/src/lib/graphql/mutations/tax.mutation';
import {
  GET_ALL_Taxes,
  GET_Tax_BY_ID,
} from '../../../invoice-module/src/lib/graphql/queries/tax.query';
import {
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
} from '../../../invoice-module/src/lib/graphql/mutations/product.mutation';
import {
  GET_ALL_PRODUCTS,
  GET_PRODUCT_BY_ID,
} from '../../../invoice-module/src/lib/graphql/queries/product.query';
import {
  CREATE_CLIENT,
  UPDATE_CLIENT,
} from '../../..//invoice-module/src/lib/graphql/mutations/client.mutation';
import {
  GET_ALL_CLIENTS,
  GET_CLIENT_BY_ID,
} from '../../../invoice-module/src/lib/graphql/queries/client.query';
import {
  CREATE_INVOICE,
  UPDATE_INVOICE,
} from '../../../invoice-module/src/lib/graphql/mutations/invoice.mutation';

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
    getTimesheetsByManagerId: GET_TIMESHEETS_BY_MANAGER_ID,
    getTimesheetsByEmployeeId: GET_TIMESHEETS_BY_EMPLOYEE_ID,
    updateMultipleTimesheets: UPDATE_MULTIPLE_TIMESHEETS,
    generateTimesheetPdf: GENERATE_TIMESHEET_PDF,
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
    getActiveProjects: GET_ACTIVE_PROJECTS,
    getArchivedProjects: GET_ARCHIVED_PROJECTS,
  },
  Employee: {
    getAll: GET_ALL_EMPLOYEES,
    getById: GET_EMPLOYEE_BY_ID,
    create: CREATE_EMPLOYEE,
    update: UPDATE_EMPLOYEE,
    delete: DELETE_EMPLOYEE,
    getEmployeesByManagerId: GET_EMPLOYEES_BY_MANAGER_ID,
    getManagerIdByUserId: GET_MANAGER_ID_BY_USER_ID,
    getTimeoffsByEmployeeId: GET_TIMEOFFS_BY_EMPLOYEE_ID,
    addTimeOff: CREATE_TIMEOFF,
    updateTimeOff: UPDATE_TIMEOFF,
  },
  Invoice: {
    getAll: GET_ALL_INVOICES,
    getById: GET_INVOICE_BY_ID,
    create: CREATE_INVOICE,
    update: UPDATE_INVOICE,
  },
  Tax: {
    create: CREATE_TAX,
    getAll: GET_ALL_Taxes,
    getById: GET_Tax_BY_ID,
    update: UPDATE_TAX,
  },
  Product: {
    create: CREATE_PRODUCT,
    getAll: GET_ALL_PRODUCTS,
    getById: GET_PRODUCT_BY_ID,
    update: UPDATE_PRODUCT,
  },
  Client: {
    create: CREATE_CLIENT,
    getAll: GET_ALL_CLIENTS,
    getById: GET_CLIENT_BY_ID,
    update: UPDATE_CLIENT,
  },

  DocumentModel: {
    getById: GET_DOCUMENT_BY_ID,
    getAll: GET_ALL_DOCUMENTS,
    update: UPDATE_DOCUMENT,
    delete: DELETE_DOCUMENT,
    create: ADD_DOCUMENT,
  },
  //folder type
  Folder: {
    getById: GET_FOLDER_BY_ID,
    getAll: GET_ALL_FOLDERS,
    update: UPDATE_FOLDER,
    delete: DELETE_FOLDER,
    create: ADD_FOLDER,
    getFoldersByParentId: GET_FOLDERS_BY_PARENT_ID,
  },
  //rootfolder
  RootFolder: {
    getById: GET_ROOT_FOLDER_BY_ID,
    getAll: GET_ALL_ROOT_FOLDERS,
    update: UPDATE_ROOT_FOLDER,
    delete: DELETE_ROOT_FOLDER,
    create: ADD_ROOT_FOLDER,
    getRootFolderByUserAndModule: GET_ROOT_FOLDER_BY_USER_AND_MODULE,
  },
  // You can add more configurations for different types here
};
