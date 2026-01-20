import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  unitId?: string;
  unitNumber?: string;
  createdAt: Date;
  estimatedCost?: number;
  actualCost?: number;
  photos: string[];
}

@Component({
  selector: 'myb-maintenance-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './maintenance-requests.component.html',
  styleUrls: ['./maintenance-requests.component.scss'],
})
export class MaintenanceRequestsComponent implements OnInit {
  requests: MaintenanceRequest[] = [];
  displayedColumns: string[] = ['title', 'unit', 'category', 'priority', 'status', 'createdAt', 'actions'];
  showAddForm: boolean = false;
  requestForm: FormGroup;

  categories = ['Plumbing', 'Electrical', 'Heating', 'Elevator', 'Cleaning', 'Security', 'Structure', 'Other'];
  priorities = ['Low', 'Medium', 'High', 'Urgent'];
  statuses = ['New', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];

  filterStatus: string = '';
  filterPriority: string = '';

  constructor(private fb: FormBuilder) {
    this.requestForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', Validators.required],
      category: ['Plumbing', Validators.required],
      priority: ['Medium', Validators.required],
      unitId: [''],
    });
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    // TODO: Implement GraphQL query to fetch maintenance requests
    // Mock data
    this.requests = [
      {
        id: '1',
        title: 'Leaking faucet',
        description: 'Kitchen faucet is leaking',
        category: 'Plumbing',
        priority: 'High',
        status: 'New',
        unitNumber: 'A101',
        unitId: '1',
        createdAt: new Date(),
        photos: [],
      },
      {
        id: '2',
        title: 'Faulty elevator',
        description: 'Elevator stops between floors',
        category: 'Elevator',
        priority: 'Urgent',
        status: 'Assigned',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        photos: [],
      },
    ];
  }

  get filteredRequests(): MaintenanceRequest[] {
    return this.requests.filter((req) => {
      const statusMatch = !this.filterStatus || req.status === this.filterStatus;
      const priorityMatch = !this.filterPriority || req.priority === this.filterPriority;
      return statusMatch && priorityMatch;
    });
  }

  openAddForm(): void {
    this.showAddForm = true;
    this.requestForm.reset({ category: 'Plumbing', priority: 'Medium' });
  }

  saveRequest(): void {
    if (this.requestForm.valid) {
      const newRequest: MaintenanceRequest = {
        id: Math.random().toString(36),
        ...this.requestForm.value,
        status: 'New',
        createdAt: new Date(),
        photos: [],
      };

      // TODO: Implement GraphQL mutation to create request
      this.requests.push(newRequest);
      alert('Maintenance request created successfully');
      this.showAddForm = false;
      this.requestForm.reset();
    }
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.requestForm.reset();
  }

  viewRequest(request: MaintenanceRequest): void {
    alert(`View details for: ${request.title}\n\nStatus: ${request.status}\nPriority: ${request.priority}`);
  }

  deleteRequest(request: MaintenanceRequest): void {
    if (confirm(`Are you sure you want to delete this request?`)) {
      // TODO: Implement GraphQL mutation
      this.requests = this.requests.filter((r) => r.id !== request.id);
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'New':
        return 'badge-secondary';
      case 'Assigned':
        return 'badge-primary';
      case 'In Progress':
        return 'badge-info';
      case 'Completed':
        return 'badge-success';
      case 'Cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'Low':
        return 'badge-info';
      case 'Medium':
        return 'badge-warning';
      case 'High':
        return 'badge-danger';
      case 'Urgent':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
}
