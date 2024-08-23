import { BaseModel } from '../../../../shared/infra/models/base.model';
import { DocumentStatus } from './DocumentStatus';
import { DocumentVersion } from './DocumentVersion';
import { Folder } from './Folder';
import { DocumentType } from './DocumentType';




export interface DocumentModel extends BaseModel {
    documentName?: string;
    createdBy: string;
    editedBy: string;
    documentType?: string;
    status?: string;
    documentSize?: number;
    folderId: number | null;
   // folder: Folder | null;
   // versions: DocumentVersion[] | null; 
    // content:string;
    // uploadedFiles?: SelectedFiles[];
    file?: string; 
    url?: string;
   

}