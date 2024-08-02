import { BaseModel } from 'libs/shared/infra/models/base.model';
import { InvoiceDetails } from './invoiceDetails.model';

export class Invoice extends BaseModel {
  invoiceNum?: string;
  userId?: string;
  companyId?: number;
  invoiceDate?: Date | null;
  dueDate?: Date | null;
  totalAmount?: number;
  subTotal?: number;
  status?: string;
  clientID?: number;
  invoiceDetails?: InvoiceDetails[];
}
