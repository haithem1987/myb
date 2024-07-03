export const GET_ALL_TIMESHEETS = `
  query  {
    allTimesheets {
    createdAt
      date
      description
      employeeId
      id
      status
      quantity
      projectId
      updatedAt
      userId
      workedHours
      employeeName
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
    employeeId
    id
    status
    projectId
    updatedAt
    quantity
    userId
    workedHours
    employeeName
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
