import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TimesheetSettingsComponent } from '../../components/timesheet-settings/timesheet-settings.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-settings-page',
  standalone: true,
  imports: [CommonModule, TimesheetSettingsComponent, TranslateModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
})
export class SettingsPageComponent {}
