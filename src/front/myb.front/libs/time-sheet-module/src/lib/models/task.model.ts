import { BaseModel } from './base.model';
import { Employee } from './employee';
import { Project } from './project.model';

export class Task extends BaseModel {
  startTime: string = new Date().toUTCString();
  endTime: string = new Date().toISOString();
  description: string = '';
  employeeId?: number;
  projectId?: number;
  employee?: Employee;
  project?: Project;
}

// Optionally, if you have a base entity in Angular:
