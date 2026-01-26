import gql from 'graphql-tag';

export const CREATE_MAINTENANCE_REQUEST = gql`
  mutation CreateMaintenanceRequest($item: CreateMaintenanceRequestInput!) {
    createMaintenanceRequestWithDates(requestInput: $item) {
      id
      copropertyId
      unitId
      title
      description
      category
      priority
      status
      requestedBy
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
  mutation UpdateMaintenanceRequest($item: UpdateMaintenanceRequestInput!) {
    updateMaintenanceRequestWithDates(requestInput: $item) {
      id
      copropertyId
      unitId
      title
      description
      category
      priority
      status
      requestedBy
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
  mutation DeleteMaintenanceRequest($id: UUID!) {
    deleteMaintenanceRequest(id: $id)
  }
`;

export const UPDATE_MAINTENANCE_STATUS = gql`
  mutation UpdateMaintenanceStatus($id: UUID!, $status: MaintenanceStatus!) {
    updateMaintenanceStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;
