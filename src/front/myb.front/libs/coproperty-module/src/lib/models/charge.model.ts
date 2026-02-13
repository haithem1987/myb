import { Currency } from './coproperty.models';

export enum ChargeType {
  Cleaning = 'CLEANING',
  Security = 'SECURITY',
  Maintenance = 'MAINTENANCE',
  Electricity = 'ELECTRICITY',
  Water = 'WATER',
  Insurance = 'INSURANCE',
  Other = 'OTHER'
}

export enum ChargeFrequency {
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  Annual = 'ANNUAL',
  Exceptional = 'EXCEPTIONAL'
}

export enum DistributionMethod {
  ByShares = 'BY_SHARES',
  ByArea = 'BY_AREA',
  Equal = 'EQUAL',
  Custom = 'CUSTOM'
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
  currency: Currency;
}

export interface CreateChargeInput {
  copropertyId: string;
  name: string;
  description?: string;
  chargeType: ChargeType;
  frequency: ChargeFrequency;
  totalAmount: number;
  distributionMethod: DistributionMethod;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
}

export interface UpdateChargeInput {
  name?: string;
  description?: string;
  chargeType?: ChargeType;
  frequency?: ChargeFrequency;
  totalAmount?: number;
  distributionMethod?: DistributionMethod;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

export interface ChargeDistribution {
  id: string;
  chargeId: string;
  unitId: string;
  amount: number;
  calculatedAt: Date;
  currency: Currency;
}
