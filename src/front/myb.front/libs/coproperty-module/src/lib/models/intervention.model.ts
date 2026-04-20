export enum InterventionType {
  PLUMBING = 'Plumbing',
  ELECTRICITY = 'Electricity',
  ELEVATOR = 'Elevator',
  CLEANING = 'Cleaning',
  PAINTING = 'Painting',
  LOCKSMITH = 'Locksmith',
  GARDEN_MAINTENANCE = 'GardenMaintenance',
  PEST_CONTROL = 'PestControl',
  FIRE_SAFETY = 'FireSafety',
  ROOF_REPAIR = 'RoofRepair',
  COMMON_AREA_REPAIR = 'CommonAreaRepair',
  HEATING_COOLING = 'HeatingCooling',
  SECURITY_SYSTEM = 'SecuritySystem',
  WASTE_MANAGEMENT = 'WasteManagement',
  OTHER = 'Other',
}

export enum InterventionStatus {
  DRAFT = 'Draft',
  PLANNED = 'Planned',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  INVOICED = 'Invoiced',
}

export interface Intervention {
  id: string;
  copropertyId: string;
  unitId?: string;
  title: string;
  description: string;
  interventionType: InterventionType;
  priority: string;
  status: InterventionStatus;
  providerName?: string;
  providerPhone?: string;
  providerEmail?: string;
  assignedTo?: string;
  requestedBy?: string;
  estimatedCost?: number;
  actualCost?: number;
  plannedDate?: Date;
  startedDate?: Date;
  completedDate?: Date;
  notes?: string;
  resolution?: string;
  maintenanceRequestId?: string;
  currency?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateInterventionInput {
  copropertyId: string;
  unitId?: string;
  title: string;
  description: string;
  interventionType: string;
  priority: string;
  status?: string;
  providerName?: string;
  providerPhone?: string;
  providerEmail?: string;
  estimatedCost?: number;
  plannedDate?: string;
  notes?: string;
  maintenanceRequestId?: string;
}

export interface UpdateInterventionInput {
  id: string;
  copropertyId?: string;
  unitId?: string;
  title?: string;
  description?: string;
  interventionType?: string;
  priority?: string;
  status?: string;
  providerName?: string;
  providerPhone?: string;
  providerEmail?: string;
  estimatedCost?: number;
  actualCost?: number;
  plannedDate?: string;
  startedDate?: string;
  completedDate?: string;
  notes?: string;
  resolution?: string;
  maintenanceRequestId?: string;
}
