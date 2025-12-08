// general-settings.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface Settings {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class GeneralSettingsService {
  private settings: Settings = {
    timesheet: {
      autoSave: true,
      defaultHours: 8,
      notifications: false,
      timeUnit: 'Hour',
      timeUnitOptions: ['Hour', 'Day'],
    },
    invoice: {
      autoSave: true,
      defaultHours: 8,
      notifications: false,
    },
    // other settings categories...
  };

  private settingsSubject = new BehaviorSubject<Settings>(this.settings);

  settings$ = this.settingsSubject.asObservable();

  getSetting(category: string, key: string): any {
    return this.settings[category]?.[key];
  }

  setSetting(category: string, key: string, value: any): void {
    if (!this.settings[category]) {
      this.settings[category] = {};
    }
    this.settings[category][key] = value;
    this.settingsSubject.next(this.settings);
  }

  getCategorySettings(category: string): any {
    return this.settings[category];
  }

  setCategorySettings(category: string, settings: any): void {
    this.settings[category] = settings;
    this.settingsSubject.next(this.settings);
  }
}
