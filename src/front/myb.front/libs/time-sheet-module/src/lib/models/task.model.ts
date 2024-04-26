import { BaseModel } from './base.model';
import { Employee } from './employee';
import { Project } from './project.model';

export interface Task extends BaseModel {
  startTime: Date;
  endTime: Date;
  description: string;
  employeeId?: number;
  projectId?: number;
  employee?: Employee;
  project?: Project;
}

// Optionally, if you have a base entity in Angular:
