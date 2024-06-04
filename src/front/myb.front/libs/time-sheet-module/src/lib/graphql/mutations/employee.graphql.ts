export const CREATE_EMPLOYEE = `
  mutation addEmployee($item: EmployeeInput!) {
    addEmployee(employee: $item) {
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

export const UPDATE_EMPLOYEE = `
  mutation updateEmployee($item: EmployeeInput!) {
    updateEmployee(employee: $item) {
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

export const DELETE_EMPLOYEE = `
  mutation deleteEmployee($id: Int!) {
    deleteEmployee(id: $id)
  }
`;
