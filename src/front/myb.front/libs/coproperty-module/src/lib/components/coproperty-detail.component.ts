import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CopropertyService } from '../services/coproperty.service';
import { Coproperty } from '../models/coproperty.models';
import { UnitManagementComponent } from './unit-management/unit-management.component';
import { ChargeManagementComponent } from './charge-management/charge-management.component';
import { MaintenanceRequestsComponent } from './maintenance-requests/maintenance-requests.component';
import { InterventionManagementComponent } from './intervention-management/intervention-management.component';

@Component({
  selector: 'myb-coproperty-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    UnitManagementComponent,
    ChargeManagementComponent,
    MaintenanceRequestsComponent,
    InterventionManagementComponent
  ],
  template: `
    <div class="container-fluid mt-4">
      <div class="row mb-4">
        <div class="col-md-8">
          <h1 *ngIf="coproperty">{{ coproperty.name }}</h1>
          <p *ngIf="coproperty" class="text-muted">{{ coproperty.address }}</p>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-secondary me-2" (click)="goBack()">
            {{ 'common.back' | translate }}
          </button>
          <button class="btn btn-primary" (click)="edit()">
            {{ 'common.edit' | translate }}
          </button>
        </div>
      </div>

      <div *ngIf="coproperty" class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">{{ 'coproperty.detail.generalInfo' | translate }}</h5>
              <p>
                <strong>{{ 'coproperty.detail.address' | translate }}:</strong>
                {{ coproperty.address }}
              </p>
              <p>
                <strong>{{ 'coproperty.detail.city' | translate }}:</strong>
                {{ coproperty.city }}
              </p>
              <p>
                <strong>{{ 'coproperty.detail.postalCode' | translate }}:</strong>
                {{ coproperty.postalCode }}
              </p>
              <p>
                <strong>{{ 'coproperty.detail.country' | translate }}:</strong>
                {{ coproperty.country }}
              </p>
              <p *ngIf="coproperty.description">
                <strong>{{ 'coproperty.detail.description' | translate }}:</strong>
                {{ coproperty.description }}
              </p>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">{{ 'coproperty.detail.statistics' | translate }}</h5>
              <p>
                <strong>{{ 'coproperty.detail.totalUnits' | translate }}:</strong>
                {{ coproperty.totalUnits }}
              </p>
              <p>
                <strong>{{ 'coproperty.detail.totalShares' | translate }}:</strong>
                {{ coproperty.totalShares }}
              </p>
              <p>
                <strong>{{ 'coproperty.detail.isActive' | translate }}:</strong>
                <span
                  class="badge"
                  [ngClass]="coproperty.isActive ? 'bg-success' : 'bg-danger'"
                >
                  {{ (coproperty.isActive ? 'coproperty.list.active' : 'coproperty.list.inactive') | translate }}
                </span>
              </p>
              <p>
                <strong>{{ 'common.createdAt' | translate }}:</strong>
                {{ coproperty.createdAt | date : 'short' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="row mt-4">
        <div class="col-md-12">
          <ul class="nav nav-tabs">
            <li class="nav-item">
              <a class="nav-link active" href="#units" data-bs-toggle="tab">
                {{ 'coproperty.units.title' | translate }}
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#charges" data-bs-toggle="tab">
                {{ 'coproperty.charges.title' | translate }}
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#maintenance" data-bs-toggle="tab">
                {{ 'coproperty.maintenance.title' | translate }}
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#interventions" data-bs-toggle="tab">
                {{ 'intervention.list.title' | translate }}
              </a>
            </li>
          </ul>
          <div class="tab-content mt-3">
            <div id="units" class="tab-pane fade show active">
              <myb-unit-management
                [copropertyId]="coproperty?.id || null"
                [copropertyName]="coproperty?.name || ''"
                [copropertyTotalShares]="coproperty?.totalShares ?? null">
              </myb-unit-management>
            </div>
            <div id="charges" class="tab-pane fade">
              <myb-charge-management [copropertyId]="coproperty?.id || null"></myb-charge-management>
            </div>
            <div id="maintenance" class="tab-pane fade">
              <myb-maintenance-requests [copropertyId]="coproperty?.id || null"></myb-maintenance-requests>
            </div>
            <div id="interventions" class="tab-pane fade">
              <myb-intervention-management [copropertyId]="coproperty?.id || null"></myb-intervention-management>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @media (max-width: 992px) {
      .col-md-6 { flex: 0 0 100%; max-width: 100%; margin-bottom: 1rem; }
      .col-md-4 { margin-top: 0.75rem; }
    }

    @media (max-width: 576px) {
      .container-fluid { padding: 0.75rem; }
      h1 { font-size: 1.4rem; }
      .col-md-4.text-end { text-align: start !important; }
      .col-md-4 .btn { width: 100%; margin-bottom: 0.5rem; }
      .nav-tabs .nav-link { padding: 0.5rem 0.75rem; font-size: 0.85rem; }
    }
  `],
})
export class CopropertyDetailComponent implements OnInit {
  coproperty: Coproperty | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private copropertyService: CopropertyService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (id && uuidRegex.test(id)) {
      this.loadCoproperty(id);
    }
  }

  loadCoproperty(id: string): void {
    this.copropertyService.getCoproperty(id).subscribe({
      next: (coproperty: Coproperty) => {
        this.coproperty = coproperty;
      },
      error: (error) => {
        console.error('Error loading coproperty:', error);
      },
    });
  }

  edit(): void {
    if (this.coproperty) {
      this.router.navigate(['/coproperty/syndic/coproperties', this.coproperty.id, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/coproperty/syndic/coproperties']);
  }
}
