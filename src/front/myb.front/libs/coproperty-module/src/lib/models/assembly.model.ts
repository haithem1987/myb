export interface Assembly {
  id: string;
  copropertyId: string;
  title: string;
  meetingDate: Date;
  location?: string;
  agenda?: string;
  minutes?: string;
  assemblyType: AssemblyType;
  status: AssemblyStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  attendances?: AssemblyAttendance[];
}

export enum AssemblyType {
  ORDINARY = 'Ordinary',
  EXTRAORDINARY = 'Extraordinary'
}

export enum AssemblyStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface AssemblyAttendance {
  id: string;
  assemblyId: string;
  ownerId: string;
  isPresent: boolean;
  hasProxy: boolean;
  proxyHolderName?: string;
  checkInTime?: Date;
  createdAt: Date;
}

export interface CreateAssemblyInput {
  copropertyId?: string;
  title: string;
  meetingDate: Date;
  location?: string;
  agenda?: string;
  assemblyType?: AssemblyType;
}
