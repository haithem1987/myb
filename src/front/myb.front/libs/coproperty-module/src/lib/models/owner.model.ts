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
