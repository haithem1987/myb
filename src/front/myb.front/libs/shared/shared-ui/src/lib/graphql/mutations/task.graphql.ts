import gql from 'graphql-tag';

export const CREATE_TASK = gql`
  mutation addTask($item: TimesheetTaskInput!) {
    updateTask(task: $item) {
      id
      description
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation updateTask($item: TimesheetTaskInput!) {
    updateTask(task: $item) {
      id
      description
    }
  }
`;

export const DELETE_TASK = gql`
  mutation deleteTask($id: Int!) {
    deleteTask(id: $id)
  }
`;
