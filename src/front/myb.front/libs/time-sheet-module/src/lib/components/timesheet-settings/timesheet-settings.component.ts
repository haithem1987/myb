import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralSettingsService } from 'libs/shared/shared-ui/src';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'myb-front-timesheet-settings',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './timesheet-settings.component.html',
  styleUrl: './timesheet-settings.component.css',
})
export class TimesheetSettingsComponent {
  settings: any;

  constructor(private settingsService: GeneralSettingsService) {
    console.log(
      'timesheet',
      this.settingsService.getCategorySettings('timesheet')
    );
    this.settings = this.settingsService.getCategorySettings('timesheet');
  }

  onSettingChange(key: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;

    // Determine if the target is an HTMLInputElement (e.g., checkbox) or HTMLSelectElement
    if (target instanceof HTMLInputElement) {
      const value = target.type === 'checkbox' ? target.checked : target.value;
      this.settingsService.setSetting('timesheet', key, value);
    } else if (target instanceof HTMLSelectElement) {
      const value = target.value;
      this.settingsService.setSetting('timesheet', key, value);
    }
  }
}
