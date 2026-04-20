import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InterventionService } from '../../services/intervention.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { Intervention } from '../../models/intervention.model';
import { Coproperty } from '../../models/coproperty.models';
import { ToastService } from '@myb-front/shared-ui';

@Component({
  selector: 'myb-intervention-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule, FormsModule],
  templateUrl: './intervention-list.component.html',
  styleUrls: ['./intervention-list.component.scss'],
})
export class InterventionListComponent implements OnInit, OnDestroy {
  private interventionService = inject(InterventionService);
  private copropertyService = inject(CopropertyService);
  private currencyService = inject(CurrencyService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Data
  readonly interventions = signal<Intervention[]>([]);
  readonly filteredInterventions = signal<Intervention[]>([]);
  readonly coproperties = signal<Coproperty[]>([]);

  // Stats
  readonly totalInterventions = signal<number>(0);
  readonly plannedCount = signal<number>(0);
  readonly inProgressCount = signal<number>(0);
  readonly emergencyCount = signal<number>(0);

  // State
  readonly isLoading = signal<boolean>(false);

  // Filters
  selectedCopropertyId = '';
  selectedStatus = '';
  selectedPriority = '';
  selectedType = '';
  searchTerm = '';

  private readonly destroy$ = new Subject<void>();

  get currencySymbol(): string {
    return this.currencyService.symbol;
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.copropertyService.getCoproperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cops) => {
          this.coproperties.set(cops);
          this.loadAllInterventions(cops);
        },
        error: (err) => {
          console.error('Error loading coproperties:', err);
          this.isLoading.set(false);
        },
      });
  }

  private loadAllInterventions(cops: Coproperty[]): void {
    if (cops.length === 0) {
      this.isLoading.set(false);
      return;
    }

    const requests = cops.map((cop) =>
      this.interventionService.getInterventionsByCoproperty(cop.id)
    );

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          const allInterventions = results.flat();
          this.interventions.set(allInterventions);
          this.updateStats(allInterventions);
          this.applyFilters();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading interventions:', err);
          this.isLoading.set(false);
        },
      });
  }

  private updateStats(items: Intervention[]): void {
    this.totalInterventions.set(items.length);
    this.plannedCount.set(items.filter((i) => i.status === 'Planned' || i.status === 'Draft').length);
    this.inProgressCount.set(items.filter((i) => i.status === 'InProgress').length);
    this.emergencyCount.set(items.filter((i) => i.priority === 'Emergency').length);
  }

  applyFilters(): void {
    let filtered = [...this.interventions()];

    if (this.selectedCopropertyId) {
      filtered = filtered.filter((i) => i.copropertyId === this.selectedCopropertyId);
    }
    if (this.selectedStatus) {
      filtered = filtered.filter((i) => i.status === this.selectedStatus);
    }
    if (this.selectedPriority) {
      filtered = filtered.filter((i) => i.priority === this.selectedPriority);
    }
    if (this.selectedType) {
      filtered = filtered.filter((i) => i.interventionType === this.selectedType);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(term) ||
          i.description.toLowerCase().includes(term) ||
          i.providerName?.toLowerCase().includes(term)
      );
    }

    this.filteredInterventions.set(filtered);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  createNew(): void {
    this.router.navigate(['/coproperty/syndic/interventions/new']);
  }

  editIntervention(id: string): void {
    this.router.navigate(['/coproperty/syndic/interventions', id, 'edit']);
  }

  deleteIntervention(intervention: Intervention): void {
    if (!confirm(`Delete intervention "${intervention.title}"?`)) return;

    this.interventionService.deleteIntervention(intervention.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.show('Intervention deleted', { classname: 'bg-success text-light' });
          this.loadData();
        },
        error: (err) => {
          console.error('Error deleting intervention:', err);
          this.toastService.show('Error deleting intervention', { classname: 'bg-danger text-light' });
        }
      });
  }

  getCopropertyName(copropertyId: string): string {
    return this.coproperties().find((c) => c.id === copropertyId)?.name || 'Unknown';
  }

  getStatusClass(status: string): string {
    const m: Record<string, string> = {
      Draft: 'bg-secondary',
      Planned: 'bg-info',
      InProgress: 'bg-warning text-dark',
      Completed: 'bg-success',
      Cancelled: 'bg-dark',
      Invoiced: 'bg-primary'
    };
    return m[status] || 'bg-secondary';
  }

  getStatusLabel(status: string): string {
    const m: Record<string, string> = {
      Draft: 'Draft',
      Planned: 'Planned',
      InProgress: 'In Progress',
      Completed: 'Completed',
      Cancelled: 'Cancelled',
      Invoiced: 'Invoiced'
    };
    return m[status] || status;
  }

  getPriorityClass(priority: string): string {
    const m: Record<string, string> = {
      Low: 'bg-secondary',
      Normal: 'bg-primary',
      High: 'bg-warning text-dark',
      Emergency: 'bg-danger'
    };
    return m[priority] || 'bg-secondary';
  }

  getPriorityLabel(priority: string): string {
    const m: Record<string, string> = {
      Low: 'Low',
      Normal: 'Normal',
      High: 'High',
      Emergency: 'Emergency'
    };
    return m[priority] || priority;
  }

  getTypeLabel(type: string): string {
    const m: Record<string, string> = {
      Plumbing: 'Plumbing',
      Electricity: 'Electricity',
      Elevator: 'Elevator',
      Cleaning: 'Cleaning',
      Painting: 'Painting',
      Locksmith: 'Locksmith',
      GardenMaintenance: 'Garden Maintenance',
      PestControl: 'Pest Control',
      FireSafety: 'Fire Safety',
      RoofRepair: 'Roof Repair',
      CommonAreaRepair: 'Common Area Repair',
      HeatingCooling: 'Heating/Cooling',
      SecuritySystem: 'Security System',
      WasteManagement: 'Waste Management',
      Other: 'Other'
    };
    return m[type] || type;
  }

  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount);
  }
}
