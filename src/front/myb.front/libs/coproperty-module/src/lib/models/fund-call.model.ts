import { Currency } from './coproperty.models';

export interface FundCall {
  id: string;
  copropertyId: string;
  amount: number;
  dueDate: Date;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  currency: Currency;
}

export interface CreateFundCallInput {
  copropertyId?: string;
  amount: number;
  dueDate: Date;
  description?: string;
}
