import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EmployeeService } from '../../../services/employee.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Employee } from '../../../models/employee';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-front-employee-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-edit.component.html',
  styleUrl: './employee-edit.component.css',
})
export class EmployeeEditComponent implements OnInit {
  employeeForm: FormGroup;
  employeeId?: number;
  isEditMode = false;
  suggestions: Employee[] = [];
  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private keycloakService: KeycloakService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.employeeForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      department: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      isManager: [false],
      managerId: ['', Validators.required],
      userId: [''],
    });
    this.keycloakService.userId$.subscribe((userId) => {
      console.log('userId', userId);
      if (userId) {
        this.employeeForm.get('managerId')?.setValue(userId);
      }
    });
  }
  ngOnInit(): void {
    console.log('this.employeeForm', this.employeeForm.value);
    const employeeState = history.state.employee as Employee;
    console.log('employeeState', employeeState);
    if (employeeState) {
      this.isEditMode = true;
      this.employeeId = employeeState.id;
      this.employeeForm.patchValue(employeeState);
    } else {
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.employeeId = +id;
          this.isEditMode = true;
          this.loadEmployee(this.employeeId);
        }
      });
    }
    this.employeeForm
      .get('email')
      ?.valueChanges.pipe(
        debounceTime(300), // wait for 300ms pause in events
        distinctUntilChanged() // only emit if value is different from previous value
      )
      .subscribe((value) => {
        if (this.employeeForm.get('email')?.valid) {
          this.searchByEmail(value);
        }
      });
    console.log('this.employeeForm.value', this.employeeForm.value);
  }

  searchByEmail(email: string): void {
    this.keycloakService
      .getUsersByEmailForClient(email)
      .then((users) => {
        console.log('users', users);
        this.suggestions = users;
      })
      .catch((err) => {
        console.error('Error fetching user by email:', err);
      });
  }

  loadEmployee(id: number): void {
    // this.employeeService.getById(id).subscribe((employee:any) => {
    //   this.employeeForm.patchValue(employee);
    // });
  }

  saveEmployee(): void {
    if (this.employeeForm.valid) {
      const employee = this.employeeForm.value as Employee;
      if (this.isEditMode && this.employeeId) {
        this.employeeService.update(this.employeeId, employee).subscribe(() => {
          this.toastService.show("L'employee modifié avec succès!", {
            classname: 'border border-success bg-success text-light',
          });
          this.router.navigate(['/timesheet/employees']);
        });
      } else {
        this.employeeService.create(employee).subscribe(() => {
          this.toastService.show("L'employee ajouté avec succès!", {
            classname: 'border border-success bg-success text-light',
          });
          this.router.navigate(['/timesheet/employees']);
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/timesheet/employees']);
  }
}
