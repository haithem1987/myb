// timesheet-settings.service.ts
import { Injectable } from '@angular/core';

interface EnvironmentSettings {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class TimesheetSettingsService {
  private settings: EnvironmentSettings = {
    timesheet:{},
    invoice:{},
    document:{}

    // Add other settings as needed
  };

  getSetting(key: string): any {
    return this.settings[key];
  }

  setSetting(key: string, value: any): void {
    this.settings[key] = value;
  }

  // Environment specific methods
  getEnvironment(): EnvironmentSettings {
    return this.settings['environment'];
  }

  setEnvironment(environment: EnvironmentSettings): void {
    this.settings['environment'] = environment;
  }
}
