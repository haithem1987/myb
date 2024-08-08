import { BaseModel } from 'libs/shared/infra/models/base.model';

export enum ProjectStatus {
  Active,
  Completed,
  Archived,
  Deleted,
}

export class Project extends BaseModel {
  projectName: string = '';
  description: string = '';
  startDate: Date | null = new Date();
  endDate: Date | null = null; // Initialized to null as it might not be set initially
  userId: string = '';
  status: string = 'ACTIVE'; //ProjectStatus = ProjectStatus.Active; // Default to Active
}
