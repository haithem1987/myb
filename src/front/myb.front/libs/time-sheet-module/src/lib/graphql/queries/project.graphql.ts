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
      status
    }
  }
`;
export const GET_ACTIVE_PROJECTS = `
  query activeProjects {
    activeProjects {
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
export const GET_ARCHIVED_PROJECTS = `
  query archivedProjects {
    archivedProjects {
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
      status
    }
  }
`;
