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

export interface CreateCopropertyInput {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country?: string;
  description?: string;
  totalShares: number;
  commonAreas?: string;
  managerId: string;
}

export interface UpdateCopropertyInput {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  totalShares?: number;
  commonAreas?: string;
  isActive?: boolean;
}
