import { BaseModel } from '../../../../shared/infra/models/base.model';
import { DocumentModel } from "./DocumentModel";

export interface Folder extends BaseModel {
  
    parentId: number | null; 
    folderName: string;
    createdBy: string;
    editedBy: string;
    documents?: DocumentModel[] | null;
   // children?: Folder[] | null; 
    
  
  }