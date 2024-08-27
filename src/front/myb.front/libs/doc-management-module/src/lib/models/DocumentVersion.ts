import { BaseModel } from '../../../../shared/infra/models/base.model';

export interface DocumentVersion extends BaseModel {
    documentId: number;
    version: number;
}
