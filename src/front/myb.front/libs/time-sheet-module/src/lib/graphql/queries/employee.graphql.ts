export const GET_ALL_EMPLOYEES = `
  query {
    allEmployees {
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

export const GET_EMPLOYEE_BY_ID = `
  query employeeById($id: Int!) {
    employeeById(id: $id) {
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
