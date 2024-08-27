import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { Employee } from '../../../models/employee';
import { EmployeeService } from '../../../services/employee.service';
import { Router } from '@angular/router';
import { EmployeeCardComponent } from '../card/employee-card.component';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { LoaderComponent, NoResultComponent } from 'libs/shared/shared-ui/src';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeCardComponent,
    LoaderComponent,
    NoResultComponent,
    TranslateModule,
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css',
})
export class EmployeeListComponent implements OnInit {
  employees$: Observable<Employee[]> = this.employeeService.employees$;
  userId$: Observable<string | null> = this.keycloakService.userId$;
  private subscriptions: Subscription = new Subscription();
  constructor(
    private employeeService: EmployeeService,
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // this.subscriptions.add(
    this.userId$.subscribe((userId) => {
      console.log('userId', userId);
      if (!userId) return;
      this.employeeService.getEmployeesByManagerId(userId).subscribe();
    });
    // );
  }

  // ngOnDestroy(): void {
  //   this.subscriptions.unsubscribe();
  // }

  addEmployee(): void {
    this.router.navigate(['/timesheet/employees/new']);
  }
}
