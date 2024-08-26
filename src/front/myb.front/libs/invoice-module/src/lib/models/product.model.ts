import { BaseModel } from "libs/shared/infra/models/base.model";
import { ProductType } from "./productType";
import { Tax } from "./tax.model";

export class Product extends BaseModel{
    name!: string;
    description!: string;
    price!: number;
    unit!: string;
    taxId!: number;
    productType!: ProductType;
    tax!: Tax;
    isArchived!: boolean;
    companyId!: number;
    userId!: string;
}