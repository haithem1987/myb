import { BaseModel } from 'libs/time-sheet-module/src/lib/models/base.model';
export class Invoice extends BaseModel {
  public invoiceNum?: string;
  public userId?: string;
  public companyId?: string;
  public invoiceDate?: Date;
  public dueDate?: Date;
  public totalAmount?: number;
  public subTotal?: number;
  public clientName?: string;
  public clientAddress?: string;
  public supplierName?: string;
  public supplierAddress?: string;
}
