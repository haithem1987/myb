import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../models/employee';
import { Router } from '@angular/router';
import { EmployeeService } from '../../../services/employee.service';
import { CardComponent } from 'libs/shared/shared-ui/src';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-employee-card',
  standalone: true,
  imports: [CommonModule, CardComponent, TranslateModule],
  templateUrl: './employee-card.component.html',
  styleUrl: './employee-card.component.css',
})
export class EmployeeCardComponent {
  @Input() employee!: Employee;

  constructor(
    private router: Router,
    private employeeService: EmployeeService
  ) {}

  editEmployee(employee: Employee): void {
    this.router.navigate(['timesheet/employees/edit', employee.id], {
      state: { employee },
    });
  }
  deleteEmployee(id: string): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.delete(id).subscribe(() => {
        // this.employees$ = this.employeeService.getAll(); // Refresh the list
      });
    }
  }
}
