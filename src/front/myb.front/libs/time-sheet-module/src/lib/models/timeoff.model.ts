import { BaseModel } from 'libs/shared/infra/models/base.model';

export interface TimeOff extends BaseModel {
  startDate: Date;
  endDate: Date;
  reason: string;
  isApproved: boolean;
  employeeId?: number;
}
