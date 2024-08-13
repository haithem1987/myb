import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../models/project.model';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressBarComponent } from 'libs/shared/shared-ui/src';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'myb-front-timesheet-table',
  standalone: true,
  imports: [CommonModule, TranslateModule, ProgressBarComponent, NgbTooltip],
  templateUrl: './timesheet-table.component.html',
  styleUrl: './timesheet-table.component.css',
})
export class TimesheetTableComponent {
  @Input() projects: Project[] | null = [];
  @Input() dateRange: any[] = [];
  @Input() totalPeriod = 7;
  @Input() timesheetQuantities: { [key: string]: number } = {};
  @Input() holidays: { [date: string]: string } = {};
  @Input() weekendDays: string[] = [];
  @Output() selectAll = new EventEmitter<any>();
  @Input() selectedProjects: Set<number> = new Set<number>();
  @Output() rowSelectChange = new EventEmitter<{
    projectId: number;
    event: Event;
  }>();
  @Output() quantityChange = new EventEmitter<{
    projectId: number;
    date: any;
    event: Event;
  }>();

  toggleSelectAll(event: Event) {
    this.selectAll.emit((event.target as HTMLInputElement).checked);
  }

  onRowSelectChange(projectId: number, event: Event) {
    this.rowSelectChange.emit({ projectId, event });
  }

  onQuantityChange(projectId: number, date: any, event: Event) {
    this.quantityChange.emit({ projectId, date, event });
  }
  isSelected(projectId: number): boolean {
    return this.selectedProjects.has(projectId);
  }
  trackByDate(
    index: number,
    date: { dateString: string; weekday: string; day: string }
  ) {
    return date.dateString;
  }

  trackByProject(index: number, project: Project) {
    return project.id;
  }

  getQuantityForDate(projectId: number, date: string): number {
    const key = `${projectId}.${date}`;
    return this.timesheetQuantities[key] || 0;
  }

  handleHoliday(date: {
    dateString: string;
    weekday: string;
    day: string;
    month: string;
    year: string;
  }): { isHoliday: boolean; name: string } {
    return {
      isHoliday: !!this.holidays[date.dateString],
      name: this.holidays[date.dateString] ?? '',
    };
  }

  getTotalQuantityForProject(projectId: number): number {
    let total = 0;
    for (const [key, quantity] of Object.entries(this.timesheetQuantities)) {
      if (key.startsWith(`${projectId}.`)) {
        total += quantity;
      }
    }
    return total;
  }

  isWeekend(date: { weekday: string; day: string }): boolean {
    return this.weekendDays.includes(date.weekday);
  }
}
