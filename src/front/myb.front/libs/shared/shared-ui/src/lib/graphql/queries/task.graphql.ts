export const GET_ALL_TASKS = `
  query GetAllTasks {
    allTasks {
      id
      name
      description
      projectId
      employeeId
      startTime
      dueDate
      project{
        id
        projectName
      }
      isCompleted
      endTime
      createdAt
      updatedAt
      userId
    }
  }
`;

export const GET_TASK_BY_ID = `
  query taskById($id: Int!) {
    taskById(id: $id) {
      id
      name
      description
      projectId
      employeeId
      startTime
      dueDate
      isCompleted
      endTime
      createdAt
      updatedAt
      userId
    }
  }
`;
export const GET_TASKS_BY_PROJECT_ID = `
  query ($id: Int!) {
    tasksByProjectId(projectId: $id) {
      id
      name
      description
      projectId
      employeeId
      startTime
      dueDate
      isCompleted
      endTime
      createdAt
      updatedAt
      userId
    }
  }
`;
