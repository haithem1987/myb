import gql from 'graphql-tag';

export const CREATE_MAINTENANCE_REQUEST = gql`
  mutation CreateMaintenanceRequest($item: MaintenanceRequestInput!) {
    createMaintenanceRequest(maintenanceRequest: $item) {
      id
      copropertyId
      unitId
      title
      description
      category
      priority
      status
      reportedBy
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_MAINTENANCE_REQUEST = gql`
  mutation UpdateMaintenanceRequest($item: MaintenanceRequestInput!) {
    updateMaintenanceRequest(maintenanceRequest: $item) {
      id
      copropertyId
      unitId
      title
      description
      category
      priority
      status
      reportedBy
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_MAINTENANCE_REQUEST = gql`
  mutation DeleteMaintenanceRequest($id: Int!) {
    deleteMaintenanceRequest(id: $id)
  }
`;

export const UPDATE_MAINTENANCE_STATUS = gql`
  mutation UpdateMaintenanceStatus($id: Int!, $status: String!) {
    updateMaintenanceStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;
