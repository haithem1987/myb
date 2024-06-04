export const CREATE_TIMESHEET = `
  mutation addTimesheet($item: TimeSheetInput!) {
    addTimesheet(timeSheet: $item) {
         createdAt
    date
    description
    employeeId
    id
    isApproved
    projectId
    updatedAt
    userId
    workedHours
    employeeName
    projectName
    }
  }
`;

export const UPDATE_TIMESHEET = `
  mutation updateTask($item: TimeSheetInput!) {
    updateTask(timeSheet: $item) {
          createdAt
    date
    description
    employeeId
    id
    isApproved
    projectId
    updatedAt
    userId
    workedHours
    employeeName
    projectName
    }
  }
`;

export const DELETE_TIMESHEET = `
  mutation deleteTimesheet($id: Int!) {
    deleteTimesheet(id: $id)
  }
`;
