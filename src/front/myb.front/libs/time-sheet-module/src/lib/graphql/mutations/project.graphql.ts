import gql from 'graphql-tag';

export const CREATE_PROJECT = gql`
  mutation addProject($item: ProjectInput!) {
    addProject(project: $item) {
      id
      projectName
      description
      startDate
      endDate
      createdAt
      updatedAt
      status
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation updateProject($item: ProjectInput!) {
    updateProject(project: $item) {
      id
      projectName
      description
      startDate
      endDate
      createdAt
      updatedAt
      status
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation deleteProject($id: Int!) {
    deleteProject(id: $id)
  }
`;
