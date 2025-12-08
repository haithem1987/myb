import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { IntervenantTimesheetComponent } from './intervenant-timesheet/intervenant-timesheet.component';
import { TimesheetListComponent } from './list/timesheet-list.component';

@Component({
  selector: 'myb-front-timesheet-screen',
  standalone: true,
  imports: [
    CommonModule,
    TimesheetListComponent,
    IntervenantTimesheetComponent,
    TranslateModule,
  ],
  templateUrl: './timesheet-screen.component.html',
  styleUrls: ['./timesheet-screen.component.css'],
})
export class TimesheetScreenComponent implements OnInit {
  activeTab: 'MY_TIMESHEETS' | 'INTERVENANTS_TIMESHEETS' = 'MY_TIMESHEETS';
  isManager = false;

  constructor(private keycloakService: KeycloakService) {}

  ngOnInit(): void {
    // Determine if the user is a manager
    this.isManager = this.keycloakService.hasRole('MYB_MANAGER');
  }

  setActiveTab(tab: 'MY_TIMESHEETS' | 'INTERVENANTS_TIMESHEETS'): void {
    this.activeTab = tab;
  }
}
