import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@myb-front/shared-ui';
import { CopropertyService, CurrencyService, Coproperty, Currency } from '@myb-front/coproperty-module';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-syndic-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col">
          <h2 class="mb-1">
            <i class="bi bi-gear me-2"></i>
            Paramètres Généraux
          </h2>
          <p class="text-muted">Configuration de la copropriété</p>
        </div>
      </div>

      <div class="row" *ngIf="!loading()">
        <!-- Currency Card -->
        <div class="col-md-6">
          <div class="settings-card">
            <div class="settings-card-header">
              <div class="settings-icon">
                <i class="bi bi-currency-exchange"></i>
              </div>
              <div>
                <h5 class="mb-0">Devise</h5>
                <small class="text-muted">Monnaie utilisée pour tous les montants</small>
              </div>
            </div>
            <div class="settings-card-body">
              <div class="mb-3">
                <label class="form-label fw-semibold">Copropriété</label>
                <select class="form-select" [(ngModel)]="selectedCopropertyId" (change)="onCopropertyChange()">
                  <option *ngFor="let c of coproperties()" [value]="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Devise</label>
                <select class="form-select" [(ngModel)]="selectedCurrency">
                  <option *ngFor="let c of currencies" [value]="c.code">
                    {{ c.symbol }} - {{ c.label }}
                  </option>
                </select>
              </div>
              <div class="currency-preview" *ngIf="selectedCurrency">
                <span class="preview-label">Aperçu :</span>
                <span class="preview-value">{{ previewAmount() }}</span>
              </div>
              <button class="btn btn-primary mt-3" (click)="saveCurrency()" [disabled]="saving()">
                <span *ngIf="saving()" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!saving()" class="bi bi-check-lg me-1"></i>
                {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Info Card -->
        <div class="col-md-6">
          <div class="settings-card">
            <div class="settings-card-header">
              <div class="settings-icon bg-info-subtle text-info">
                <i class="bi bi-info-circle"></i>
              </div>
              <div>
                <h5 class="mb-0">À propos de la devise</h5>
                <small class="text-muted">Impact du changement de devise</small>
              </div>
            </div>
            <div class="settings-card-body">
              <ul class="info-list">
                <li>
                  <i class="bi bi-check-circle text-success me-2"></i>
                  Tous les montants affichés utiliseront la nouvelle devise
                </li>
                <li>
                  <i class="bi bi-check-circle text-success me-2"></i>
                  Les factures et reçus seront générés avec le bon symbole
                </li>
                <li>
                  <i class="bi bi-check-circle text-success me-2"></i>
                  Les appels de fonds et charges seront mis à jour
                </li>
                <li>
                  <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                  Les montants existants ne sont pas convertis automatiquement
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2">Chargement des paramètres...</p>
      </div>
    </div>
  `,
  styles: [`
    .settings-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .settings-card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;
      background: #fafbfc;
    }

    .settings-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #e8f0fe;
      color: #1a73e8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .settings-card-body {
      padding: 1.5rem;
    }

    .currency-preview {
      padding: 0.75rem 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px dashed #dee2e6;
    }

    .preview-label {
      font-size: 0.85rem;
      color: #6c757d;
      margin-right: 0.5rem;
    }

    .preview-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e3a8a;
    }

    .info-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .info-list li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 0.9rem;
    }

    .info-list li:last-child {
      border-bottom: none;
    }

    @media (max-width: 576px) {
      .settings-card-header {
        padding: 1rem;
        gap: 0.75rem;
      }
      .settings-icon { width: 38px; height: 38px; font-size: 1.1rem; }
      .settings-card-body { padding: 1rem; }
      .info-list li { font-size: 0.85rem; padding: 0.4rem 0; }
    }
  `]
})
export class SyndicSettingsComponent implements OnInit {
  private copropertyService = inject(CopropertyService);
  private currencyService = inject(CurrencyService);
  private toastService = inject(ToastService);

  coproperties = signal<Coproperty[]>([]);
  loading = signal(true);
  saving = signal(false);

  selectedCopropertyId = '';
  selectedCurrency = 'EUR';

  currencies = [
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'USD', symbol: '$', label: 'Dollar US' },
    { code: 'TND', symbol: 'DT', label: 'Dinar Tunisien' },
    { code: 'GBP', symbol: '£', label: 'Livre Sterling' },
    { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse' },
    { code: 'CAD', symbol: 'CA$', label: 'Dollar Canadien' },
    { code: 'AED', symbol: 'AED', label: 'Dirham EAU' },
    { code: 'MAD', symbol: 'MAD', label: 'Dirham Marocain' },
  ];

  ngOnInit(): void {
    this.copropertyService.getCoproperties().pipe(take(1)).subscribe({
      next: (coproperties) => {
        this.coproperties.set(coproperties);
        if (coproperties.length > 0) {
          this.selectedCopropertyId = coproperties[0].id;
          this.selectedCurrency = coproperties[0].currency ?? 'EUR';
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onCopropertyChange(): void {
    const cop = this.coproperties().find(c => c.id === this.selectedCopropertyId);
    if (cop) {
      this.selectedCurrency = cop.currency ?? 'EUR';
    }
  }

  previewAmount(): string {
    const locale = this.selectedCurrency === 'TND' ? 'fr-TN' : 'fr-FR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.selectedCurrency,
    }).format(1234.56);
  }

  saveCurrency(): void {
    const cop = this.coproperties().find(c => c.id === this.selectedCopropertyId);
    if (!cop) return;

    this.saving.set(true);

    const input = {
      id: cop.id,
      name: cop.name,
      address: cop.address,
      city: cop.city,
      postalCode: cop.postalCode,
      country: cop.country,
      currency: this.selectedCurrency as Currency,
      description: cop.description,
      totalUnits: cop.totalUnits,
      totalShares: cop.totalShares,
      commonAreas: cop.commonAreas,
      managerId: cop.managerId,
      isActive: cop.isActive,
    };

    this.copropertyService.updateCoproperty(cop.id, input).pipe(take(1)).subscribe({
      next: () => {
        this.currencyService.setCurrency(this.selectedCurrency as Currency);
        // Update local state
        const updated = this.coproperties().map(c =>
          c.id === cop.id ? { ...c, currency: this.selectedCurrency as Currency } : c
        );
        this.coproperties.set(updated);
        this.saving.set(false);
        this.toastService.show('Devise mise à jour avec succès', { classname: 'toast-success' });
      },
      error: (err: unknown) => {
        console.error('Error saving currency:', err);
        this.saving.set(false);
        this.toastService.show('Erreur lors de la mise à jour', { classname: 'toast-danger' });
      }
    });
  }
}
