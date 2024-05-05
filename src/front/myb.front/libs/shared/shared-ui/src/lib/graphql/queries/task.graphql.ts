import gql from 'graphql-tag';

export const GET_ALL_TASKS = gql`
  query GetAllTasks {
    allTasks {
      id
      description
      projectId
      employeeId
      startTime
      endTime
      createdDate
      lastModifiedDate
    }
  }
`;

export const GET_TASK_BY_ID = gql`
  query taskById($id: Int!) {
    taskById(id: $id) {
      id
      description
      createdDate
      endTime
      startTime
      lastModifiedDate
    }
  }
`;
