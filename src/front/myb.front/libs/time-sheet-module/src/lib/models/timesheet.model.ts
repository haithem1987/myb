import { BaseModel } from './base.model';
import { Employee } from './employee';
import { Project } from './project.model';

export interface Timesheet extends BaseModel {
  date: Date;
  workedHours: number;
  description?: string;
  isApproved: boolean;
  employeeId: number;
  employee?: Employee;
  projectId: number;
  project?: Project;
  userId?: string;
}
