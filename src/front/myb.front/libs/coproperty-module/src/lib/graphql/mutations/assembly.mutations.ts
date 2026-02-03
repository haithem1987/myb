import { gql } from 'apollo-angular';

export const CREATE_ASSEMBLY = gql`
  mutation CreateAssembly($assembly: AssemblyInput!) {
    createAssembly(assembly: $assembly) {
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

export const UPDATE_ASSEMBLY = gql`
  mutation UpdateAssembly($id: UUID!, $assembly: AssemblyInput!) {
    updateAssembly(id: $id, assembly: $assembly) {
      id
      copropertyId
      title
      meetingDate
      location
      agenda
      minutes
      assemblyType
      status
      updatedAt
    }
  }
`;

export const UPDATE_ASSEMBLY_STATUS = gql`
  mutation UpdateAssemblyStatus($id: UUID!, $status: AssemblyStatus!) {
    updateAssemblyStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;

export const DELETE_ASSEMBLY = gql`
  mutation DeleteAssembly($id: UUID!) {
    deleteAssembly(id: $id)
  }
`;
