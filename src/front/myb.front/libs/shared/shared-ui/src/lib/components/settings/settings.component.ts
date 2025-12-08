import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralSettingsService } from 'libs/shared/infra/services/general-settings.service';
import { Subscription } from 'rxjs';
import { NavBarComponent } from '../../LandingPage/NavBar/NavBar.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TimesheetSettingsComponent } from '@myb-front/time-sheet-module';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'myb-front-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    NavBarComponent,
    TranslateModule,
    TimesheetSettingsComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Input() categories: string[] = ['timesheet', 'invoice'];
  settings: { [key: string]: any } = {};
  keys: { [category: string]: string[] } = {};
  private subscription!: Subscription;

  constructor(
    private settingsService: GeneralSettingsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // this.subscription = this.settingsService.settings$.subscribe((settings) => {
    //   this.categories.forEach((category) => {
    //     this.settings[category] = settings[category];
    //     this.keys[category] = Object.keys(settings[category]);
    //   });
    // });
  }

  ngOnDestroy(): void {
    // if (this.subscription) {
    //   this.subscription.unsubscribe();
    // }
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
