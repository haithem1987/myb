export const GET_ALL_TIMESHEETS = `
  query  {
    allTimesheets {
    createdAt
      date
      description
      employeeId
      id
      status
      projectId
      updatedAt
      userId
      workedHours
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
    userId
    workedHours
    }
  }
`;
