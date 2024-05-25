export const GET_ALL_PROJECTS = `
  query GetAllProjects {
    allProjects {
      id
      projectName
      description
      startDate
      endDate
      createdAt
      updatedAt
    }
  }
`;

export const GET_PROJECT_BY_ID = `
  query projectById($id: Int!) {
    projectById(id: $id) {
      id
      projectName
      description
      endDate
      startDate
      createdAt
      updatedAt
    }
  }
`;
