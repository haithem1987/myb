import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { TimeOff } from '../../../models/timeoff.model';
import { EmployeeService } from '../../../services/employee.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

@Component({
  selector: 'myb-front-timeoff-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeoff-list.component.html',
  styleUrl: './timeoff-list.component.css',
})
export class TimeoffListComponent implements OnInit {
  @Input() employeeId!: number | null;
  timeoffs$: Observable<TimeOff[]> = this.employeeService.timeoffs$;

  constructor(
    private employeeService: EmployeeService,
    private toastService: ToastService,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    // console.log('employeeId', this.employeeId, typeof this.employeeId);
    // if (this.employeeId) {
    //   this.employeeService.getTimeOffsByEmployeeId(this.employeeId).subscribe({
    //     next: (resp) => {
    //       console.log('resp', resp);
    //       this.toastService.show('Timeoff list successfully', {
    //         classname: 'bg-success text-light',
    //       });
    //     },
    //     error: (err) => {
    //       console.log('error', err);
    //       this.toastService.show('Error time off', {
    //         classname: 'bg-danger text-light',
    //       });
    //     },
    //   });
    // }
  }
  getApprovalStatus(timeOff: TimeOff): {
    text: string;
    badgeClass: string;
  } {
    if (timeOff.isApproved) {
      return { text: 'Approuvé', badgeClass: 'bg-success' };
    } else {
      return { text: 'En attente', badgeClass: 'bg-warning' };
    }
  }
  approveTimeOff(timeOff: TimeOff): void {
    const updatedTimeOff = { ...timeOff, isApproved: true };
    this.employeeService.updateTimeOff(updatedTimeOff).subscribe({
      next: () => {
        this.toastService.show('Time off approved successfully', {
          classname: 'bg-success text-light',
        });
      },
      error: (err) => {
        this.toastService.show('Error approving time off', {
          classname: 'bg-danger text-light',
        });
      },
    });
  }

  disapproveTimeOff(timeOff: TimeOff): void {
    const updatedTimeOff = { ...timeOff, isApproved: false };
    this.employeeService.updateTimeOff(updatedTimeOff).subscribe({
      next: () => {
        this.toastService.show('Time off disapproved successfully', {
          classname: 'bg-success text-light',
        });
      },
      error: (err) => {
        this.toastService.show('Error disapproving time off', {
          classname: 'bg-danger text-light',
        });
      },
    });
  }
}
