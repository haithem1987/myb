import { BaseModel } from "libs/shared/infra/models/base.model";

export class InvoiceDetails extends BaseModel{
    productId?: number;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    invoiceID?: number;
}