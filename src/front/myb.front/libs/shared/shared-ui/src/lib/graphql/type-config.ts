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
  GET_ALL_EMPLOYEES,
  GET_EMPLOYEE_BY_ID,
} from './queries/employee.graphql';
import { GET_ALL_PROJECTS, GET_PROJECT_BY_ID } from './queries/project.graphql';
import { GET_ALL_TASKS, GET_TASK_BY_ID } from './queries/task.graphql';
import {
  GET_ALL_INVOICES,
  GET_INVOICE_BY_ID,
} from '../../../../../invoice-module/src/lib/graphql/queries/invoice.query';

// src/app/graphql/type-config.ts
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
  Invoice: {
    getAll: GET_ALL_INVOICES,
    getById: GET_INVOICE_BY_ID,
  },

  // You can add more configurations for different types here
};
