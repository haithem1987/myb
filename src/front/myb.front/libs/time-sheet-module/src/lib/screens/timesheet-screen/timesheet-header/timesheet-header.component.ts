import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-timesheet-header',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './timesheet-header.component.html',
  styleUrl: './timesheet-header.component.css',
})
export class TimesheetHeaderComponent {}
