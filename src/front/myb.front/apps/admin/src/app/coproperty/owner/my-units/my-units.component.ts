import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, FileDownloadService, ToastService } from '@myb-front/shared-ui';
import { RouterLink } from '@angular/router';

interface Unit {
  id: string;
  number: string;
  type: 'apartment' | 'parking' | 'cellar';
  copropertyName: string;
  building: string;
  floor: number;
  surface: number;
  tantiemes: number;
  totalTantiemes: number;
  quarterlyCharges: number;
  annualCharges: number;
  ownershipStart: Date;
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
              <div class="stat-value">{{ stats().totalSurface }} m²</div>
              <div class="stat-label">Surface totale</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-warning">
              <i class="bi bi-cash-coin"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().quarterlyCharges }} €</div>
              <div class="stat-label">Charges trimestrielles</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-info">
              <i class="bi bi-calendar-year"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().annualCharges }} €</div>
              <div class="stat-label">Charges annuelles</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Units List -->
      <div class="row">
        <div class="col-md-6 mb-4" *ngFor="let unit of units()">
          <div class="unit-card">
            <div class="unit-header" [class.apartment]="unit.type === 'apartment'"
                 [class.parking]="unit.type === 'parking'"
                 [class.cellar]="unit.type === 'cellar'">
              <div class="unit-type-badge">
                <i class="bi" [class.bi-house-door]="unit.type === 'apartment'"
                   [class.bi-p-square]="unit.type === 'parking'"
                   [class.bi-box]="unit.type === 'cellar'"></i>
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

              <div class="info-row" *ngIf="unit.type === 'apartment'">
                <i class="bi bi-geo-alt text-danger"></i>
                <div>
                  <div class="info-label">Localisation</div>
                  <div class="info-value">Bât. {{ unit.building }}, {{ unit.floor }}{{ unit.floor === 1 ? 'er' : 'ème' }} étage</div>
                </div>
              </div>

              <div class="info-row" *ngIf="unit.type === 'apartment'">
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
                  <div class="info-value">{{ unit.tantiemes }}/{{ unit.totalTantiemes }} ({{ getTantiemesPercent(unit) }}%)</div>
                </div>
              </div>

              <div class="charges-summary">
                <div class="charge-item">
                  <span class="charge-label">Charges trimestrielles</span>
                  <span class="charge-amount">{{ unit.quarterlyCharges }} €</span>
                </div>
                <div class="charge-item annual">
                  <span class="charge-label">Charges annuelles</span>
                  <span class="charge-amount">{{ unit.annualCharges }} €</span>
                </div>
              </div>

              <div class="ownership-info">
                <i class="bi bi-calendar-check me-2"></i>
                <small class="text-muted">
                  Propriétaire depuis le {{ unit.ownershipStart | date:'dd/MM/yyyy' }}
                </small>
              </div>
            </div>

            <div class="unit-footer">
              <button class="btn btn-sm btn-outline-primary" (click)="viewChargeDetails(unit.id)">
                <i class="bi bi-eye me-1"></i>
                Détails charges
              </button>
              <button class="btn btn-sm btn-outline-secondary" (click)="downloadDocuments(unit.id)">
                <i class="bi bi-download me-1"></i>
                Documents
              </button>
            </div>
          </div>
        </div>
      </div>
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

    .charges-summary {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }

    .charge-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #dee2e6;
    }

    .charge-item:last-child {
      border-bottom: none;
    }

    .charge-item.annual {
      font-weight: 600;
    }

    .charge-label {
      color: #495057;
      font-size: 14px;
    }

    .charge-amount {
      font-weight: 600;
      color: #212529;
      font-size: 16px;
    }

    .ownership-info {
      display: flex;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
    }

    .unit-footer {
      padding: 16px 20px;
      background: #f8f9fa;
      display: flex;
      gap: 8px;
      border-top: 1px solid #e9ecef;
    }

    .unit-footer button {
      flex: 1;
    }
  `]
})
export class OwnerMyUnitsComponent {
  units = signal<Unit[]>([
    {
      id: '1',
      number: 'A101',
      type: 'apartment',
      copropertyName: 'Résidence Les Jardins du Parc',
      building: 'A',
      floor: 1,
      surface: 75,
      tantiemes: 100,
      totalTantiemes: 2400,
      quarterlyCharges: 862.50,
      annualCharges: 3450,
      ownershipStart: new Date('2020-03-15')
    },
    {
      id: '2',
      number: 'P12',
      type: 'parking',
      copropertyName: 'Résidence Les Jardins du Parc',
      building: 'Sous-sol',
      floor: -1,
      surface: 12,
      tantiemes: 15,
      totalTantiemes: 2400,
      quarterlyCharges: 75,
      annualCharges: 300,
      ownershipStart: new Date('2020-03-15')
    }
  ]);

  stats = computed(() => ({
    totalUnits: this.units().length,
    totalSurface: this.units().reduce((sum, u) => sum + u.surface, 0),
    quarterlyCharges: this.units().reduce((sum, u) => sum + u.quarterlyCharges, 0),
    annualCharges: this.units().reduce((sum, u) => sum + u.annualCharges, 0)
  }));

  getUnitTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      apartment: 'Appartement',
      parking: 'Parking',
      cellar: 'Cave'
    };
    return labels[type] || type;
  }

  getTantiemesPercent(unit: Unit): string {
    return ((unit.tantiemes / unit.totalTantiemes) * 100).toFixed(2);
  }

  private modalService = inject(ModalService);
  private fileService = inject(FileDownloadService);
  private toastService = inject(ToastService);

  viewChargeDetails(id: string): void {
    const unit = this.units().find(u => u.id === id);
    if (!unit) return;

    this.modalService.open({
      title: `Détails des charges - ${unit.number}`,
      message: `
        <div style="text-align: left; padding: 10px;">
          <h5>${unit.type === 'apartment' ? 'Appartement' : unit.type === 'parking' ? 'Parking' : 'Cave'} ${unit.number}</h5>
          <p><strong>Charges trimestrielles:</strong> ${unit.quarterlyCharges.toFixed(2)}€</p>
          <p><strong>Charges annuelles:</strong> ${(unit.quarterlyCharges * 4).toFixed(2)}€</p>
          <p><strong>Tantièmes:</strong> ${unit.tantiemes}</p>
          <p><strong>Pourcentage:</strong> ${((unit.tantiemes / 10000) * 100).toFixed(2)}%</p>
          <hr/>
          <p><strong>Décomposition:</strong></p>
          <ul>
            <li>Charges courantes: ${(unit.quarterlyCharges * 0.6).toFixed(2)}€</li>
            <li>Entretien: ${(unit.quarterlyCharges * 0.3).toFixed(2)}€</li>
            <li>Travaux: ${(unit.quarterlyCharges * 0.1).toFixed(2)}€</li>
          </ul>
        </div>
      `,
      size: 'md',
      showCancelButton: false,
      confirmButtonText: 'Fermer'
    });
  }

  downloadDocuments(id: string): void {
    const unit = this.units().find(u => u.id === id);
    if (!unit) return;

    this.fileService.downloadPDF(
      `Documents_${unit.number}.pdf`,
      `Documents lot ${unit.number}`
    );
    
    this.toastService.show(
      `Documents du lot ${unit.number}`,
      { classname: 'toast-success' }
    );
  }
}
