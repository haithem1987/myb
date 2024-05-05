import gql from 'graphql-tag';

export const CREATE_PROJECT = gql`
  mutation addProject($item: Project!) {
    updateProject(project: $item) {
      id
      description
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation updateProject($item: Project!) {
    updateProject(project: $item) {
      id
      description
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation deleteProject($id: Int!) {
    deleteProject(id: $id)
  }
`;
