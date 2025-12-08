import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimesheetService } from '../../../services/timesheet.service';
import { Timesheet } from '../../../models/timesheet.model';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'myb-front-employee-stats',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  animations: [
    trigger('myAnimation', [
      state(
        'state1',
        style({
          backgroundColor: 'red',
          transform: 'scale(1)',
        })
      ),
      state(
        'state2',
        style({
          backgroundColor: 'green',
          transform: 'scale(1.5)',
        })
      ),
      transition('state1 => state2', animate('300ms ease-in')),
      transition('state2 => state1', animate('300ms ease-out')),
    ]),
  ],
  templateUrl: './employee-stats.component.html',
  styleUrls: ['./employee-stats.component.css'],
})
export class EmployeeStatsComponent implements OnInit {
  @Input() employeeId!: number | null;
  workedHoursPerDay: any[] = [];
  workedHoursPerWeek: any[] = [];
  workedHoursPerMonth: any[] = [];
  customColors: any[] = ['natural'];

  view: [number, number] = [700, 300];
  animationState = 'state1';

  constructor(private timesheetService: TimesheetService) {}

  ngOnInit(): void {
    this.customColors = [
      {
        name: 'primary',
        value: getComputedStyle(document.documentElement).getPropertyValue(
          '--primary-color'
        ),
      },
      {
        name: 'secondary',
        value: getComputedStyle(document.documentElement).getPropertyValue(
          '--secondary-color'
        ),
      },
    ];
    this.loadWorkedHoursStats();
  }

  toggleAnimation() {
    this.animationState =
      this.animationState === 'state1' ? 'state2' : 'state1';
  }

  loadWorkedHoursStats(): void {
    if (!this.employeeId) return;
    this.timesheetService
      .getTimesheetsByEmployeeId(this.employeeId)
      .subscribe((timesheets) => {
        console.log('timesheets', timesheets);
        this.calculateWorkedHoursStats(timesheets);
      });
  }

  calculateWorkedHoursStats(timesheets: Timesheet[]): void {
    const dailyStats = new Map<string, number>();
    const weeklyStats = new Map<string, number>();
    const monthlyStats = new Map<string, number>();

    timesheets.forEach((timesheet) => {
      const date = timesheet.date ? new Date(timesheet.date) : new Date();
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = `${date.getFullYear()}-W${this.getWeekNumber(date)}`;
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      dailyStats.set(
        dayKey,
        (dailyStats.get(dayKey) || 0) + timesheet.workedHours
      );
      weeklyStats.set(
        weekKey,
        (weeklyStats.get(weekKey) || 0) + timesheet.workedHours
      );
      monthlyStats.set(
        monthKey,
        (monthlyStats.get(monthKey) || 0) + timesheet.workedHours
      );
    });

    this.workedHoursPerDay = Array.from(dailyStats.entries()).map(
      ([name, value]) => ({ name, value })
    );
    this.workedHoursPerWeek = Array.from(weeklyStats.entries()).map(
      ([name, value]) => ({ name, value })
    );
    this.workedHoursPerMonth = Array.from(monthlyStats.entries()).map(
      ([name, value]) => ({ name, value })
    );
  }

  getWeekNumber(d: Date): number {
    const onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(
      ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
    );
  }

  updateChart(type: string): void {
    switch (type) {
      case 'daily':
        this.workedHoursPerDay = [...this.workedHoursPerDay];
        break;
      case 'weekly':
        this.workedHoursPerWeek = [...this.workedHoursPerWeek];
        break;
      case 'monthly':
        this.workedHoursPerMonth = [...this.workedHoursPerMonth];
        break;
    }
  }
}
