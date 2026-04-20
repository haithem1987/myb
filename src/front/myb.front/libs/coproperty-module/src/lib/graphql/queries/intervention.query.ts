import { gql } from 'apollo-angular';

export const GET_INTERVENTIONS = gql`
  query GetInterventions {
    interventions {
      id
      copropertyId
      unitId
      title
      description
      interventionType
      priority
      status
      providerName
      providerPhone
      providerEmail
      assignedTo
      requestedBy
      estimatedCost
      actualCost
      plannedDate
      startedDate
      completedDate
      notes
      resolution
      maintenanceRequestId
      currency
      createdAt
      updatedAt
    }
  }
`;

export const GET_INTERVENTIONS_BY_COPROPERTY = gql`
  query GetInterventionsByCoproperty($copropertyId: UUID!) {
    interventionsByCoproperty(copropertyId: $copropertyId) {
      id
      copropertyId
      unitId
      title
      description
      interventionType
      priority
      status
      providerName
      providerPhone
      providerEmail
      assignedTo
      requestedBy
      estimatedCost
      actualCost
      plannedDate
      startedDate
      completedDate
      notes
      resolution
      maintenanceRequestId
      currency
      createdAt
      updatedAt
    }
  }
`;

export const GET_INTERVENTION_BY_ID = gql`
  query GetInterventionById($id: UUID!) {
    interventionById(id: $id) {
      id
      copropertyId
      unitId
      title
      description
      interventionType
      priority
      status
      providerName
      providerPhone
      providerEmail
      assignedTo
      requestedBy
      estimatedCost
      actualCost
      plannedDate
      startedDate
      completedDate
      notes
      resolution
      maintenanceRequestId
      currency
      createdAt
      updatedAt
    }
  }
`;

export const GET_INTERVENTIONS_BY_STATUS = gql`
  query GetInterventionsByStatus($copropertyId: UUID!, $status: InterventionStatus!) {
    interventionsByStatus(copropertyId: $copropertyId, status: $status) {
      id
      copropertyId
      unitId
      title
      description
      interventionType
      priority
      status
      providerName
      providerPhone
      providerEmail
      estimatedCost
      actualCost
      plannedDate
      startedDate
      completedDate
      currency
      createdAt
      updatedAt
    }
  }
`;
