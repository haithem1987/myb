export const GET_TIMEOFFS_BY_EMPLOYEE_ID = `
  mutation timeOffsByEmployeeId($employeeId: Int!) {
    timeOffsByEmployeeId(employeeId: $employeeId) {
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
