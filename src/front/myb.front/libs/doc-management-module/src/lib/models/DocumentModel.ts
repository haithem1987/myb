import { BaseModel } from './BaseModel';
import { DocumentStatus } from './DocumentStatus';
import { DocumentVersion } from './DocumentVersion';
import { Folder } from './Folder';
import { DocumentType } from './DocumentType';




export interface DocumentModel extends BaseModel {
    [x: string]: any;

    documentName?: string;
    createdBy: number;
    editedBy: number;
    documentType?: string;
    status?: string;
    documentSize?: number;
    folderId: number | null;
   // folder: Folder | null;
   // versions: DocumentVersion[] | null; 
    // content:string;
    // uploadedFiles?: SelectedFiles[];
    file?: string; // Add file property to store the uploaded file
    // url?: string;
   

}