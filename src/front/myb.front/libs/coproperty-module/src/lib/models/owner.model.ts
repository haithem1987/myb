export interface OwnerUnit {
  id: string;
  ownerId: string;
  unitId: string;
  ownershipPercentage: number;
  startDate: Date;
  endDate?: Date;
  isMainOwner: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Owner {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ownerUnits?: OwnerUnit[];
  createdAt?: Date;
  updatedAt?: Date;
  
  // Deprecated - for backward compatibility
  unitId?: string;
  ownershipPercentage?: number;
  startDate?: Date;
  endDate?: Date;
  isMainOwner?: boolean;
}

export interface OwnerWithUnits extends Owner {
  ownerUnits: Array<OwnerUnit & {
    unit?: {
      id: string;
      unitNumber: string;
      copropertyId?: string;
    };
  }>;
}

export interface OwnerUnitInput {
  unitId: string;
  ownershipPercentage?: number;
  startDate?: string | Date;
  endDate?: string | Date | null;
  isMainOwner?: boolean;
}

export interface CreateOwnerWithUnitsInput {
  id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  units: OwnerUnitInput[];
}

export interface AddOwnerInput {
  userId: string;
  unitId: string;
  ownershipPercentage?: number;
  startDate: Date;
  endDate?: Date;
  isMainOwner?: boolean;
}

export interface UpdateOwnerInput {
  ownershipPercentage?: number;
  endDate?: Date;
  isMainOwner?: boolean;
}
