import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TimesheetService } from '../../services/timesheet.service';
import { Timesheet } from '../../models/timesheet.model';
import { TimesheetListComponent } from './list/timesheet-list.component';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { TranslateModule } from '@ngx-translate/core';
import { IntervenantTimesheetTableComponent } from './intervenant-timesheet-table/intervenant-timesheet-table.component';

@Component({
  selector: 'myb-front-timesheet-screen',
  standalone: true,
  imports: [
    CommonModule,
    TimesheetListComponent,
    IntervenantTimesheetTableComponent,
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
    this.isManager = this.keycloakService.isUserManager();
  }

  setActiveTab(tab: 'MY_TIMESHEETS' | 'INTERVENANTS_TIMESHEETS'): void {
    this.activeTab = tab;
  }
}
