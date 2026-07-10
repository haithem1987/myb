export interface TenantUnit {
  id?: string;
  copropertyId: string;
  copropertyName?: string;
  unitNumber: string;
  floor?: number;
  area?: number;
  shares: number;
  unitType?: string;
  isOccupied: boolean;
}

export interface Tenant {
  id: string;
  unitId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  leaseStartDate: string | Date;
  leaseEndDate?: string | Date | null;
  monthlyRent?: number | null;
  depositAmount?: number | null;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  unit?: TenantUnit;
}

export interface TenantInput {
  id?: string;
  unitId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  leaseStartDate: string;
  leaseEndDate?: string | null;
  monthlyRent?: number | null;
  depositAmount?: number | null;
  isActive: boolean;
  notes?: string | null;
}
