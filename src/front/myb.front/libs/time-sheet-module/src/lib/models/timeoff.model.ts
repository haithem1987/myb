import { BaseModel } from './base.model';

export interface TimeOff extends BaseModel {
  startDate: Date;
  endDate: Date;
  reason: string;
  isApproved: boolean;
  employeeId?: number;
}
