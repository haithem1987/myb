import {
  CREATE_TASK,
  DELETE_TASK,
  UPDATE_TASK,
} from './mutations/task.graphql';
import { GET_ALL_TASKS, GET_TASK_BY_ID } from './queries/task.graphql';

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

  // You can add more configurations for different types here
};
