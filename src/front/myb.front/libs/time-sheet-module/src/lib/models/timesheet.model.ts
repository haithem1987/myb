import { BaseModel } from 'libs/shared/infra/models/base.model';

export enum TimeUnit {
  HOUR = 'HOUR',
  DAY = 'DAY',
  MONTH = 'MONTH',
}
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
export interface Timesheet extends BaseModel {
  date: Date | null;
  workedHours: number;
  description?: string;
  status: ApprovalStatus;
  quantity?: number;
  projectId: number;
  projectName?: string;
  userId?: string | null;
  username?: string | null;
  timeUnit: TimeUnit;
}
