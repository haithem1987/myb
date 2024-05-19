import { BaseModel } from './BaseModel';
import { DocumentStatus } from './DocumentStatus';
import { DocumentVersion } from './DocumentVersion';
import { Folder } from './Folder';
import { DocumentType } from './DocumentType';




export interface DocumentModel extends BaseModel {

    documentName: string;
    createdBy: number;
    editedBy: number;
     createdDate: Date;
    documentType?: DocumentType;
    status?: DocumentStatus;
    documentSize: number;
    folderId: number | null;
    folder: Folder | null;
    versions: DocumentVersion[] | null; 
}