import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@myb-front/shared-ui';
import { CopropertyService, CurrencyService, Coproperty, Currency, ManagerUser } from '@myb-front/coproperty-module';
import { KeycloakService } from '@myb-front/auth';
import { take } from 'rxjs/operators';

type ActiveTab = 'currency' | 'syndics';

interface KeycloakSearchUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  roles: string[];
}

const SYNDIC_ROLE = 'coproperty-syndic';

@Component({
  selector: 'myb-coproperty-syndic-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Page Header -->
      <div class="row mb-4">
        <div class="col">
          <h2 class="mb-1">
            <i class="bi bi-gear me-2"></i>
            Paramètres
          </h2>
          <p class="text-muted">Configuration et gestion des accès</p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="settings-tabs mb-4">
        <button class="settings-tab"
                [class.active]="activeTab() === 'currency'"
                (click)="setTab('currency')">
          <i class="bi bi-currency-exchange me-2"></i>Devise
        </button>
        <button class="settings-tab"
                [class.active]="activeTab() === 'syndics'"
                (click)="setTab('syndics')">
          <i class="bi bi-shield-person me-2"></i>Gestion des Syndics
          <span class="tab-badge" *ngIf="currentSyndics().length > 0">
            {{ currentSyndics().length }}
          </span>
        </button>
      </div>

      <!-- Loading Overlay -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="text-muted mt-2">Chargement des paramètres...</p>
      </div>

      <!-- ─── TAB: Currency ───────────────────────────────────────────────── -->
      <div *ngIf="!loading() && activeTab() === 'currency'" class="row">
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

      <!-- ─── TAB: Syndic Role Management ───────────────────────────────── -->
      <div *ngIf="!loading() && activeTab() === 'syndics'" class="row">

        <!-- Current Syndics Table -->
        <div class="col-12 mb-4">
          <div class="settings-card">
            <div class="settings-card-header">
              <div class="settings-icon bg-primary-subtle text-primary">
                <i class="bi bi-shield-person"></i>
              </div>
              <div class="flex-grow-1">
                <h5 class="mb-0">Syndics actifs</h5>
                <small class="text-muted">Utilisateurs ayant le rôle <code>coproperty-syndic</code></small>
              </div>
              <button class="btn btn-sm btn-outline-secondary"
                      (click)="loadCurrentSyndics()"
                      [disabled]="loadingSyndics()"
                      title="Actualiser">
                <i class="bi" [class.bi-arrow-clockwise]="!loadingSyndics()"
                   [class.bi-hourglass-split]="loadingSyndics()"></i>
              </button>
            </div>
            <div class="settings-card-body p-0">

              <!-- Loading syndics -->
              <div *ngIf="loadingSyndics()" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span class="text-muted">Chargement des syndics...</span>
              </div>

              <!-- Empty state -->
              <div *ngIf="!loadingSyndics() && currentSyndics().length === 0"
                   class="empty-state py-4">
                <i class="bi bi-person-slash text-muted"></i>
                <p class="text-muted mt-2 mb-0">Aucun syndic actif trouvé</p>
              </div>

              <!-- Syndics list -->
              <div *ngIf="!loadingSyndics() && currentSyndics().length > 0">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th scope="col">Utilisateur</th>
                      <th scope="col">Email</th>
                      <th scope="col" class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let syndic of currentSyndics()">
                      <td>
                        <div class="user-cell">
                          <div class="user-avatar-sm">
                            {{ syndic.fullName.charAt(0).toUpperCase() }}
                          </div>
                          <span class="fw-semibold">{{ syndic.fullName }}</span>
                        </div>
                      </td>
                      <td class="text-muted align-middle">{{ syndic.email }}</td>
                      <td class="text-end align-middle">
                        <button class="btn btn-sm btn-outline-danger"
                                (click)="revokeRole(syndic)"
                                [disabled]="isProcessing(syndic.id)">
                          <span *ngIf="isProcessing(syndic.id)"
                                class="spinner-border spinner-border-sm me-1"></span>
                          <i *ngIf="!isProcessing(syndic.id)" class="bi bi-shield-x me-1"></i>
                          Révoquer
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Syndic Card -->
        <div class="col-12">
          <div class="settings-card">
            <div class="settings-card-header">
              <div class="settings-icon bg-success-subtle text-success">
                <i class="bi bi-person-plus"></i>
              </div>
              <div>
                <h5 class="mb-0">Attribuer le rôle Syndic</h5>
                <small class="text-muted">Rechercher un utilisateur Keycloak et lui attribuer le rôle syndic</small>
              </div>
            </div>
            <div class="settings-card-body">

              <!-- Search Form -->
              <div class="search-form mb-4">
                <label class="form-label fw-semibold">Rechercher par email</label>
                <div class="input-group">
                  <span class="input-group-text bg-white">
                    <i class="bi bi-search text-muted"></i>
                  </span>
                  <input type="email"
                         class="form-control"
                         placeholder="ex: utilisateur@example.com"
                         [(ngModel)]="searchEmail"
                         (keyup.enter)="searchUsers()"
                         [disabled]="searching()">
                  <button class="btn btn-primary"
                          (click)="searchUsers()"
                          [disabled]="searching() || !searchEmail.trim()">
                    <span *ngIf="searching()" class="spinner-border spinner-border-sm me-1"></span>
                    <i *ngIf="!searching()" class="bi bi-search me-1"></i>
                    {{ searching() ? 'Recherche...' : 'Rechercher' }}
                  </button>
                </div>
                <div class="form-text">
                  <i class="bi bi-info-circle me-1"></i>
                  La recherche supporte les correspondances partielles (ex : "dupont")
                </div>
              </div>

              <!-- Search Results -->
              <div *ngIf="searchPerformed()">

                <!-- No results -->
                <div *ngIf="searchResults().length === 0" class="alert alert-info d-flex align-items-center gap-2">
                  <i class="bi bi-info-circle-fill"></i>
                  <span>Aucun utilisateur trouvé pour "<strong>{{ searchEmail }}</strong>"</span>
                </div>

                <!-- Results table -->
                <div *ngIf="searchResults().length > 0">
                  <p class="text-muted small mb-2">
                    <i class="bi bi-check2-circle me-1 text-success"></i>
                    {{ searchResults().length }} utilisateur(s) trouvé(s)
                  </p>
                  <table class="table table-hover table-bordered">
                    <thead class="table-light">
                      <tr>
                        <th scope="col">Utilisateur</th>
                        <th scope="col">Email</th>
                        <th scope="col">Statut</th>
                        <th scope="col">Rôle Syndic</th>
                        <th scope="col" class="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let user of searchResults()">
                        <td>
                          <div class="user-cell">
                            <div class="user-avatar-sm" [class.bg-secondary]="!user.enabled">
                              {{ (user.firstName || user.email).charAt(0).toUpperCase() }}
                            </div>
                            <div>
                              <div class="fw-semibold">
                                {{ user.firstName }} {{ user.lastName }}
                              </div>
                              <div *ngIf="!user.emailVerified"
                                   class="badge bg-warning-subtle text-warning small">
                                <i class="bi bi-exclamation-triangle me-1"></i>Email non vérifié
                              </div>
                            </div>
                          </div>
                        </td>
                        <td class="align-middle text-muted small">{{ user.email }}</td>
                        <td class="align-middle">
                          <span class="badge"
                                [class.bg-success]="user.enabled"
                                [class.bg-secondary]="!user.enabled">
                            {{ user.enabled ? 'Actif' : 'Inactif' }}
                          </span>
                        </td>
                        <td class="align-middle">
                          <span *ngIf="hasSyndicRole(user)"
                                class="badge bg-primary-subtle text-primary">
                            <i class="bi bi-shield-check me-1"></i>Syndic
                          </span>
                          <span *ngIf="!hasSyndicRole(user)" class="text-muted small">—</span>
                        </td>
                        <td class="text-center align-middle">
                          <!-- Grant role -->
                          <button *ngIf="!hasSyndicRole(user)"
                                  class="btn btn-sm btn-success"
                                  (click)="grantRole(user)"
                                  [disabled]="isProcessing(user.id) || !user.enabled">
                            <span *ngIf="isProcessing(user.id)"
                                  class="spinner-border spinner-border-sm me-1"></span>
                            <i *ngIf="!isProcessing(user.id)" class="bi bi-shield-plus me-1"></i>
                            Attribuer
                          </button>
                          <!-- Revoke role from search result -->
                          <button *ngIf="hasSyndicRole(user)"
                                  class="btn btn-sm btn-outline-danger"
                                  (click)="revokeRoleFromSearch(user)"
                                  [disabled]="isProcessing(user.id)">
                            <span *ngIf="isProcessing(user.id)"
                                  class="spinner-border spinner-border-sm me-1"></span>
                            <i *ngIf="!isProcessing(user.id)" class="bi bi-shield-x me-1"></i>
                            Révoquer
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Tab navigation ───────────────────────────────────────────────── */
    .settings-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 0;
    }

    .settings-tab {
      position: relative;
      padding: 0.625rem 1.25rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      border-radius: 6px 6px 0 0;
      cursor: pointer;
      color: #6c757d;
      font-weight: 500;
      font-size: 0.9rem;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .settings-tab:hover {
      color: #0d6efd;
      background: #f0f4ff;
    }

    .settings-tab.active {
      color: #0d6efd;
      border-bottom-color: #0d6efd;
      background: #f0f4ff;
    }

    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      background: #0d6efd;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      margin-left: 4px;
    }

    /* ── Settings card ────────────────────────────────────────────────── */
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

    /* ── Currency tab ─────────────────────────────────────────────────── */
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

    .info-list li:last-child { border-bottom: none; }

    /* ── Syndic tab ───────────────────────────────────────────────────── */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar-sm {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #0d6efd;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 2rem;
    }

    .search-form .input-group {
      max-width: 540px;
    }

    /* ── Responsive ───────────────────────────────────────────────────── */
    @media (max-width: 576px) {
      .settings-card-header { padding: 1rem; gap: 0.75rem; }
      .settings-icon { width: 38px; height: 38px; font-size: 1.1rem; }
      .settings-card-body { padding: 1rem; }
      .settings-tabs { gap: 0.25rem; }
      .settings-tab { padding: 0.5rem 0.875rem; font-size: 0.8rem; }
    }
  `]
})
export class SyndicSettingsComponent implements OnInit {
  private copropertyService = inject(CopropertyService);
  private currencyService = inject(CurrencyService);
  private toastService = inject(ToastService);
  private keycloakService = inject(KeycloakService);

  // ── State signals ──────────────────────────────────────────────────────────
  activeTab = signal<ActiveTab>('currency');
  loading = signal(true);
  saving = signal(false);

  // Currency tab
  coproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = '';
  selectedCurrency = 'EUR';

  // Syndic tab
  currentSyndics = signal<ManagerUser[]>([]);
  loadingSyndics = signal(false);
  searchEmail = '';
  searching = signal(false);
  searchResults = signal<KeycloakSearchUser[]>([]);
  searchPerformed = signal(false);
  /** Set of user IDs currently being processed (assign / revoke in flight) */
  private processingIds = signal<Set<string>>(new Set());

  readonly currencies = [
    { code: 'EUR', symbol: '€',   label: 'Euro' },
    { code: 'USD', symbol: '$',   label: 'Dollar US' },
    { code: 'TND', symbol: 'DT',  label: 'Dinar Tunisien' },
    { code: 'GBP', symbol: '£',   label: 'Livre Sterling' },
    { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse' },
    { code: 'CAD', symbol: 'CA$', label: 'Dollar Canadien' },
    { code: 'AED', symbol: 'AED', label: 'Dirham EAU' },
    { code: 'MAD', symbol: 'MAD', label: 'Dirham Marocain' },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId).pipe(take(1)).subscribe({
      next: (coproperties) => {
        this.coproperties.set(coproperties);
        if (coproperties.length > 0) {
          this.selectedCopropertyId = coproperties[0].id;
          this.selectedCurrency = coproperties[0].currency ?? 'EUR';
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Pre-fetch current syndics so the badge on the tab is populated
    this.loadCurrentSyndics();
  }

  // ── Tab helpers ────────────────────────────────────────────────────────────
  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'syndics') {
      this.loadCurrentSyndics();
    }
  }

  // ── Currency tab methods ───────────────────────────────────────────────────
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
      },
    });
  }

  // ── Syndic tab methods ─────────────────────────────────────────────────────

  /** Reload the list of users who currently hold the coproperty-syndic role. */
  loadCurrentSyndics(): void {
    this.loadingSyndics.set(true);
    this.copropertyService.reloadManagers().pipe(take(1)).subscribe({
      next: (syndics) => {
        this.currentSyndics.set(syndics);
        this.loadingSyndics.set(false);
      },
      error: (err: unknown) => {
        console.error('Error loading syndics:', err);
        this.loadingSyndics.set(false);
        this.toastService.show('Impossible de charger la liste des syndics', { classname: 'toast-danger' });
      },
    });
  }

  /** Search Keycloak users by partial email via the backend GraphQL service. */
  async searchUsers(): Promise<void> {
    const email = this.searchEmail.trim();
    if (!email) return;

    this.searching.set(true);
    this.searchResults.set([]);
    this.searchPerformed.set(false);

    try {
      const users = await this.keycloakService.searchKeycloakUsers(email);
      this.searchResults.set(users as KeycloakSearchUser[]);
      this.searchPerformed.set(true);
    } catch (err) {
      console.error('Error searching users:', err);
      this.toastService.show("Erreur lors de la recherche d'utilisateurs", { classname: 'toast-danger' });
    } finally {
      this.searching.set(false);
    }
  }

  /** Returns true if the given search result user already has the syndic role. */
  hasSyndicRole(user: KeycloakSearchUser): boolean {
    return user.roles?.includes(SYNDIC_ROLE) ?? false;
  }

  /** Returns true while an assign/revoke operation is in flight for this user. */
  isProcessing(userId: string): boolean {
    return this.processingIds().has(userId);
  }

  /** Grant the coproperty-syndic role to a user found in search results. */
  async grantRole(user: KeycloakSearchUser): Promise<void> {
    this.addProcessing(user.id);
    try {
      await this.keycloakService.assignRoleToUser(user.id, SYNDIC_ROLE);
      // Optimistically update search results
      this.searchResults.update(results =>
        results.map(u => u.id === user.id
          ? { ...u, roles: [...(u.roles ?? []), SYNDIC_ROLE] }
          : u
        )
      );
      this.toastService.show(
        `Rôle syndic attribué à ${user.firstName} ${user.lastName}`,
        { classname: 'toast-success' }
      );
      // Refresh the syndics list
      this.loadCurrentSyndics();
    } catch (err) {
      console.error('Error granting syndic role:', err);
      this.toastService.show("Erreur lors de l'attribution du rôle", { classname: 'toast-danger' });
    } finally {
      this.removeProcessing(user.id);
    }
  }

  /** Revoke the coproperty-syndic role from a user in the current syndics table. */
  async revokeRole(syndic: ManagerUser): Promise<void> {
    this.addProcessing(syndic.id);
    try {
      await this.keycloakService.unassignRoleFromUser(syndic.id, SYNDIC_ROLE);
      this.currentSyndics.update(list => list.filter(s => s.id !== syndic.id));
      // If the user appears in search results, update their roles there too
      this.searchResults.update(results =>
        results.map(u => u.id === syndic.id
          ? { ...u, roles: (u.roles ?? []).filter(r => r !== SYNDIC_ROLE) }
          : u
        )
      );
      this.toastService.show(
        `Rôle syndic révoqué pour ${syndic.fullName}`,
        { classname: 'toast-success' }
      );
    } catch (err) {
      console.error('Error revoking syndic role:', err);
      this.toastService.show("Erreur lors de la révocation du rôle", { classname: 'toast-danger' });
    } finally {
      this.removeProcessing(syndic.id);
    }
  }

  /** Revoke the syndic role directly from a search result row. */
  async revokeRoleFromSearch(user: KeycloakSearchUser): Promise<void> {
    this.addProcessing(user.id);
    try {
      await this.keycloakService.unassignRoleFromUser(user.id, SYNDIC_ROLE);
      this.searchResults.update(results =>
        results.map(u => u.id === user.id
          ? { ...u, roles: (u.roles ?? []).filter(r => r !== SYNDIC_ROLE) }
          : u
        )
      );
      this.toastService.show(
        `Rôle syndic révoqué pour ${user.firstName} ${user.lastName}`,
        { classname: 'toast-success' }
      );
      this.loadCurrentSyndics();
    } catch (err) {
      console.error('Error revoking syndic role from search result:', err);
      this.toastService.show("Erreur lors de la révocation du rôle", { classname: 'toast-danger' });
    } finally {
      this.removeProcessing(user.id);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  private addProcessing(userId: string): void {
    this.processingIds.update(s => new Set([...s, userId]));
  }

  private removeProcessing(userId: string): void {
    this.processingIds.update(s => {
      const next = new Set(s);
      next.delete(userId);
      return next;
    });
  }
}
