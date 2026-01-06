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

export interface CreateUnitInput {
  copropertyId: string;
  unitNumber: string;
  floor?: number;
  area?: number;
  shares: number;
  unitType?: string;
  description?: string;
  isOccupied?: boolean;
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
