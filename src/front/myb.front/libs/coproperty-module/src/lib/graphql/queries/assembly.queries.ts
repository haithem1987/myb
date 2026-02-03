import { gql } from 'apollo-angular';

export const GET_ASSEMBLIES = gql`
  query GetAssemblies($copropertyId: UUID!) {
    assemblies: getAssemblies(copropertyId: $copropertyId) {
      id
      copropertyId
      title
      meetingDate
      location
      agenda
      minutes
      assemblyType
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_UPCOMING_ASSEMBLIES = gql`
  query GetUpcomingAssemblies($copropertyId: UUID!) {
    assemblies: getUpcomingAssemblies(copropertyId: $copropertyId) {
      id
      copropertyId
      title
      meetingDate
      location
      agenda
      assemblyType
      status
      createdAt
    }
  }
`;

export const GET_ASSEMBLY_BY_ID = gql`
  query GetAssemblyById($id: UUID!) {
    assembly: getAssemblyById(id: $id) {
      id
      copropertyId
      title
      meetingDate
      location
      agenda
      minutes
      assemblyType
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;
