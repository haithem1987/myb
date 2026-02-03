import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { OwnerService } from '../../services/owner.service';
import { Unit, CopropertyInvoice, MaintenanceRequest, InvoiceStatus, MaintenanceStatus } from '../../models';
import { InvoicePaymentDialogComponent } from './invoice-payment-dialog.component';
import { NewMaintenanceRequestDialogComponent } from './new-maintenance-request-dialog.component';
import { OwnerAssembliesComponent } from './owner-assemblies.component';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatTabsModule,
    OwnerAssembliesComponent
  ],
  template: `
    <div class="owner-dashboard">
      <div class="dashboard-header">
        <h1>My Properties</h1>
        <p class="subtitle">Manage your units, invoices, and maintenance requests</p>
      </div>

      <!-- My Units Section -->
      <section class="units-section">
        <h2><mat-icon>home</mat-icon> My Units</h2>
        @if (loading()) {
          <div class="loading">Loading your units...</div>
        } @else if (myUnits().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon>info</mat-icon>
              <p>No units found. Contact your property manager.</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <div class="units-grid">
            @for (unit of myUnits(); track unit.id) {
              <mat-card class="unit-card">
                <mat-card-header>
                  <mat-card-title>{{ unit.unitNumber }}</mat-card-title>
                <mat-card-subtitle>Unit in coproperty {{ unit.copropertyId.substring(0, 8) }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="unit-details">
                    <div class="detail-item">
                      <mat-icon>square_foot</mat-icon>
                      <span>{{ unit.area || 'N/A' }} m²</span>
                    </div>
                    <div class="detail-item">
                      <mat-icon>pie_chart</mat-icon>
                      <span>{{ unit.shares }} shares</span>
                    </div>
                    @if (unit.floor !== null && unit.floor !== undefined) {
                      <div class="detail-item">
                        <mat-icon>layers</mat-icon>
                        <span>Floor {{ unit.floor }}</span>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }
      </section>

      <!-- Pending Invoices Section -->
      <section class="invoices-section">
        <div class="section-header">
          <h2><mat-icon>receipt</mat-icon> Pending Invoices</h2>
          @if (pendingInvoices().length > 0) {
            <mat-chip class="invoice-count" highlighted>
              {{ pendingInvoices().length }} pending
            </mat-chip>
          }
        </div>

        @if (pendingInvoices().length === 0) {
          <mat-card class="empty-state success">
            <mat-card-content>
              <mat-icon>check_circle</mat-icon>
              <p>All invoices are paid! 🎉</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <div class="invoices-table-container">
            <table mat-table [dataSource]="pendingInvoices()" class="invoices-table">
              <!-- Invoice Number Column -->
              <ng-container matColumnDef="invoiceNumber">
                <th mat-header-cell *matHeaderCellDef>Invoice #</th>
                <td mat-cell *matCellDef="let invoice">{{ invoice.invoiceNumber }}</td>
              </ng-container>

              <!-- Unit Column -->
              <ng-container matColumnDef="unit">
                <th mat-header-cell *matHeaderCellDef>Unit</th>
                <td mat-cell *matCellDef="let invoice">
                  {{ getUnitNumber(invoice.unitId) }}
                </td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let invoice" class="amount">
                  {{ invoice.totalAmount | currency:'EUR' }}
                </td>
              </ng-container>

              <!-- Due Date Column -->
              <ng-container matColumnDef="dueDate">
                <th mat-header-cell *matHeaderCellDef>Due Date</th>
                <td mat-cell *matCellDef="let invoice">
                  <span [class.overdue]="isOverdue(invoice.dueDate)">
                    {{ invoice.dueDate | date:'dd/MM/yyyy' }}
                  </span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let invoice">
                  <mat-chip [class]="'status-' + invoice.status.toLowerCase()">
                    {{ invoice.status }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let invoice">
                  <button 
                    mat-raised-button 
                    color="primary"
                    (click)="openPaymentDialog(invoice)"
                  >
                    <mat-icon>payment</mat-icon>
                    Pay Now
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        }
      </section>

      <!-- Payment History Section -->
      <section class="history-section">
        <h2><mat-icon>history</mat-icon> Recent Payment History</h2>
        @if (paidInvoices().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon>info</mat-icon>
              <p>No payment history yet.</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <div class="history-list">
            @for (invoice of paidInvoices().slice(0, 5); track invoice.id) {
              <mat-card class="history-item">
                <mat-card-content>
                  <div class="history-details">
                    <div class="history-info">
                      <strong>{{ invoice.invoiceNumber }}</strong>
                      <span class="unit-label">{{ getUnitNumber(invoice.unitId) }}</span>
                    </div>
                    <div class="history-meta">
                      <span class="amount">{{ invoice.totalAmount | currency:'EUR' }}</span>
                      <span class="date">{{ invoice.paidDate | date:'dd/MM/yyyy' }}</span>
                      <mat-chip class="status-paid">Paid</mat-chip>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }
      </section>

      <!-- My Maintenance Requests Section -->
      <section class="maintenance-section">
        <div class="section-header">
          <h2><mat-icon>build</mat-icon> My Maintenance Requests</h2>
          <button mat-raised-button color="accent" (click)="createMaintenanceRequest()">
            <mat-icon>add</mat-icon>
            New Request
          </button>
        </div>

        @if (myMaintenanceRequests().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon>info</mat-icon>
              <p>No maintenance requests.</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <div class="maintenance-grid">
            @for (request of myMaintenanceRequests().slice(0, 4); track request.id) {
              <mat-card class="maintenance-card">
                <mat-card-header>
                  <mat-card-title>{{ request.title }}</mat-card-title>
                  <mat-chip [class]="'priority-' + request.priority.toLowerCase()">
                    {{ request.priority }}
                  </mat-chip>
                </mat-card-header>
                <mat-card-content>
                  <p class="description">{{ request.description }}</p>
                  <div class="request-meta">
                    <span class="category">
                      <mat-icon>category</mat-icon>
                      {{ request.category }}
                    </span>
                    <mat-chip [class]="'status-' + request.status.toLowerCase()">
                      {{ request.status }}
                    </mat-chip>
                  </div>
                  @if (request.estimatedCost) {
                    <div class="cost-estimate">
                      Estimated: {{ request.estimatedCost | currency:'EUR' }}
                    </div>
                  }
                </mat-card-content>
                <mat-card-actions>
                  <button mat-button (click)="viewRequestDetails(request.id)">
                    View Details
                  </button>
                </mat-card-actions>
              </mat-card>
            }
          </div>

      <!-- Assemblies/Meetings Section -->
      <section class="assemblies-section">
        <app-owner-assemblies [copropertyId]="primaryCopropertyId()"></app-owner-assemblies>
      </section>
        }
      </section>
    </div>
  `,
  styles: [`
    .owner-dashboard {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 32px;
      
      h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 500;
      }

      .subtitle {
        margin: 8px 0 0;
        color: rgba(0, 0, 0, 0.6);
      }
    }

    section {
      margin-bottom: 40px;

      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 24px;
        font-weight: 500;

        mat-icon {
          color: #1976d2;
        }
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .invoice-count {
        background-color: #f44336;
        color: white;
      }
    }

    .units-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .unit-card {
      .unit-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 16px;

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: rgba(0, 0, 0, 0.6);
          }
        }
      }
    }

    .invoices-table-container {
      overflow-x: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .invoices-table {
      width: 100%;

      .amount {
        font-weight: 500;
        color: #1976d2;
      }

      .overdue {
        color: #f44336;
        font-weight: 500;
      }

      .status-pending {
        background-color: #ff9800;
        color: white;
      }

      .status-overdue {
        background-color: #f44336;
        color: white;
      }

      .status-partiallypaid {
        background-color: #2196f3;
        color: white;
      }

      button {
        mat-icon {
          margin-right: 4px;
        }
      }
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .history-item {
      .history-details {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .history-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .unit-label {
            color: rgba(0, 0, 0, 0.6);
            font-size: 14px;
          }
        }

        .history-meta {
          display: flex;
          align-items: center;
          gap: 16px;

          .amount {
            font-weight: 500;
            color: #4caf50;
          }

          .date {
            color: rgba(0, 0, 0, 0.6);
          }
        }
      }
    }

    .status-paid {
      background-color: #4caf50;
      color: white;
    }

    .maintenance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .maintenance-card {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .description {
        margin: 0 0 12px;
        color: rgba(0, 0, 0, 0.7);
        font-size: 14px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .request-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;

        .category {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }

      .cost-estimate {
        margin-top: 8px;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
      }

      .priority-high,
      .priority-emergency {
        background-color: #f44336;
        color: white;
      }

      .priority-normal {
        background-color: #ff9800;
        color: white;
      }

      .priority-low {
        background-color: #4caf50;
        color: white;
      }

      .status-pending {
        background-color: #9e9e9e;
        color: white;
      }

      .status-assigned,
      .status-inprogress {
        background-color: #2196f3;
        color: white;
      }

      .status-completed {
        background-color: #4caf50;
        color: white;
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: rgba(0, 0, 0, 0.3);
        margin-bottom: 16px;
      }

      p {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        font-size: 16px;
      }

      &.success {
        mat-icon {
          color: #4caf50;
        }
      }
    }

    .loading {
      text-align: center;
      padding: 48px;
      color: rgba(0, 0, 0, 0.6);
    }

    @media (max-width: 768px) {
      .units-grid,
      .maintenance-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `]
})
export class OwnerDashboardComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private dialog = inject(MatDialog);
  private keycloakService = inject(KeycloakService);

  // Signals for reactive data
  myUnits = signal<Unit[]>([]);
  pendingInvoices = signal<CopropertyInvoice[]>([]);
  paidInvoices = signal<CopropertyInvoice[]>([]);
  myMaintenanceRequests = signal<MaintenanceRequest[]>([]);
  loading = signal(true);
  primaryCopropertyId = signal<string>('');

  displayedColumns: string[] = ['invoiceNumber', 'unit', 'amount', 'dueDate', 'status', 'actions'];

  ngOnInit(): void {
    this.loadOwnerData();
  }

  private loadOwnerData(): void {
    this.loading.set(true);
    
    const userId = this.getCurrentUserId();
    
    if (!userId) {
      console.error('User ID not available');
      this.loading.set(false);
      return;
    }

    // Load my units
    this.ownerService.getMyUnits(userId).subscribe({
      next: (units) => {
        this.myUnits.set(units);
        // Set primary coproperty ID from first unit
        if (units.length > 0) {
          this.primaryCopropertyId.set(units[0].copropertyId);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading units:', error);
        this.loading.set(false);
      }
    });

    // Load my invoices
    this.ownerService.getMyInvoices(userId).subscribe({
      next: (invoices) => {
        const pending = invoices.filter(inv => 
          inv.status === InvoiceStatus.PENDING || 
          inv.status === InvoiceStatus.OVERDUE ||
          inv.status === InvoiceStatus.PARTIALLY_PAID
        );
        const paid = invoices.filter(inv => inv.status === InvoiceStatus.PAID);
        
        this.pendingInvoices.set(pending);
        this.paidInvoices.set(paid);
      },
      error: (error) => console.error('Error loading invoices:', error)
    });

    // Load my maintenance requests
    this.ownerService.getMyMaintenanceRequests(userId).subscribe({
      next: (requests) => this.myMaintenanceRequests.set(requests),
      error: (error) => console.error('Error loading maintenance requests:', error)
    });
  }

  getUnitNumber(unitId: string): string {
    const unit = this.myUnits().find(u => u.id === unitId);
    return unit?.unitNumber || 'Unknown';
  }

  isOverdue(dueDate: Date): boolean {
    return new Date(dueDate) < new Date();
  }

  openPaymentDialog(invoice: CopropertyInvoice): void {
    const dialogRef = this.dialog.open<InvoicePaymentDialogComponent, { invoice: CopropertyInvoice }, any>(InvoicePaymentDialogComponent, {
      width: '600px',
      data: { invoice }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Reload data after successful payment
        this.loadOwnerData();
      }
    });
  }

  createMaintenanceRequest(): void {
    const dialogRef = this.dialog.open(NewMaintenanceRequestDialogComponent, {
      width: '600px',
      data: {
        copropertyId: this.primaryCopropertyId(),
        userId: this.getCurrentUserId()
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Reload maintenance requests
        this.loadOwnerData();
      }
    });
  }

  viewRequestDetails(requestId: string): void {
    // Navigate to request details or open dialog showing request details
    console.log('View request:', requestId);
    // Future: Implement detailed view dialog or navigation
  }

  private getCurrentUserId(): string | null {
    // Get user ID from Keycloak token
    const token = this.keycloakService.getToken();
    if (token) {
      try {
        // Decode JWT to get user ID (sub claim)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null;
      } catch (error) {
        console.error('Error parsing token:', error);
        return null;
      }
    }
    // Fallback for development/testing
    return 'current-user-id';
  }
}
