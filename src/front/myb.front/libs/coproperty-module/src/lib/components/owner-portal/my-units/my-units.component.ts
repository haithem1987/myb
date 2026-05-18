import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OwnerService, Unit, CopropertyService, Coproperty } from '../../../index';
import { KeycloakService } from '@myb-front/auth';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

interface UnitView {
  id: string;
  number: string;
  type: 'apartment' | 'parking' | 'cellar' | 'other';
  copropertyName: string;
  floor: number | null;
  surface: number | null;
  shares: number;
  ownershipStart: Date;
  description?: string;
}

@Component({
  selector: 'app-owner-my-units',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="mb-1">
            <i class="bi bi-building me-2"></i>
            Mes Lots
          </h2>
          <p class="text-muted">Consultez vos biens et vos charges</p>
        </div>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="text-muted mt-3">Chargement de vos lots...</p>
      </div>

      <!-- Error state -->
      <div *ngIf="!loading() && error()" class="alert alert-danger d-flex align-items-center gap-2">
        <i class="bi bi-exclamation-triangle-fill fs-5"></i>
        <div>
          <strong>Impossible de charger vos lots.</strong>
          <div class="small">{{ error() }}</div>
        </div>
        <button class="btn btn-sm btn-outline-danger ms-auto" (click)="reload()">
          <i class="bi bi-arrow-clockwise me-1"></i>Réessayer
        </button>
      </div>

      <ng-container *ngIf="!loading() && !error()">

        <!-- Statistics Cards -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-primary">
                <i class="bi bi-building"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats().totalUnits }}</div>
                <div class="stat-label">Lots détenus</div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-success">
                <i class="bi bi-rulers"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">
                  {{ stats().totalSurface > 0 ? stats().totalSurface + ' m²' : '—' }}
                </div>
                <div class="stat-label">Surface totale</div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-warning">
                <i class="bi bi-pie-chart"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats().totalShares }}</div>
                <div class="stat-label">Tantièmes totaux</div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-info">
                <i class="bi bi-buildings"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats().copropertiesCount }}</div>
                <div class="stat-label">Copropriété(s)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="units().length === 0" class="text-center py-5">
          <i class="bi bi-building display-1 text-muted"></i>
          <p class="text-muted mt-3 mb-1 fs-5">Aucun lot trouvé</p>
          <p class="text-muted small">Aucun lot n'est associé à votre compte.</p>
        </div>

        <!-- Units List -->
        <div class="row" *ngIf="units().length > 0">
          <div class="col-md-6 mb-4" *ngFor="let unit of units()">
            <div class="unit-card">
              <div class="unit-header"
                   [class.apartment]="unit.type === 'apartment'"
                   [class.parking]="unit.type === 'parking'"
                   [class.cellar]="unit.type === 'cellar'"
                   [class.other]="unit.type === 'other'">
                <div class="unit-type-badge">
                  <i class="bi"
                     [class.bi-house-door]="unit.type === 'apartment'"
                     [class.bi-p-square]="unit.type === 'parking'"
                     [class.bi-box]="unit.type === 'cellar'"
                     [class.bi-grid]="unit.type === 'other'"></i>
                  {{ getUnitTypeLabel(unit.type) }}
                </div>
                <h5 class="unit-number">Lot {{ unit.number }}</h5>
              </div>

              <div class="unit-body">
                <div class="info-row">
                  <i class="bi bi-building text-primary"></i>
                  <div>
                    <div class="info-label">Copropriété</div>
                    <div class="info-value">{{ unit.copropertyName }}</div>
                  </div>
                </div>

                <div class="info-row" *ngIf="unit.floor !== null">
                  <i class="bi bi-layers text-secondary"></i>
                  <div>
                    <div class="info-label">Étage</div>
                    <div class="info-value">
                      {{ unit.floor === 0 ? 'RDC' : unit.floor + (unit.floor === 1 ? 'er' : 'ème') + ' étage' }}
                    </div>
                  </div>
                </div>

                <div class="info-row" *ngIf="unit.surface !== null">
                  <i class="bi bi-rulers text-success"></i>
                  <div>
                    <div class="info-label">Surface</div>
                    <div class="info-value">{{ unit.surface }} m²</div>
                  </div>
                </div>

                <div class="info-row">
                  <i class="bi bi-pie-chart text-warning"></i>
                  <div>
                    <div class="info-label">Tantièmes</div>
                    <div class="info-value">{{ unit.shares }}</div>
                  </div>
                </div>

                <div class="info-row" *ngIf="unit.description">
                  <i class="bi bi-card-text text-muted"></i>
                  <div>
                    <div class="info-label">Description</div>
                    <div class="info-value">{{ unit.description }}</div>
                  </div>
                </div>

                <div class="ownership-info mt-3">
                  <i class="bi bi-calendar-check me-2"></i>
                  <small class="text-muted">
                    Propriétaire depuis le {{ unit.ownershipStart | date:'dd/MM/yyyy' }}
                  </small>
                </div>
              </div>


            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      height: 100%;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: #6c757d;
    }

    .unit-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .unit-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .unit-header {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .unit-header.apartment {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .unit-header.parking {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .unit-header.cellar {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .unit-header.other {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }

    .unit-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .unit-number {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }

    .unit-body {
      padding: 20px;
      flex: 1;
    }

    .info-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .info-row i {
      font-size: 20px;
      margin-top: 2px;
    }

    .info-label {
      font-size: 12px;
      color: #6c757d;
      margin-bottom: 2px;
    }

    .info-value {
      font-weight: 600;
      font-size: 14px;
    }

    .ownership-info {
      display: flex;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
    }

    @media (max-width: 992px) {
      .stat-card { padding: 16px; }
      .stat-icon { width: 44px; height: 44px; font-size: 20px; }
      .stat-value { font-size: 22px; }
    }

    @media (max-width: 576px) {
      .stat-card { padding: 14px; gap: 12px; }
      .stat-icon { width: 40px; height: 40px; font-size: 18px; }
      .stat-value { font-size: 20px; }
      .stat-label { font-size: 12px; }

      .unit-header { padding: 16px; }
      .unit-number { font-size: 20px; }
      .unit-type-badge { font-size: 11px; padding: 3px 10px; }

      .unit-body { padding: 16px; }
      .info-row { gap: 10px; margin-bottom: 12px; }
      .info-row i { font-size: 18px; }
      .info-value { font-size: 13px; }
    }
  `]
})
export class OwnerMyUnitsComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private copropertyService = inject(CopropertyService);
  private keycloakService = inject(KeycloakService);

  units = signal<UnitView[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  stats = computed(() => {
    const list = this.units();
    const totalSurface = list.reduce((sum, u) => sum + (u.surface ?? 0), 0);
    const copropertiesCount = new Set(list.map(u => u.copropertyName)).size;
    return {
      totalUnits: list.length,
      totalSurface,
      totalShares: list.reduce((sum, u) => sum + u.shares, 0),
      copropertiesCount,
    };
  });

  ngOnInit(): void {
    this.loadData();
  }

  reload(): void {
    this.error.set(null);
    this.loadData();
  }

  private getCurrentUserId(): string | null {
    const token = this.keycloakService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private loadData(): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.loading.set(false);
      this.error.set('Utilisateur non identifié. Veuillez vous reconnecter.');
      return;
    }

    this.loading.set(true);

    // Load units and coproperties in parallel
    forkJoin({
      units: this.ownerService.getMyUnits(userId).pipe(take(1), catchError(() => of([] as Unit[]))),
      coproperties: this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([] as Coproperty[]))),
    }).subscribe({
      next: ({ units, coproperties }) => {
        const copropertyMap = new Map<string, string>(
          coproperties.map((c) => [c.id, c.name])
        );
        this.units.set(units.map((u) => this.mapUnit(u, copropertyMap)));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading owner units:', err);
        this.error.set(err?.graphQLErrors?.[0]?.message || 'Erreur lors du chargement des lots.');
        this.loading.set(false);
      },
    });
  }

  private mapUnit(u: Unit, copropertyMap: Map<string, string>): UnitView {
    const typeLower = (u.unitType ?? '').toLowerCase();
    let type: UnitView['type'] = 'other';
    if (typeLower.includes('apartment') || typeLower.includes('appartement') || typeLower === 'apartment') {
      type = 'apartment';
    } else if (typeLower.includes('parking') || typeLower === 'garage') {
      type = 'parking';
    } else if (typeLower.includes('cave') || typeLower.includes('cellar') || typeLower === 'cave') {
      type = 'cellar';
    }

    return {
      id: u.id,
      number: u.unitNumber,
      type,
      copropertyName: copropertyMap.get(u.copropertyId) ?? `Copropriété (${u.copropertyId.substring(0, 8)}…)`,
      floor: u.floor ?? null,
      surface: u.area ?? null,
      shares: u.shares,
      ownershipStart: new Date(u.createdAt),
      description: u.description,
    };
  }

  getUnitTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      apartment: 'Appartement',
      parking: 'Parking',
      cellar: 'Cave',
      other: 'Autre',
    };
    return labels[type] || type;
  }

  viewChargeDetails(_unit: UnitView): void { /* removed */ }
  downloadDocuments(_unit: UnitView): void { /* removed */ }
}
