import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CopropertyService } from '../services/coproperty.service';
import { Coproperty } from '../models/coproperty.models';
import { ToastService, ModalService } from '@myb-front/shared-ui';

@Component({
  selector: 'myb-coproperty-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="container-fluid mt-4">
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

      <ng-container *ngIf="coproperties$ | async as copropertiesList; else loadingOrError">
        <div *ngIf="copropertiesList.length > 0; else emptyState" class="row">
          <div *ngFor="let coproperty of copropertiesList" class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 shadow-sm coproperty-card">
              <div class="card-body">
                <h5 class="card-title text-primary fw-bold">
                  <i class="bi bi-building me-2"></i>
                  {{ coproperty.name }}
                </h5>
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
                    (click)="viewDetails(coproperty.id)" title="{{ 'coproperty.list.view' | translate }}">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-violet flex-grow-1" 
                    (click)="editCoproperty(coproperty.id)" title="{{ 'coproperty.list.edit' | translate }}">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" 
                    (click)="distributeCharges(coproperty.id)" title="Calculer distribution">
                    <i class="bi bi-calculator"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-danger" 
                    (click)="deleteCoproperty(coproperty.id, coproperty.name)" title="{{ 'coproperty.list.delete' | translate }}">
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
            <i class="bi bi-arrow-clockwise me-1"></i> Réessayer
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
  
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);

  constructor(private copropertyService: CopropertyService, private router: Router) {
    this.coproperties$ = this.loadCoproperties();
  }

  private loadCoproperties(): Observable<Coproperty[]> {
    this.loadError.set(null);
    return this.copropertyService.getCoproperties().pipe(
      catchError(err => {
        const msg = err?.message || 'Erreur lors du chargement des copropriétés';
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
    this.toastService.show('Accès à la gestion des travaux', { classname: 'bg-info text-light' });
  }

  createInvoice(id: string): void {
    // Invoice module is separate and not yet integrated
    this.toastService.show('La fonctionnalité de facturation sera bientôt disponible', { classname: 'bg-warning text-dark' });
  }

  distributeCharges(id: string): void {
    this.router.navigate(['/coproperty/syndic/distribution'], { queryParams: { copropertyId: id } });
    this.toastService.show('Calcul de la distribution des charges', { classname: 'bg-info text-light' });
  }

  async deleteCoproperty(id: string, name: string): Promise<void> {
    console.log('Attempting to delete coproperty with ID:', id);
    const confirmed = await this.modalService.confirm({
      title: 'Supprimer la copropriété',
      message: 'Êtes-vous sûr de vouloir supprimer la copropriété "' + name + '" ?<br/><br/><strong class="text-danger">Cette action est irréversible.</strong><br/>Toutes les données associées (lots, charges, propriétaires) seront supprimées.',
      confirmButtonText: 'Supprimer',
      confirmButtonClass: 'btn-danger',
      cancelButtonText: 'Annuler'
    });
    console.log('User confirmation result:', confirmed);
    if (confirmed) {
      try {
        console.log('Calling delete mutation for ID:', id);
        await firstValueFrom(this.copropertyService.deleteCoproperty(id));
        this.toastService.show('La copropriété "' + name + '" a été supprimée avec succès', { classname: 'bg-success text-light' });
        this.reload();
      } catch (error: any) {
        console.error('Delete error:', error);
        const errorMsg = error?.error?.errors?.[0]?.message || error?.message || 'Erreur lors de la suppression';
        this.toastService.show('Erreur: ' + errorMsg, { classname: 'bg-danger text-light' });
      }
    }
  }
}
