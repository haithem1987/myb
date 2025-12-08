import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Timesheet } from '../models/timesheet.model';
import { GroupedTimesheet } from '../models/groupedTiesheet.model';

@Injectable({
  providedIn: 'root',
})
export class TimesheetUtilityService {
  constructor(private translate: TranslateService) {}

  calculateDateRange(selectedPeriod: 'week' | 'month', today: Date) {
    const todayString = today.toISOString().split('T')[0];
    const dateRange: {
      dateString: string;
      weekday: string;
      day: string;
      month: string;
      year: string;
      isToday: boolean;
    }[] = [];

    if (selectedPeriod === 'week') {
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      );
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        const currentDateString = currentDate.toISOString().split('T')[0];
        this.translate
          .get(
            `WEEKDAY.${currentDate
              .toLocaleDateString(undefined, { weekday: 'short' })
              .toLowerCase()}`
          )
          .subscribe((translatedWeekday) => {
            dateRange.push({
              dateString: currentDateString,
              weekday: translatedWeekday,
              day: currentDate.getDate().toString(),
              month: (currentDate.getMonth() + 1).toString(),
              year: currentDate.getFullYear().toString(),
              isToday: currentDateString === todayString,
            });
          });
        startOfWeek.setDate(startOfWeek.getDate() + 1);
      }
    } else if (selectedPeriod === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate();

      for (let i = 0; i < daysInMonth; i++) {
        const currentDate = new Date(startOfMonth);
        const currentDateString = currentDate.toLocaleDateString('en-CA');
        this.translate
          .get(
            `WEEKDAY.${currentDate
              .toLocaleDateString(undefined, { weekday: 'short' })
              .toLowerCase()}`
          )
          .subscribe((translatedWeekday) => {
            dateRange.push({
              dateString: currentDateString,
              weekday: translatedWeekday,
              day: currentDate.getDate().toString(),
              month: (currentDate.getMonth() + 1).toString(),
              year: currentDate.getFullYear().toString(),
              isToday: currentDateString === todayString,
            });
          });
        startOfMonth.setDate(startOfMonth.getDate() + 1);
      }
    }

    return dateRange;
  }

  setWeekendDays(): string[] {
    let weekendDays: string[] = [];
    this.translate.get('WEEKDAY.weekend').subscribe((days: string[]) => {
      weekendDays = days;
    });
    return weekendDays;
  }

  getTotalQuantitiesForPeriod(
    updatedTimesheets: any[],
    period: 'week' | 'month'
  ): number {
    const today = new Date();
    return updatedTimesheets.reduce((total, timesheet) => {
      const timesheetDate = new Date(timesheet.date || new Date());

      if (period === 'week') {
        const startOfWeek = new Date(
          today.setDate(today.getDate() - today.getDay())
        );
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        if (timesheetDate >= startOfWeek && timesheetDate <= endOfWeek) {
          return total + (timesheet.quantity || 0);
        }
      } else if (period === 'month') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );

        if (timesheetDate >= startOfMonth && timesheetDate <= endOfMonth) {
          return total + (timesheet.quantity || 0);
        }
      }
      return total;
    }, 0);
  }

  groupByProjectAndUsername(timesheets: Timesheet[]): GroupedTimesheet[] {
    let idCounter = 1;

    const grouped = timesheets.reduce((acc, timesheet) => {
      const key = `${timesheet.projectName}-${timesheet.username}`;
      if (!acc[key]) {
        acc[key] = {
          id: idCounter++,
          projectName: timesheet?.projectName ?? '',
          username: timesheet?.username ?? '',
          projectId: timesheet.projectId,
          timesheets: [],
        };
      }
      acc[key].timesheets.push(timesheet);
      return acc;
    }, {} as { [key: string]: GroupedTimesheet });

    return Object.values(grouped);
  }
}
