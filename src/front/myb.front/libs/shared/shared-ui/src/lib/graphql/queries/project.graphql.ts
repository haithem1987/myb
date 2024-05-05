import gql from 'graphql-tag';

export const GET_ALL_PROJECTS = gql`
  query GetAllProjects {
    allProjects {
      id
      projectName
      description
      startDate
      endDate
      createdDate
      lastModifiedDate
    }
  }
`;

export const GET_PROJECT_BY_ID = gql`
  query projectById($id: Int!) {
    projectById(id: $id) {
      id
      projectName
      description
      createdDate
      endDate
      startDate
      createdDate
      lastModifiedDate
    }
  }
`;
