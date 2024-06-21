import { BaseModel } from 'libs/shared/infra/models/base.model';

export class Invoice extends BaseModel {
  invoiceNum?: string;
  userId?: string;
  companyId?: number;
  invoiceDate?: Date | null;
  dueDate?: Date | null;
  totalAmount?: number;
  subTotal?: number;
  status?: string;
  clientName?: string;
  clientAddress?: string;
  supplierName?: string;
  supplierAddress?: string;
  image?: string;
}
