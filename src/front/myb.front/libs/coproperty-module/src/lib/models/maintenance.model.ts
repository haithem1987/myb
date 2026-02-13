import { Currency } from './coproperty.models';

export enum MaintenanceCategory {
  Plumbing = 'PLUMBING',
  Electrical = 'ELECTRICAL',
  Heating = 'HEATING',
  Cleaning = 'CLEANING',
  Security = 'SECURITY',
  Structural = 'STRUCTURAL',
  Other = 'OTHER'
}

export enum Priority {
  Low = 'LOW',
  Normal = 'NORMAL',
  High = 'HIGH',
  Emergency = 'EMERGENCY'
}

export enum MaintenanceStatus {
  Pending = 'PENDING',
  Assigned = 'ASSIGNED',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED'
}

export interface MaintenanceRequest {
  id: string;
  copropertyId: string;
  unitId?: string;
  requestedBy: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  status: MaintenanceStatus;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  currency: Currency;
}

export interface CreateMaintenanceInput {
  copropertyId: string;
  unitId?: string;
  requestedBy: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority?: Priority;
  estimatedCost?: number;
  scheduledDate?: Date;
}

export interface UpdateMaintenanceInput {
  title?: string;
  description?: string;
  category?: MaintenanceCategory;
  priority?: Priority;
  status?: MaintenanceStatus;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
}
