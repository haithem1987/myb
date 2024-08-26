import { BaseModel } from "libs/shared/infra/models/base.model";
import { ClientType } from "./clientType";
import { Contact } from "./contact.model";

export class Client extends BaseModel{
    firstName!: string;
    lastName!: string;
    address!: string;
    clientType!: ClientType;
    contacts!: Contact[];
    isArchived!: boolean;
    companyId!: number;
    userId!: string;
}