import { Component, OnInit } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { EmployeeStatsComponent } from '../stats/employee-stats.component';
import { TimeoffListComponent } from '../timeoff-list/timeoff-list.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-employee-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmployeeStatsComponent,
    TimeoffListComponent,
    TranslateModule,
  ],
  templateUrl: './employee-edit.component.html',
  styleUrl: './employee-edit.component.css',
})
export class EmployeeEditComponent implements OnInit {
  employeeForm: FormGroup;
  employeeId!: string | null;
  isEditMode = false;
  suggestions: any[] = [];
  emailErrorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private keycloakService: KeycloakService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
  ) {
    this.employeeForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      department: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      isManager: [false],
      managerId: ['', Validators.required],
      createdAt: [new Date()],
      updatedAt: [new Date()],
    });

    this.keycloakService.userId$.subscribe((userId) => {
      if (userId) {
        this.employeeForm.get('managerId')?.setValue(userId);
      }
    });
  }

  ngOnInit(): void {
    const employeeState = history.state?.employee as Employee | null;
    if (employeeState) {
      this.isEditMode = true;
      this.employeeId = employeeState.id;
      this.employeeForm.patchValue(employeeState);
    } else {
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.employeeId = id;
          this.isEditMode = true;
          this.loadEmployee(this.employeeId);
        }
      });
    }

    this.employeeForm
      .get('email')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.emailErrorMessage = null;
        this.searchByEmail(value);
      });
  }

  searchByEmail(email: string): void {
    this.keycloakService
      .getUsersByEmailForClient(email)
      .then((users) => {
        if (users.length > 0) {
          this.suggestions = users;
          this.emailErrorMessage = null;
        } else {
          this.translate
            .get('NO_USER_FOUND')
            .subscribe((translatedMessage: string) => {
              this.emailErrorMessage = translatedMessage;
            });
          this.suggestions = [];
        }
      })
      .catch((err) => {
        console.error('Error fetching user by email:', err);
      });
  }

  onEmailChange(event: Event): void {
    const selectedEmail = (event.target as HTMLSelectElement).value;
    const user = this.suggestions.find(
      (suggestion) => suggestion.email === selectedEmail
    );

    if (user) {
      this.selectSuggestion(user);
    }
  }

  selectSuggestion(user: any): void {
    this.employeeForm.patchValue({
      id: user.id,
      email: user.email,
      name: user.firstName + ' ' + user.lastName,
    });
    this.suggestions = [];
    this.emailErrorMessage = null;
  }

  async saveEmployee(): Promise<void> {
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
        this.employeeService
          .create(employee)
          .subscribe(async (createdEmployee) => {
            this.toastService.show("L'employee ajouté avec succès!", {
              classname: 'border border-success bg-success text-light',
            });
            if (employee.id) {
              await this.keycloakService.assignRoleToUser(
                employee.id,
                'MYB_EMPLOYEE'
              );
            }
            this.router.navigate(['/timesheet/employees']);
          });
      }
    } else {
      this.employeeForm.markAllAsTouched();
    }
  }

  cancel(): void {
    this.router.navigate(['/timesheet/employees']);
  }

  loadEmployee(id: string): void {
    this.employeeService.get(id).subscribe((employee: any) => {
      this.employeeId = employee.id;
      this.employeeForm.patchValue(employee);
    });
  }
}
