import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
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
          <h1>{{ 'coproperty.list.title' | translate }}</h1>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="addCoproperty()">
            <i class="bi bi-plus-lg"></i>
            {{ 'coproperty.list.addCoproperty' | translate }}
          </button>
        </div>
      </div>

      <div *ngIf="coproperties$ | async as copropertiesList" class="row">
        <div *ngFor="let coproperty of copropertiesList" class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">{{ coproperty.name }}</h5>
              <p class="card-text text-muted">
                <i class="bi bi-geo-alt-fill"></i> {{ coproperty.address }}
              </p>
              <div class="row mt-3">
                <div class="col-6">
                  <p class="card-text mb-2">
                    <strong>{{ 'coproperty.list.totalUnits' | translate }}:</strong><br/>
                    <span class="badge bg-primary">{{ coproperty.totalUnits }}</span>
                  </p>
                </div>
                <div class="col-6">
                  <p class="card-text mb-2">
                    <strong>{{ 'coproperty.list.totalShares' | translate }}:</strong><br/>
                    <span class="badge bg-info">{{ coproperty.totalShares }}</span>
                  </p>
                </div>
              </div>
              <div class="d-flex flex-wrap gap-2 mt-3">
                <button type="button" class="btn btn-sm btn-outline-primary flex-grow-1" 
                  (click)="viewDetails(coproperty.id)" title="{{ 'coproperty.list.view' | translate }}">
                  <i class="bi bi-eye"></i> {{ 'coproperty.list.view' | translate }}
                </button>
                <button type="button" class="btn btn-sm btn-outline-warning flex-grow-1" 
                  (click)="editCoproperty(coproperty.id)" title="{{ 'coproperty.list.edit' | translate }}">
                  <i class="bi bi-pencil-square"></i> {{ 'coproperty.list.edit' | translate }}
                </button>
                <button type="button" class="btn btn-sm btn-outline-info"  
                  (click)="manageTravaux(coproperty.id)" title="Gérer les travaux">
                  <i class="bi bi-tools"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-success" 
                  (click)="createInvoice(coproperty.id)" title="Créer facture">
                  <i class="bi bi-receipt"></i>
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

      <div *ngIf="!(coproperties$ | async)" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">{{ 'coproperty.list.loading' | translate }}</span>
        </div>
      </div>
    </div>
  `,
})
export class CopropertyListComponent {
  coproperties$: Observable<Coproperty[]>;
  
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);

  constructor(private copropertyService: CopropertyService, private router: Router) {
    this.coproperties$ = this.copropertyService.getCoproperties();
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
        this.coproperties$ = this.copropertyService.getCoproperties();
      } catch (error: any) {
        console.error('Delete error:', error);
        const errorMsg = error?.error?.errors?.[0]?.message || error?.message || 'Erreur lors de la suppression';
        this.toastService.show('Erreur: ' + errorMsg, { classname: 'bg-danger text-light' });
      }
    }
  }
}
