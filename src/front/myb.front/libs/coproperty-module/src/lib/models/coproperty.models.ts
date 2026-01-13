export interface Coproperty {
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
  managerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  copropertyId: string;
  unitNumber: string;
  floor?: number;
  area?: number;
  shares: number;
  unitType?: string;
  description?: string;
  isOccupied: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Owner {
  id: string;
  userId: string;
  unitId: string;
  ownershipPercentage: number;
  startDate: Date;
  endDate?: Date;
  isMainOwner: boolean;
  createdAt: Date;
}

export interface Charge {
  id: string;
  copropertyId: string;
  name: string;
  description?: string;
  chargeType: ChargeType;
  frequency: ChargeFrequency;
  totalAmount: number;
  distributionMethod: DistributionMethod;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface ChargeDistribution {
  id: string;
  chargeId: string;
  unitId: string;
  amount: number;
  calculatedAt: Date;
}

export interface CopropertyInvoice {
  id: string;
  invoiceNumber: string;
  chargeId: string;
  unitId: string;
  ownerId: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  invoiceDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  paidDate?: Date;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
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
}

export enum ChargeType {
  CLEANING = 'Cleaning',
  SECURITY = 'Security',
  MAINTENANCE = 'Maintenance',
  ELECTRICITY = 'Electricity',
  WATER = 'Water',
  INSURANCE = 'Insurance',
  OTHER = 'Other',
}

export enum ChargeFrequency {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  ANNUAL = 'Annual',
  EXCEPTIONAL = 'Exceptional',
}

export enum DistributionMethod {
  BY_SHARES = 'ByShares',
  BY_AREA = 'ByArea',
  EQUAL = 'Equal',
  CUSTOM = 'Custom',
}

export enum InvoiceStatus {
  PENDING = 'Pending',
  PARTIALLY_PAID = 'PartiallyPaid',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
}

export enum MaintenanceCategory {
  PLUMBING = 'Plumbing',
  ELECTRICAL = 'Electrical',
  HEATING = 'Heating',
  CLEANING = 'Cleaning',
  SECURITY = 'Security',
  STRUCTURAL = 'Structural',
  OTHER = 'Other',
}

export enum Priority {
  LOW = 'Low',
  NORMAL = 'Normal',
  HIGH = 'High',
  EMERGENCY = 'Emergency',
}

export enum MaintenanceStatus {
  PENDING = 'Pending',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}
