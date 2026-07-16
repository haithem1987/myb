import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, firstValueFrom, combineLatest, switchMap, of } from 'rxjs';
import { catchError, map, debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { CopropertyService } from '../services/coproperty.service';
import { Coproperty } from '../models/coproperty.models';
import { ModalService, ToastService } from '@myb-front/shared-ui';

@Component({
  selector: 'myb-coproperty-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid mt-4">
      <!-- Header Section -->
      <div class="row mb-4">
        <div class="col-md-8">
          <h1>
            <i class="bi bi-buildings me-2"></i>
            {{ 'coproperty.list.title' | translate }}
          </h1>
          <p class="text-muted">{{ 'coproperty.list.subtitle' | translate }}</p>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary btn-violet" (click)="addCoproperty()">
            <i class="bi bi-plus-circle me-2"></i>
            {{ 'coproperty.list.addCoproperty' | translate }}
          </button>
        </div>
      </div>

      <!-- Search and Filter Section -->
      <div class="row mb-4">
        <div class="col-md-6 mb-2 mb-md-0">
          <div class="input-group">
            <span class="input-group-text bg-light">
              <i class="bi bi-search"></i>
            </span>
            <input 
              type="text" 
              class="form-control" 
              [placeholder]="'coproperty.list.search' | translate"
              [formControl]="searchControl"
              aria-label="Search coproperties"
            >
          </div>
        </div>
        <div class="col-md-6">
          <select 
            class="form-select" 
            [formControl]="filterControl"
            aria-label="Filter by status"
          >
            <option [value]="''">{{ 'coproperty.list.allCoproperties' | translate }}</option>
            <option [value]="'active'">{{ 'coproperty.list.active' | translate }}</option>
            <option [value]="'inactive'">{{ 'coproperty.list.inactive' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Coproperties List -->
      <ng-container *ngIf="filteredCoproperties$ | async as copropertiesList; else loadingOrError">
        <div *ngIf="copropertiesList.length > 0; else emptyState" class="row">
          <div *ngFor="let coproperty of copropertiesList" class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 shadow-sm coproperty-card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="card-title text-primary fw-bold mb-0">
                    <i class="bi bi-building me-2"></i>
                    {{ coproperty.name }}
                  </h5>
                  <span class="badge" [ngClass]="coproperty.isActive ? 'bg-success' : 'bg-secondary'">
                    {{ (coproperty.isActive ? 'coproperty.list.active' : 'coproperty.list.inactive') | translate }}
                  </span>
                </div>
                <p class="card-text text-muted mb-3">
                  <i class="bi bi-geo-alt-fill me-1"></i> {{ coproperty.address }}
                </p>
                <div class="row mt-3 mb-3">
                  <div class="col-6">
                    <div class="stat-box">
                      <div class="stat-label">{{ 'coproperty.list.totalUnits' | translate }}</div>
                      <div class="stat-value text-primary">
                        <i class="bi bi-building"></i> {{ coproperty.totalUnits }}
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="stat-box">
                      <div class="stat-label">{{ 'coproperty.list.totalShares' | translate }}</div>
                      <div class="stat-value text-info">
                        <i class="bi bi-pie-chart"></i> {{ coproperty.totalShares }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-3">
                  <button type="button" class="btn btn-sm btn-outline-primary flex-grow-1" 
                    (click)="viewDetails(coproperty.id)" [title]="'coproperty.list.view' | translate">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-violet flex-grow-1" 
                    (click)="editCoproperty(coproperty.id)" [title]="'coproperty.list.edit' | translate">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" 
                    (click)="distributeCharges(coproperty.id)" title="Calculate distribution">
                    <i class="bi bi-calculator"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-danger"
                    (click)="deleteCoproperty(coproperty)" [title]="'coproperty.list.delete' | translate">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ng-template #emptyState>
          <div class="text-center py-5 text-muted">
            <i class="bi bi-buildings display-4 d-block mb-3"></i>
            <p>{{ 'coproperty.list.noCoproperties' | translate }}</p>
          </div>
        </ng-template>
      </ng-container>

      <!-- Loading and Error States -->
      <ng-template #loadingOrError>
        <div *ngIf="!loadError()" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">{{ 'coproperty.list.loading' | translate }}</span>
          </div>
        </div>
        <div *ngIf="loadError()" class="text-center py-5">
          <i class="bi bi-exclamation-triangle-fill text-danger display-4 d-block mb-3"></i>
          <p class="text-danger">{{ loadError() }}</p>
          <button class="btn btn-outline-primary mt-2" (click)="reload()">
            <i class="bi bi-arrow-clockwise me-1"></i> {{ 'coproperty.list.retry' | translate }}
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .coproperty-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: 1px solid rgba(0,0,0,0.08);
    }
    
    .coproperty-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.2) !important;
    }
    
    .stat-box {
      text-align: center;
      padding: 10px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border-radius: 8px;
    }
    
    .stat-label {
      font-size: 0.75rem;
      color: #6c757d;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    .card-title {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }
    
    h1 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .input-group {
      border: 1px solid #dee2e6;
      border-radius: 0.375rem;
    }

    .input-group .form-control,
    .input-group .input-group-text {
      border: none;
    }

    @media (max-width: 992px) {
      .col-lg-4 { flex: 0 0 50%; max-width: 50%; }
    }

    @media (max-width: 576px) {
      .container-fluid { padding: 0.75rem; }
      h1 { font-size: 1.4rem; }
      .col-md-4.text-end { text-align: start !important; margin-top: 0.5rem; }
      .btn-violet { width: 100%; }
      .col-md-6, .col-lg-4 { flex: 0 0 100%; max-width: 100%; }
      .stat-value { font-size: 1.2rem; }
      .stat-label { font-size: 0.65rem; }
      .card-title { font-size: 1rem; }
    }
  `]
})
export class CopropertyListComponent {
  coproperties$: Observable<Coproperty[]>;
  readonly loadError = signal<string | null>(null);
  
  // Form controls for search and filter
  readonly searchControl = new FormControl('');
  readonly filterControl = new FormControl('');

  filteredCoproperties$: Observable<Coproperty[]>;

  private toastService = inject(ToastService);
  private modalService = inject(ModalService);
  private translateService = inject(TranslateService);

  constructor(private copropertyService: CopropertyService, private router: Router) {
    this.coproperties$ = this.loadCoproperties();
    this.filteredCoproperties$ = combineLatest([
      this.coproperties$,
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map(val => val?.toLowerCase() || ''),
        // Important: emit initial value to prevent combineLatest from blocking
        // Without this, the observable won't emit until user types in search
        startWith('')
      ),
      this.filterControl.valueChanges.pipe(
        distinctUntilChanged(),
        // Important: emit initial value to prevent combineLatest from blocking
        startWith('')
      )
    ]).pipe(
      map(([coproperties, searchTerm, filterStatus]) => {
        let filtered = [...coproperties];

        // Sort by createdAt descending (newest first)
        filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        // Filter by search term (name, address)
        if (searchTerm) {
          filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            c.address.toLowerCase().includes(searchTerm)
          );
        }

        // Filter by status
        if (filterStatus === 'active') {
          filtered = filtered.filter(c => c.isActive);
        } else if (filterStatus === 'inactive') {
          filtered = filtered.filter(c => !c.isActive);
        }

        return filtered;
      })
    );
  }

  
  private loadCoproperties(): Observable<Coproperty[]> {
    this.loadError.set(null);
    return this.copropertyService.getCoproperties().pipe(
      catchError(err => {
        const msg = err?.message || this.translateService.instant('Error loading coproperties');
        this.loadError.set(msg);
        return of([] as Coproperty[]);
      })
    );
  }

  reload(): void {
    this.coproperties$ = this.loadCoproperties();
  }

  viewDetails(id: string): void {
    this.router.navigate(['/coproperty/syndic/coproperties', id]);
  }

  editCoproperty(id: string): void {
    this.router.navigate(['/coproperty/syndic/coproperties', id, 'edit']);
  }

  addCoproperty(): void {
    this.router.navigate(['/coproperty/syndic/coproperties/new']);
  }

  manageTravaux(id: string): void {
    this.router.navigate(['/coproperty/syndic/coproperties', id], { queryParams: { tab: 'maintenance' } });
    this.toastService.show(this.translateService.instant('Access to work management'), { classname: 'bg-info text-light' });
  }

  createInvoice(id: string): void {
    // Invoice module is separate and not yet integrated
    this.toastService.show(this.translateService.instant('Billing feature will be available soon'), { classname: 'bg-warning text-dark' });
  }

  distributeCharges(id: string): void {
    this.router.navigate(['/coproperty/syndic/distribution'], { queryParams: { copropertyId: id } });
    this.toastService.show(this.translateService.instant('Calculate charge distribution'), { classname: 'bg-info text-light' });
  }

  async deleteCoproperty(coproperty: Coproperty): Promise<void> {
    // Check if there are associated units
    if (coproperty && coproperty.totalUnits && coproperty.totalUnits > 0) {
      // Show confirmation modal to delete units as well
      const deleteWithUnits = await this.modalService.confirm({
        title: this.translateService.instant('coproperty.unit.deleteUnitsWithCoproperty'),
        message: `${this.translateService.instant('coproperty.unit.deleteUnitsWarning').replace('{{count}}', coproperty.totalUnits.toString())}<br/><br/><strong class="text-danger">${this.translateService.instant('coproperty.list.deleteWarning')}</strong>`,
        confirmButtonText: this.translateService.instant('common.delete'),
        confirmButtonClass: 'btn-danger',
        cancelButtonText: this.translateService.instant('common.cancel')
      });

      if (!deleteWithUnits) {
        return;
      }
    }

    // Show final confirmation dialog before deletion
    const confirmed = await this.modalService.confirm({
      title: this.translateService.instant('coproperty.list.deleteConfirm'),
      message: `${this.translateService.instant('common.deleteMessage')}<br/>"<strong>${coproperty.name}</strong>"?<br/><br/><strong class="text-danger">${this.translateService.instant('coproperty.list.deleteWarning')}</strong>`,
      confirmButtonText: this.translateService.instant('common.delete'),
      confirmButtonClass: 'btn-danger',
      cancelButtonText: this.translateService.instant('common.cancel')
    });

    if (confirmed) {
      try {
        await firstValueFrom(this.copropertyService.deleteCoproperty(coproperty.id));
        this.toastService.show(
          `"${coproperty.name}" ${this.translateService.instant('coproperty.messages.deleted')}`,
          { classname: 'bg-success text-light' }
        );
        this.reload();
      } catch (error: any) {
        console.error('Delete error:', error);
        const errorMsg = error?.error?.errors?.[0]?.message || error?.message || this.translateService.instant('Error deleting coproperty');
        this.toastService.show(`Error: ${errorMsg}`, { classname: 'bg-danger text-light' });
      }
    }
  }
}
