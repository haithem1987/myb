export const CREATE_TASK = `
  mutation addTask($item: TimesheetTaskInput!) {
    addTask(task: $item) {
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

export const UPDATE_TASK = `
  mutation updateTask($item: TimesheetTaskInput!) {
    updateTask(task: $item) {
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

export const DELETE_TASK = `
  mutation deleteTask($id: Int!) {
    deleteTask(id: $id)
  }
`;
