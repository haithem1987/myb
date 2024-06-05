import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Employee } from '../../../models/employee';
import { EmployeeService } from '../../../services/employee.service';
import { Router } from '@angular/router';
import { EmployeeCardComponent } from '../card/employee-card.component';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { LoaderComponent, NoResultComponent } from 'libs/shared/shared-ui/src';

@Component({
  selector: 'myb-front-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    EmployeeCardComponent,
    LoaderComponent,
    NoResultComponent,
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css',
})
export class EmployeeListComponent implements OnInit {
  employees$: Observable<Employee[]> = this.employeeService.employees$;
  userId$: Observable<string | null> = this.keycloakService.userId$;

  constructor(
    private employeeService: EmployeeService,
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId$.subscribe((userId) => {
      if (!userId) return;
      this.employeeService.getEmployeesByManagerId(userId).subscribe();
    });
  }

  addEmployee(): void {
    this.router.navigate(['/timesheet/employees/new']);
  }
}
