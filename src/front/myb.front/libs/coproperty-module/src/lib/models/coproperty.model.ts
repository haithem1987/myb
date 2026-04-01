export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  TND = 'TND',
  GBP = 'GBP',
  CHF = 'CHF',
  CAD = 'CAD',
  AED = 'AED',
  MAD = 'MAD'
}

export interface Coproperty {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  currency: Currency;
  description?: string;
  totalUnits: number;
  totalShares: number;
  commonAreas?: string;
  managerName?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCopropertyInput {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  currency?: Currency;
  description?: string;
  totalUnits: number;
  totalShares: number;
  commonAreas?: string;
  managerId?: string;
  managerName?: string;
  isActive: boolean;
}

export interface UpdateCopropertyInput {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  currency?: Currency;
  description?: string;
  totalUnits?: number;
  totalShares?: number;
  commonAreas?: string;
  isActive?: boolean;
}
