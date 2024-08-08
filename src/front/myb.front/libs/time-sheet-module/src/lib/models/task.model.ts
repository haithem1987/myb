import { BaseModel } from 'libs/shared/infra/models/base.model';
import { Employee } from './employee';
import { Project } from './project.model';

export class Task extends BaseModel {
  name: string = '';
  description: string = '';
  startTime: string = new Date().toUTCString();
  endTime: string = new Date().toISOString();
  isCompleted: boolean = false;
  employeeId?: number;
  dueDate?: string;
  projectId?: number;
  employee?: Employee;
  project?: Project;
  userId: string = '1';
}

// Optionally, if you have a base entity in Angular:
