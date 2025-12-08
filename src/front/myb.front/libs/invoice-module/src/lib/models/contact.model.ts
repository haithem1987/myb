import { BaseModel } from "libs/shared/infra/models/base.model";
import { ContactType } from "./contactType";

export class Contact extends BaseModel{
    credentials!: string;
    type!: ContactType;
    clientID!: number;
}