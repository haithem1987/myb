import { BaseModel } from './base.model';

export class Project extends BaseModel {
  projectName: string = '';
  description: string = '';
  startDate: Date | null = new Date();
  endDate: Date | null = new Date();
  userId: string = '1';
}
