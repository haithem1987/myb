export const CREATE_TIMEOFF = `
  mutation addTimeOff($item: TimeOffInput!) {
    addTimeOff(timeOff: $item) {
      createdAt
      employeeId
      endDate
      id
      isApproved
      reason
      startDate
      updatedAt
    }
  }
`;
export const UPDATE_TIMEOFF = `
  mutation updateTimeOff($item: TimeOffInput!) {
    updateTimeOff(timeOff: $item) {
      createdAt
      employeeId
      endDate
      id
      isApproved
      reason
      startDate
      updatedAt
    }
  }
`;
