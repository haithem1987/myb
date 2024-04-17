// src/app/graphql/type-config.ts
export const typeConfig: { [key: string]: any } = {
  User: {
    getAll: 'GET_ALL_USERS',
    getById: ' GET_USER_BY_ID',
    create: 'CREATE_USER',
    update: 'UPDATE_USER',
    delete: 'DELETE_USER',
  },
  // You can add more configurations for different types here
};
