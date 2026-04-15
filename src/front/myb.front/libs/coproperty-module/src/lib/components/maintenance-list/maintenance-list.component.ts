import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MaintenanceService, MaintenanceRequestExtended } from '../../services/maintenance.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { Coproperty } from '../../models/coproperty.models';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, finalize, switchMap } from 'rxjs/operators';

@Component({
  selector: 'myb-maintenance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './maintenance-list.component.html',
  styleUrls: ['./maintenance-list.component.scss'],
})
export class MaintenanceListComponent implements OnInit {
  private maintenanceService = inject(MaintenanceService);
  private copropertyService = inject(CopropertyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  requests = signal<MaintenanceRequestExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filterStatus = signal<string>('');
  filterPriority = signal<string>('');
  filterCategory = signal<string>('');

  categories = ['PLUMBING', 'ELECTRICAL', 'HEATING', 'CLEANING', 'SECURITY', 'STRUCTURAL', 'OTHER'];
  priorities = ['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'];
  statuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  ngOnInit(): void {
    this.loadCoproperties();
    this.loadAllRequests();
  }

  loadCoproperties(): void {
    this.copropertyService.getCoproperties().subscribe({
      next: (data) => {
        this.coproperties.set(data);
        // Auto-select first coproperty by default
        if (data.length > 0 && !this.selectedCopropertyId()) {
          this.onCopropertyChange(data[0].id);
        }
      },
      error: (err) => {
        console.error('Error loading coproperties:', err);
      }
    });
  }

  loadAllRequests(): void {
    this.loading.set(true);
    this.copropertyService.getCoproperties()
      .pipe(
        switchMap((coproperties) => {
          if (coproperties.length === 0) {
            this.requests.set([]);
            return of([]);
          }

          const requestRequests = coproperties.map(coproperty =>
            this.maintenanceService.getMaintenanceByCoproperty(coproperty.id).pipe(
              map(requests => ({
                requests,
                copropertyName: coproperty.name
              }))
            )
          );

          return forkJoin(requestRequests).pipe(
            map(results => results.flatMap(result =>
              result.requests.map(request => ({
                ...request,
                copropertyName: result.copropertyName
              } as any))
            ))
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (allRequests) => {
          this.requests.set(allRequests);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading maintenance requests:', err);
          this.loading.set(false);
        }
      });
  }

  onCopropertyChange(copropertyId: string): void {
    this.selectedCopropertyId.set(copropertyId);
    
    if (!copropertyId || copropertyId === 'all') {
      this.loadAllRequests();
    } else {
      this.loading.set(true);
      this.maintenanceService.getMaintenanceByCoproperty(copropertyId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (requests) => {
            const coproperty = this.coproperties().find(c => c.id === copropertyId);
            const requestsWithCoproperty = requests.map(request => ({
              ...request,
              copropertyName: coproperty?.name || ''
            } as any));
            this.requests.set(requestsWithCoproperty);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error loading maintenance requests:', err);
            this.loading.set(false);
          }
        });
    }
  }

  onCopropertyFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.onCopropertyChange(select.value);
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterStatus.set(select.value);
  }

  onPriorityFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterPriority.set(select.value);
  }

  onCategoryFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterCategory.set(select.value);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  get filteredRequests(): MaintenanceRequestExtended[] {
    let filtered = this.requests();

    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(term) ||
        request.description?.toLowerCase().includes(term) ||
        (request as any).copropertyName?.toLowerCase().includes(term)
      );
    }

    if (this.filterStatus()) {
      filtered = filtered.filter(request => request.status === this.filterStatus());
    }

    if (this.filterPriority()) {
      filtered = filtered.filter(request => request.priority === this.filterPriority());
    }

    if (this.filterCategory()) {
      filtered = filtered.filter(request => request.category === this.filterCategory());
    }

    return filtered;
  }

  getPendingCount(): number {
    return this.filteredRequests.filter(r => r.status === 'PENDING').length;
  }

  getInProgressCount(): number {
    return this.filteredRequests.filter(r => r.status === 'IN_PROGRESS').length;
  }

  getCompletedCount(): number {
    return this.filteredRequests.filter(r => r.status === 'COMPLETED').length;
  }

  getEmergencyCount(): number {
    return this.filteredRequests.filter(r => r.priority === 'EMERGENCY').length;
  }

  viewRequest(request: MaintenanceRequestExtended): void {
    this.router.navigate(['/coproperty/syndic/coproperties', request.copropertyId], { 
      queryParams: { tab: 'maintenance' } 
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'bg-secondary',
      'ASSIGNED': 'bg-primary',
      'IN_PROGRESS': 'bg-info',
      'COMPLETED': 'bg-success',
      'CANCELLED': 'bg-danger'
    };
    return statusMap[status] || 'bg-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'ASSIGNED': 'Assigné',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  }

  getPriorityBadgeClass(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'LOW': 'bg-info',
      'NORMAL': 'bg-primary',
      'HIGH': 'bg-warning',
      'EMERGENCY': 'bg-danger'
    };
    return priorityMap[priority] || 'bg-secondary';
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'LOW': 'Faible',
      'NORMAL': 'Normal',
      'HIGH': 'Élevé',
      'EMERGENCY': 'Urgence'
    };
    return labels[priority] || priority;
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'PLUMBING': 'Plomberie',
      'ELECTRICAL': 'Électricité',
      'HEATING': 'Chauffage',
      'CLEANING': 'Nettoyage',
      'SECURITY': 'Sécurité',
      'STRUCTURAL': 'Structure',
      'OTHER': 'Autre'
    };
    return labels[category] || category;
  }

  getCopropertyName(request: MaintenanceRequestExtended): string {
    return (request as any).copropertyName || '';
  }

  private currencyService = inject(CurrencyService);

  formatCost(cost: number | undefined): string {
    if (cost == null || cost === 0) return '-';
    return this.currencyService.formatAmount(cost);
  }
}
