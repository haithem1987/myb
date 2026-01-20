export interface FundCall {
  id: string;
  copropertyId: string;
  amount: number;
  dueDate: Date;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFundCallInput {
  copropertyId?: string;
  amount: number;
  dueDate: Date;
  description?: string;
}
