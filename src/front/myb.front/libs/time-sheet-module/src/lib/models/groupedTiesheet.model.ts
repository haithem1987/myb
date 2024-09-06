import { Timesheet } from './timesheet.model';

export interface GroupedTimesheet {
  id: number;
  projectName: string;
  username: string;
  timesheets: Timesheet[];
  projectId: number;
}
