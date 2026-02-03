import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MaintenanceService, MaintenanceRequestExtended } from '../../services/maintenance.service';
import { OwnerService } from '../../services/owner.service';

@Component({
  selector: 'app-new-maintenance-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>New Maintenance Request</h2>
    <mat-dialog-content>
      <form [formGroup]="requestForm" class="request-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" required>
          @if (requestForm.get('title')?.hasError('required')) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="4" required></textarea>
          @if (requestForm.get('description')?.hasError('required')) {
            <mat-error>Description is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Unit</mat-label>
          <mat-select formControlName="unitId">
            @for (unit of myUnits(); track unit.id) {
              <mat-option [value]="unit.id">{{ unit.unitNumber }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category" required>
            <mat-option value="PLUMBING">Plumbing</mat-option>
            <mat-option value="ELECTRICAL">Electrical</mat-option>
            <mat-option value="HEATING">Heating</mat-option>
            <mat-option value="CLEANING">Cleaning</mat-option>
            <mat-option value="SECURITY">Security</mat-option>
            <mat-option value="STRUCTURAL">Structural</mat-option>
            <mat-option value="OTHER">Other</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority" required>
            <mat-option value="LOW">Low</mat-option>
            <mat-option value="NORMAL">Normal</mat-option>
            <mat-option value="HIGH">High</mat-option>
            <mat-option value="EMERGENCY">Emergency</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Preferred Date (Optional)</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="scheduledDate">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="!requestForm.valid || submitting()">
        {{ submitting() ? 'Submitting...' : 'Submit Request' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .request-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 500px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }
  `]
})
export class NewMaintenanceRequestDialogComponent {
  private fb = inject(FormBuilder);
  private maintenanceService = inject(MaintenanceService);
  private ownerService = inject(OwnerService);
  dialogRef = inject(MatDialogRef<NewMaintenanceRequestDialogComponent>);
  data: { copropertyId: string; userId: string } = inject(MAT_DIALOG_DATA);

  myUnits = signal<any[]>([]);
  submitting = signal(false);

  requestForm: FormGroup;

  constructor() {
    this.requestForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      unitId: [null],
      category: ['OTHER', Validators.required],
      priority: ['NORMAL', Validators.required],
      scheduledDate: [null]
    });

    // Load user's units
    if (this.data.userId) {
      this.ownerService.getMyUnits(this.data.userId).subscribe({
        next: (units) => this.myUnits.set(units),
        error: (error) => console.error('Error loading units:', error)
      });
    }
  }

  submit(): void {
    if (this.requestForm.valid) {
      this.submitting.set(true);

      const formValue = this.requestForm.value;
      const request: MaintenanceRequestExtended = {
        copropertyId: this.data.copropertyId,
        unitId: formValue.unitId,
        requestedBy: this.data.userId,
        title: formValue.title,
        description: formValue.description,
        category: formValue.category as 'PLUMBING' | 'ELECTRICAL' | 'HEATING' | 'CLEANING' | 'SECURITY' | 'STRUCTURAL' | 'OTHER',
        priority: formValue.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY',
        status: 'PENDING',
        scheduledDate: formValue.scheduledDate || undefined
      };

      this.maintenanceService.createMaintenanceRequest(request).subscribe({
        next: (result) => {
          this.submitting.set(false);
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error creating maintenance request:', error);
          this.submitting.set(false);
        }
      });
    }
  }
}
