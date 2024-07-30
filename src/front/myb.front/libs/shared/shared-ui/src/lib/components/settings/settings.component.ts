import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralSettingsService } from 'libs/shared/infra/services/general-settings.service';
import { Subscription } from 'rxjs';
import { BreadcrumbComponent } from 'libs/time-sheet-module/src/lib/components/breadcrumb/breadcrumb.component';
import { NavBarComponent } from '../../LandingPage/NavBar/NavBar.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-settings',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    NavBarComponent,
    TranslateModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Input() categories: string[] = ['timesheet', 'invoice']; // You can pass the categories dynamically
  settings: { [key: string]: any } = {};
  keys: { [category: string]: string[] } = {};
  private subscription!: Subscription;

  constructor(
    private settingsService: GeneralSettingsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.subscription = this.settingsService.settings$.subscribe((settings) => {
      this.categories.forEach((category) => {
        this.settings[category] = settings[category];
        this.keys[category] = Object.keys(settings[category]);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onSettingChange(category: string, key: string, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let value: any;

    switch (inputElement.type) {
      case 'checkbox':
        value = inputElement.checked;
        break;
      case 'number':
        value = inputElement.valueAsNumber;
        break;
      default:
        value = inputElement.value;
        break;
    }

    this.settingsService.setSetting(category, key, value);
  }

  getType(value: any): string {
    return typeof value;
  }
}
