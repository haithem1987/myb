import { BaseModel } from './base.model';

export interface Project extends BaseModel {
  projectName: string;
  description: string;
  startDate: Date;
  endDate: Date;
  userId: string;
}
