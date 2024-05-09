import gql from 'graphql-tag';

export const CREATE_TASK = gql`
  mutation addTask($item: TimesheetTaskInput!) {
    addTask(task: $item) {
      id
      description
      endTime
      startTime
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation updateTask($item: TimesheetTaskInput!) {
    updateTask(task: $item) {
      id
      description
      endTime
      startTime
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_TASK = gql`
  mutation deleteTask($id: Int!) {
    deleteTask(id: $id)
  }
`;
