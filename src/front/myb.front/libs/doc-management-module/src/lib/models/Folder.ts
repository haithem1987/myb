import { BaseModel } from "./BaseModel";
import { DocumentModel } from "./DocumentModel";

export interface Folder extends BaseModel {
    parentId: number | null; 
    folderName: string;
    createdBy: number;
    editedBy: number;
    createdDate: Date;
    lastModifiedDate: Date;
    documents: DocumentModel[] | null;
    children: Folder[] | null; 
  }