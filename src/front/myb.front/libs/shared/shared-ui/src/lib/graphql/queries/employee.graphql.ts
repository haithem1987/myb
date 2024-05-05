import gql from 'graphql-tag';

export const GET_ALL_EMPLOYEES = gql`
  query {
    allEmployees {
      id
      name
      department
      email
      createdDate
      lastModifiedDate
    }
  }
`;

export const GET_EMPLOYEE_BY_ID = gql`
  query projectById($id: Int!) {
    projectById(id: $id) {
      id
      projectName
      description
      createdDate
      endDate
      startDate
      createdDate
      lastModifiedDate
    }
  }
`;
