import { BaseModel } from './base.model';
import { Employee } from './employee';
import { Project } from './project.model';

export interface Timesheet extends BaseModel {
  date: Date;
  workedHours: number;
  description?: string;
  isApproved: boolean;
  employeeId: number;
  employeeName?: string;
  projectId: number;
  projectName?: string;
  userId?: string;
}
