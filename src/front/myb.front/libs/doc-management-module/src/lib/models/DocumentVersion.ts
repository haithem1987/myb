import { BaseModel } from "./BaseModel";

export interface DocumentVersion extends BaseModel {
    documentId: number;
    version: number;
}
