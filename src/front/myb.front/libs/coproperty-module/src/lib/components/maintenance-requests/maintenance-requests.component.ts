import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { MaintenanceService, MaintenanceRequestExtended } from '../../services/maintenance.service';

@Component({
  selector: 'myb-maintenance-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './maintenance-requests.component.html',
  styleUrls: ['./maintenance-requests.component.scss'],
})
export class MaintenanceRequestsComponent implements OnInit {
  private maintenanceService = inject(MaintenanceService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  requests = signal<MaintenanceRequestExtended[]>([]);
  loading = signal(false);
  displayedColumns: string[] = ['title', 'unit', 'category', 'priority', 'status', 'createdAt', 'actions'];
  showAddForm: boolean = false;
  requestForm: FormGroup;
  editingRequestId: number | null = null;
  copropertyId: number = 0;

  categories = ['PLUMBING', 'ELECTRICAL', 'HEATING', 'ELEVATOR', 'ROOF', 'FACADE', 'OTHER'];
  priorities = ['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'];
  statuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  filterStatus: string = '';
  filterPriority: string = '';

  constructor() {
    this.requestForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', Validators.required],
      category: ['PLUMBING', Validators.required],
      priority: ['NORMAL', Validators.required],
      status: ['PENDING', Validators.required],
      unitId: [null],
      reportedBy: ['', Validators.required],
      assignedTo: [''],
      estimatedCost: [0, Validators.min(0)],
      scheduledDate: [null],
    });
  }

  ngOnInit(): void {
    // Get coproperty ID from route params
    this.route.params.subscribe(params => {
      this.copropertyId = +params['id'] || 0;
      if (this.copropertyId > 0) {
        this.loadRequests();
      }
    });
  }

  loadRequests(): void {
    if (!this.copropertyId || this.copropertyId === 0) {
      this.requests.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.maintenanceService.getMaintenanceByCoproperty(this.copropertyId).subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading maintenance requests:', err);
        this.loading.set(false);
      }
    });
  }

  get filteredRequests(): MaintenanceRequestExtended[] {
    const allRequests = this.requests();
    return allRequests.filter((req) => {
      const statusMatch = !this.filterStatus || req.status === this.filterStatus;
      const priorityMatch = !this.filterPriority || req.priority === this.filterPriority;
      return statusMatch && priorityMatch;
    });
  }

  openAddForm(): void {
    this.showAddForm = true;
    this.editingRequestId = null;
    this.requestForm.reset({ 
      category: 'PLUMBING', 
      priority: 'NORMAL',
      status: 'PENDING',
      copropertyId: this.copropertyId 
    });
  }

  editRequest(request: MaintenanceRequestExtended): void {
    this.editingRequestId = request.id || null;
    this.showAddForm = true;
    this.requestForm.patchValue({
      title: request.title,
      description: request.description,
      category: request.category,
      priority: request.priority,
      status: request.status,
      unitId: request.unitId,
      reportedBy: request.reportedBy,
      assignedTo: request.assignedTo,
      estimatedCost: request.estimatedCost,
      scheduledDate: request.scheduledDate,
    });
  }

  saveRequest(): void {
    if (this.requestForm.valid) {
      this.loading.set(true);
      const requestData: MaintenanceRequestExtended = {
        ...this.requestForm.value,
        copropertyId: this.copropertyId,
        ...(this.editingRequestId && { id: this.editingRequestId })
      };

      const operation = this.editingRequestId 
        ? this.maintenanceService.updateMaintenanceRequest(requestData)
        : this.maintenanceService.createMaintenanceRequest(requestData);

      operation.subscribe({
        next: () => {
          this.showAddForm = false;
          this.requestForm.reset();
          this.loadRequests();
        },
        error: (err) => {
          console.error('Error saving maintenance request:', err);
          this.loading.set(false);
          alert('Failed to save maintenance request');
        }
      });
    }
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.editingRequestId = null;
    this.requestForm.reset();
  }

  viewRequest(request: MaintenanceRequestExtended): void {
    alert(`View details for: ${request.title}\n\nStatus: ${request.status}\nPriority: ${request.priority}`);
  }

  deleteRequest(request: MaintenanceRequestExtended): void {
    if (confirm(`Are you sure you want to delete this request?`)) {
      this.loading.set(true);
      this.maintenanceService.deleteMaintenanceRequest(request.id!).subscribe({
        next: () => {
          this.loadRequests();
        },
        error: (err) => {
          console.error('Error deleting maintenance request:', err);
          this.loading.set(false);
          alert('Failed to delete maintenance request');
        }
      });
    }
  }

  updateStatus(request: MaintenanceRequestExtended, newStatus: string): void {
    this.loading.set(true);
    this.maintenanceService.updateMaintenanceStatus(request.id!, newStatus).subscribe({
      next: () => {
        this.loadRequests();
      },
      error: (err) => {
        console.error('Error updating status:', err);
        this.loading.set(false);
        alert('Failed to update status');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge-secondary';
      case 'ASSIGNED':
        return 'badge-primary';
      case 'IN_PROGRESS':
        return 'badge-info';
      case 'COMPLETED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'LOW':
        return 'badge-info';
      case 'NORMAL':
        return 'badge-warning';
      case 'HIGH':
        return 'badge-danger';
      case 'EMERGENCY':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
}
