import { BaseModel } from 'libs/shared/infra/models/base.model';
import { Task } from './task.model';
import { TimeOff } from './timeoff.model';

export interface Employee extends BaseModel {
  name: string;
  department: string;
  email: string;
  tasks?: Task[];
  isManager: boolean;
  managerId: string;
  userId: string;
  timeOffs?: TimeOff[];
}
