export const GET_ALL_EMPLOYEES = `
  query {
    allEmployees {
      id
      name
      department
      email
      createdAt
      updatedAt
    }
  }
`;

export const GET_EMPLOYEE_BY_ID = `
  query projectById($id: Int!) {
    projectById(id: $id) {
      id
      projectName
      description
      createdAt
      endDate
      startDate
      updatedAt
    }
  }
`;
export const GET_EMPLOYEES_BY_MANAGER_ID = `
  query GetEmployeesByManagerId($managerId: String!) {
    employeesByManagerId(managerId: $managerId) {
      createdAt
      department
      email
      id
      isManager
      managerId
      name
      updatedAt
      userId
    }
  }
`;
