import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'myb-front-date-cell',
  standalone: true,
  imports: [CommonModule, NgbTooltip],
  templateUrl: './date-cell.component.html',
  styleUrl: './date-cell.component.css',
})
export class DateCellComponent {
  @Input() date!: {
    dateString: string;
    weekday: string;
    day: string;
    isToday: boolean;
  };
  @Input() holidayName: string = '';
  @Input() isHoliday: boolean = false;
}
