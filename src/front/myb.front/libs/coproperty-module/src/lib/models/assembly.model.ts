export interface Assembly {
  id: string;
  copropertyId: string;
  title: string;
  date: Date;
  agenda?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssemblyInput {
  copropertyId?: string;
  title: string;
  date: Date;
  agenda?: string;
}
