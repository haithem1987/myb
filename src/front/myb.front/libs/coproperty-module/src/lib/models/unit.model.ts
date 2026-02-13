import { Currency } from './coproperty.models';

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
  currency: Currency;
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
