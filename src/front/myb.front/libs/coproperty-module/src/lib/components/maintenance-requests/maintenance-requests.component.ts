import { Component, OnInit, signal, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
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
export class MaintenanceRequestsComponent implements OnInit, OnChanges {
  @Input() copropertyId: string | null = null;
  
  private maintenanceService = inject(MaintenanceService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  requests = signal<MaintenanceRequestExtended[]>([]);
  loading = signal(false);
  displayedColumns: string[] = ['title', 'unit', 'category', 'priority', 'status', 'createdAt', 'actions'];
  showAddForm: boolean = false;
  requestForm: FormGroup;
  editingRequestId: string | null = null;
  resolvedCopropertyId: string | null = null;
  alert = signal<{type: 'success' | 'danger' | 'warning' | null, message: string}>({type: null, message: ''});

  categories = ['PLUMBING', 'ELECTRICAL', 'HEATING', 'CLEANING', 'SECURITY', 'STRUCTURAL', 'OTHER'];
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
      requestedBy: ['00000000-0000-0000-0000-000000000000'],
      assignedTo: [null],
      estimatedCost: [0, Validators.min(0)],
      scheduledDate: [null],
    });
  }

  ngOnInit(): void {
    if (this.copropertyId) {
      this.resolvedCopropertyId = this.copropertyId;
      this.loadRequests();
    } else {
      // Get coproperty ID from parent route params
      this.route.parent?.params.subscribe(params => {
        const idFromRoute = params['id'];
        if (idFromRoute) {
          this.resolvedCopropertyId = idFromRoute;
          this.loadRequests();
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['copropertyId'] && !changes['copropertyId'].firstChange) {
      this.resolvedCopropertyId = this.copropertyId;
      if (this.copropertyId) {
        this.loadRequests();
      }
    }
  }

  loadRequests(): void {
    if (!this.resolvedCopropertyId) {
      this.requests.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.maintenanceService.getMaintenanceByCoproperty(this.resolvedCopropertyId).subscribe({
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
      requestedBy: '00000000-0000-0000-0000-000000000000',
      estimatedCost: 0,
      unitId: null,
      assignedTo: null,
      scheduledDate: null
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
      requestedBy: request.requestedBy,
      assignedTo: request.assignedTo,
      estimatedCost: request.estimatedCost,
      scheduledDate: request.scheduledDate,
    });
  }

  saveRequest(): void {
    if (this.requestForm.valid) {
      this.loading.set(true);
      const formValue = this.requestForm.value;
      const requestData: MaintenanceRequestExtended = {
        ...formValue,
        scheduledDate: formValue.scheduledDate ? this.convertToISODateTime(formValue.scheduledDate) : null,
        copropertyId: this.resolvedCopropertyId,
        id: this.editingRequestId || '00000000-0000-0000-0000-000000000000',
        requestedBy: formValue.requestedBy || '00000000-0000-0000-0000-000000000000',
        assignedTo: formValue.assignedTo || null
      };

      const operation = this.editingRequestId 
        ? this.maintenanceService.updateMaintenanceRequest(requestData)
        : this.maintenanceService.createMaintenanceRequest(requestData);

      operation.subscribe({
        next: () => {
          this.showAlert('success', this.editingRequestId ? 'Demande de maintenance modifiée avec succès' : 'Demande de maintenance créée avec succès');
          this.showAddForm = false;
          this.requestForm.reset();
          this.loadRequests();
        },
        error: (err) => {
          console.error('Error saving maintenance request:', err);
          this.showAlert('danger', 'Erreur lors de l\'enregistrement de la demande');
          this.loading.set(false);
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette demande ?`)) {
      this.loading.set(true);
      this.maintenanceService.deleteMaintenanceRequest(request.id!).subscribe({
        next: () => {
          this.showAlert('success', 'Demande de maintenance supprimée avec succès');
          this.loadRequests();
        },
        error: (err) => {
          console.error('Error deleting maintenance request:', err);
          this.showAlert('danger', 'Erreur lors de la suppression de la demande');
          this.loading.set(false);
        }
      });
    }
  }

  updateStatus(request: MaintenanceRequestExtended, newStatus: string): void {
    this.loading.set(true);
    this.maintenanceService.updateMaintenanceStatus(request.id!, newStatus).subscribe({
      next: () => {
        this.showAlert('success', 'Statut mis à jour avec succès');
        this.loadRequests();
      },
      error: (err) => {
        console.error('Error updating status:', err);
        this.showAlert('danger', 'Erreur lors de la mise à jour du statut');
        this.loading.set(false);
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

  private convertToISODateTime(dateString: string | null): string | null {
    if (!dateString) return null;
    // Convert YYYY-MM-DD to ISO DateTime (YYYY-MM-DDTHH:mm:ss)
    return `${dateString}T00:00:00`;
  }

  private showAlert(type: 'success' | 'danger' | 'warning', message: string) {
    this.alert.set({type, message});
    setTimeout(() => this.alert.set({type: null, message: ''}), 5000);
  }
}
