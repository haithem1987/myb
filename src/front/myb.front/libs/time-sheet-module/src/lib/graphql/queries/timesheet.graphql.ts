export const GET_ALL_TIMESHEETS = `
  query  {
    allTimesheets {
    createdAt
      date
      description
      id
      status
      quantity
      projectId
      updatedAt
      userId
      workedHours
      username
    projectName
    }
  }
`;

export const GET_TIMESHEETS_BY_USER_ID = `
  query ($userId: String!) {
    timesheetsByUserId(userId: $userId) {
      createdAt
      date
      description
      id
      status
      projectId
      updatedAt
      quantity
      userId
      workedHours
      username
      projectName
    }
  }
`;

export const GET_TIMESHEETS_BY_MANAGER_ID = `
  query ($managerId: String!) {
    timesheetsByManagerId(managerId: $managerId) {
      createdAt
      date
      description
      id
      status
      projectId
      updatedAt
      quantity
      userId
      workedHours
      username
      projectName
    }
  }
`;
export const GET_TIMESHEETS_BY_EMPLOYEE_ID = `
  query ($employeeId: Int!) {
    timesheetsByEmployeeId(employeeId: $employeeId) {
      date
      workedHours
    }
  }
`;
