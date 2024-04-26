import { BaseModel } from './base.model';
import { Task } from './task.model';

export interface Employee extends BaseModel {
  name: string;
  department: string;
  email: string;
  tasks?: Task[];
}
