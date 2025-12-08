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
    }
  }
`;

export const GET_MANAGER_ID_BY_USER_ID = `
query GetManagerIdByUserId($userId: String!) {
  managerIdByUserId(userId: $userId)
}`;
