export * from './coproperty.models';
export * from './assembly.model';
export * from './fund-call.model';

// Export specific types from invoice.model to avoid conflicts
export type { RecordPaymentInput } from './invoice.model';

// Input types for mutations
export interface CreateFundCallInput {
  copropertyId?: string;
  amount: number;
  dueDate: Date;
  description?: string;
}

export interface CreateCopropertyInput {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  description?: string;
  totalUnits: number;
  totalShares: number;
  commonAreas?: string;
  managerId?: string;
  managerName?: string;
  isActive: boolean;
}

export interface FundCall {
  id: string;
  copropertyId: string;
  amount: number;
  dueDate: Date;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Additional input types for other entities
export interface CreateUnitInput {
  copropertyId: string;
  unitNumber: string;
  floor?: number;
  area?: number;
  shares: number;
  unitType?: string;
  description?: string;
}

export interface UpdateUnitInput {
  unitNumber?: string;
  floor?: number;
  area?: number;
  shares?: number;
  unitType?: string;
  description?: string;
  isOccupied?: boolean;
}

export interface CreateChargeInput {
  copropertyId: string;
  name: string;
  description?: string;
  chargeType: string;
  frequency: string;
  totalAmount: number;
  distributionMethod: string;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
}

export interface UpdateChargeInput {
  name?: string;
  description?: string;
  totalAmount?: number;
  frequency?: string;
  endDate?: Date;
  isActive?: boolean;
}

export interface CreateMaintenanceInput {
  copropertyId: string;
  unitId?: string;
  requestedBy: string;
  title: string;
  description: string;
  category: string;
  priority: string;
}

export interface UpdateMaintenanceInput {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
}
