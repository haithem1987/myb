import gql from 'graphql-tag';

export const GET_ALL_MAINTENANCE_REQUESTS = gql`
  query GetAllMaintenanceRequests {
    allMaintenanceRequests {
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
      currency
    }
  }
`;

export const GET_MAINTENANCE_REQUEST_BY_ID = gql`
  query GetMaintenanceRequestById($id: UUID!) {
    maintenanceRequestById(id: $id) {
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
      currency
    }
  }
`;

export const GET_MAINTENANCE_BY_COPROPERTY = gql`
  query GetMaintenanceByCoproperty($copropertyId: UUID!) {
    maintenanceRequests(copropertyId: $copropertyId) {
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
      currency
    }
  }
`;

export const GET_MAINTENANCE_BY_STATUS = gql`
  query GetMaintenanceByStatus($copropertyId: UUID!, $status: String!) {
    maintenanceByStatus(copropertyId: $copropertyId, status: $status) {
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
      currency
    }
  }
`;
