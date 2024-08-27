import { BaseModel } from 'libs/shared/infra/models/base.model';

export class Tax extends BaseModel {
    name?: string;
    value?: number;
    isPercentage?: boolean;
    isArchived!: boolean;
    companyId!: number;
    userId!: string;
}