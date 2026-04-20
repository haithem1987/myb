import { gql } from 'apollo-angular';

export const CREATE_INTERVENTION = gql`
  mutation CreateIntervention($input: CreateInterventionInput!) {
    createIntervention(input: $input) {
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
      notes
      resolution
      currency
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_INTERVENTION = gql`
  mutation UpdateIntervention($input: UpdateInterventionInput!) {
    updateIntervention(input: $input) {
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
      notes
      resolution
      currency
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_INTERVENTION = gql`
  mutation DeleteIntervention($id: UUID!) {
    deleteIntervention(id: $id)
  }
`;

export const UPDATE_INTERVENTION_STATUS = gql`
  mutation UpdateInterventionStatus($id: UUID!, $status: InterventionStatus!) {
    updateInterventionStatus(id: $id, status: $status) {
      id
      status
      startedDate
      completedDate
      updatedAt
    }
  }
`;

export const ASSIGN_INTERVENTION = gql`
  mutation AssignIntervention($id: UUID!, $providerName: String!, $providerPhone: String, $providerEmail: String) {
    assignIntervention(id: $id, providerName: $providerName, providerPhone: $providerPhone, providerEmail: $providerEmail) {
      id
      providerName
      providerPhone
      providerEmail
      status
      updatedAt
    }
  }
`;

export const COMPLETE_INTERVENTION = gql`
  mutation CompleteIntervention($id: UUID!, $actualCost: Decimal, $resolution: String) {
    completeIntervention(id: $id, actualCost: $actualCost, resolution: $resolution) {
      id
      status
      actualCost
      resolution
      completedDate
      updatedAt
    }
  }
`;
