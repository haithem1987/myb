import gql from 'graphql-tag';

export const GET_ALL_EMPLOYEES = gql`
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

export const GET_EMPLOYEE_BY_ID = gql`
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
