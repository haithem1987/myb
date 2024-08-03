import { BaseModel } from "libs/shared/infra/models/base.model";

export class InvoiceDetails extends BaseModel{
    productId?: number;
    description?: string;
    unit?: string;
    quantity?: number;
    unitPriceHT?: number;
    unitPrice?: number;
    invoiceID?: number;
}