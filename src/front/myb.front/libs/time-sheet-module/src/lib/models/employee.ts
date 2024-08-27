import { BaseModel } from 'libs/shared/infra/models/base.model';
import { Task } from './task.model';
import { TimeOff } from './timeoff.model';

export interface Employee {
  id: string;
  name: string;
  department: string;
  email: string;
  tasks?: Task[];
  isManager: boolean;
  managerId: string;
  timeOffs?: TimeOff[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
}
