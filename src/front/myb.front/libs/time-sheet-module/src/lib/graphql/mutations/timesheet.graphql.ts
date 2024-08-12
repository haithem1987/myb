export const CREATE_TIMESHEET = `
  mutation addTimesheet($item: TimeSheetInput!) {
    addTimesheet(timeSheet: $item) {
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

export const UPDATE_TIMESHEET = `
  mutation updateTimesheet($item: TimeSheetInput!) {
    updateTimesheet(timeSheet: $item) {
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

export const UPDATE_MULTIPLE_TIMESHEETS = `
  mutation UpdateMultipleTimesheets($timesheets: [TimeSheetInput!]!) {
    updateMultipleTimesheets(timesheets: $timesheets) {
      id
      date
      workedHours
      description
      status
      employeeId
      quantity
      employeeName
      projectId
      projectName
      userId
    }
  }
`;

export const DELETE_TIMESHEET = `
  mutation deleteTimesheet($id: Int!) {
    deleteTimesheet(id: $id)
  }
`;
export const GENERATE_TIMESHEET_PDF = `
  mutation GenerateTimesheetPdf($projectIds: [Int!]!) {
        generateTimesheetPdf(projectIds: $projectIds)
      }
`;
