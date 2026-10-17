import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CommunicationService,
  CampaignDto,
  CreateCampaignDto,
} from 'libs/shared/infra/services/communication.service';
import { ActiveCopropertyService, OwnerService, OwnerWithUnits, TenantService, Tenant } from '@myb-front/coproperty-module';

type RecipientTab = 'owners' | 'tenants';

@Component({
  selector: 'app-communication-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="communication-campaigns">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div></div>
        <button class="btn btn-primary btn-sm" (click)="showForm.set(true)" *ngIf="!showForm()">
          <i class="bi bi-plus-lg me-1"></i>Nouvelle campagne
        </button>
      </div>

      <!-- New campaign form -->
      <div class="settings-card mb-4" *ngIf="showForm()">
        <div class="settings-card-header">
          <div class="settings-icon"><i class="bi bi-send"></i></div>
          <div class="flex-grow-1 fw-semibold">Nouvelle campagne</div>
          <button type="button" class="btn-close" (click)="cancelForm()"></button>
        </div>
        <div class="settings-card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Nom <span class="text-danger">*</span></label>
              <input class="form-control" [(ngModel)]="draft.name" placeholder="Nom de la campagne">
            </div>
            <div class="col-md-6">
              <label class="form-label">Copropriété</label>
              <input class="form-control" [value]="activeCopropertyName()" disabled>
            </div>
            <div class="col-12">
              <label class="form-label">Canaux <span class="text-danger">*</span></label>
              <div class="d-flex gap-3 flex-wrap">
                <div class="form-check" *ngFor="let ch of availableChannels">
                  <input class="form-check-input" type="checkbox"
                         [id]="'ch-' + ch"
                         [checked]="draft.channels.includes(ch)"
                         (change)="toggleChannel(ch)">
                  <label class="form-check-label" [for]="'ch-' + ch">
                    <i class="bi me-1" [ngClass]="channelIcon(ch)"></i>{{ ch }}
                  </label>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Sujet (Email)</label>
              <input class="form-control" [(ngModel)]="draft.subject" placeholder="Sujet de l'email">
            </div>
            <div class="col-12">
              <label class="form-label">Message <span class="text-danger">*</span></label>
              <textarea class="form-control" rows="3" [(ngModel)]="draft.message" placeholder="Contenu du message"></textarea>
            </div>

            <!-- Recipients -->
            <div class="col-12">
              <label class="form-label">Destinataires <span class="text-danger">*</span></label>

              <!-- Tabs owners / tenants -->
              <ul class="nav nav-tabs mb-2">
                <li class="nav-item">
                  <button class="nav-link py-1 px-3"
                          [class.active]="recipientTab() === 'owners'"
                          (click)="recipientTab.set('owners'); search.set('')">
                    <i class="bi bi-person-fill me-1"></i>Propriétaires ({{ owners().length }})
                  </button>
                </li>
                <li class="nav-item">
                  <button class="nav-link py-1 px-3"
                          [class.active]="recipientTab() === 'tenants'"
                          (click)="recipientTab.set('tenants'); search.set('')">
                    <i class="bi bi-people-fill me-1"></i>Locataires ({{ tenants().length }})
                  </button>
                </li>
              </ul>

              <!-- Search bar -->
              <div class="input-group input-group-sm mb-2">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input class="form-control"
                       [ngModel]="search()"
                       (ngModelChange)="search.set($event)"
                       placeholder="Rechercher par nom ou n° d'appartement…">
                <button *ngIf="search()" class="btn btn-outline-secondary" type="button" (click)="search.set('')">
                  <i class="bi bi-x"></i>
                </button>
              </div>

              <!-- Action buttons -->
              <div class="mb-2 d-flex gap-2 align-items-center flex-wrap">
                <button type="button" class="btn btn-outline-secondary btn-sm" (click)="selectAllCurrent()">
                  <i class="bi bi-check-all me-1"></i>Tous
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" (click)="clearAllCurrent()">
                  <i class="bi bi-x me-1"></i>Aucun
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm" (click)="selectAllBoth()">
                  <i class="bi bi-check2-all me-1"></i>Tous (proprio + locataires)
                </button>
                <span class="small text-muted ms-1">{{ selectedRecipients().length }} sélectionné(s)</span>
              </div>

              <!-- Owners list -->
              <div *ngIf="recipientTab() === 'owners'">
                <div *ngIf="loadingOwners()" class="text-center py-2">
                  <div class="spinner-border spinner-border-sm text-primary"></div>
                </div>
                <div *ngIf="!loadingOwners() && filteredOwners().length === 0" class="text-muted small py-2">
                  <ng-container *ngIf="search(); else noOwners">Aucun résultat pour « {{ search() }} »</ng-container>
                  <ng-template #noOwners>Aucun propriétaire dans cette copropriété.</ng-template>
                </div>
                <div *ngIf="!loadingOwners() && filteredOwners().length > 0"
                     class="border rounded p-2" style="max-height:220px;overflow-y:auto">
                  <div class="form-check py-1 border-bottom" *ngFor="let owner of filteredOwners(); last as isLast"
                       [class.border-bottom]="!isLast">
                    <input class="form-check-input" type="checkbox"
                           [id]="'owner-' + owner.userId"
                           [checked]="selectedRecipients().includes(owner.userId)"
                           (change)="toggleRecipient(owner.userId)">
                    <label class="form-check-label w-100" [for]="'owner-' + owner.userId">
                      <div class="d-flex justify-content-between align-items-center">
                        <span>{{ owner.firstName }} {{ owner.lastName }}</span>
                        <div class="d-flex gap-1 flex-wrap">
                          <span *ngFor="let ou of owner.ownerUnits"
                                class="badge bg-light text-dark border small">
                            <i class="bi bi-door-open me-1"></i>{{ ou.unit?.unitNumber || '—' }}
                          </span>
                        </div>
                      </div>
                      <small class="text-muted">{{ owner.email }}</small>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Tenants list -->
              <div *ngIf="recipientTab() === 'tenants'">
                <div *ngIf="loadingTenants()" class="text-center py-2">
                  <div class="spinner-border spinner-border-sm text-primary"></div>
                </div>
                <div *ngIf="!loadingTenants() && filteredTenants().length === 0" class="text-muted small py-2">
                  <ng-container *ngIf="search(); else noTenants">Aucun résultat pour « {{ search() }} »</ng-container>
                  <ng-template #noTenants>Aucun locataire dans cette copropriété.</ng-template>
                </div>
                <div *ngIf="!loadingTenants() && filteredTenants().length > 0"
                     class="border rounded p-2" style="max-height:220px;overflow-y:auto">
                  <div class="form-check py-1" *ngFor="let tenant of filteredTenants(); last as isLast"
                       [class.border-bottom]="!isLast">
                    <input class="form-check-input" type="checkbox"
                           [id]="'tenant-' + tenant.id"
                           [checked]="selectedRecipients().includes(tenant.id)"
                           (change)="toggleRecipient(tenant.id)">
                    <label class="form-check-label w-100" [for]="'tenant-' + tenant.id">
                      <div class="d-flex justify-content-between align-items-center">
                        <span>{{ tenant.firstName }} {{ tenant.lastName }}</span>
                        <div class="d-flex gap-1 align-items-center">
                          <span *ngIf="tenant.unit?.unitNumber"
                                class="badge bg-light text-dark border small">
                            <i class="bi bi-door-open me-1"></i>{{ tenant.unit?.unitNumber }}
                          </span>
                          <span class="badge bg-info text-dark small">Locataire</span>
                        </div>
                      </div>
                      <small class="text-muted">{{ tenant.email }}</small>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 d-flex gap-2">
            <button class="btn btn-primary" (click)="createCampaign()" [disabled]="saving()">
              <span *ngIf="saving()" class="spinner-border spinner-border-sm me-1"></span>
              Créer la campagne
            </button>
            <button class="btn btn-outline-secondary" (click)="cancelForm()">Annuler</button>
          </div>
          <div *ngIf="formError()" class="alert alert-danger mt-2 py-1 small">{{ formError() }}</div>
        </div>
      </div>

      <!-- Campaign list -->
      <div *ngIf="loading()" class="text-center py-4">
        <div class="spinner-border spinner-border-sm text-primary"></div>
      </div>

      <div *ngIf="!loading() && campaigns().length === 0" class="settings-card">
        <div class="settings-card-body text-center py-5 text-muted">
          <i class="bi bi-megaphone fs-2 d-block mb-2"></i>
          Aucune campagne
        </div>
      </div>

      <div *ngFor="let c of campaigns()" class="settings-card mb-3">
        <div class="settings-card-body">
          <div class="d-flex align-items-start justify-content-between">
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span class="fw-semibold">{{ c.name }}</span>
                <span class="badge" [ngClass]="statusBadge(c.status)">{{ statusLabel(c.status) }}</span>
                <span *ngFor="let ch of c.channels" class="badge bg-secondary bg-opacity-75">
                  <i class="bi me-1" [ngClass]="channelIcon(ch)"></i>{{ ch }}
                </span>
              </div>
              <div class="small text-muted mb-2">
                Créée le {{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}
              </div>
              <div *ngIf="c.totalRecipients > 0" class="mb-1">
                <div class="d-flex justify-content-between small mb-1">
                  <span>{{ c.sentCount }} / {{ c.totalRecipients }} envoyés</span>
                  <span class="text-danger" *ngIf="c.failedCount > 0">{{ c.failedCount }} échecs</span>
                </div>
                <div class="progress" style="height:6px">
                  <div class="progress-bar bg-success" [style.width.%]="(c.sentCount / c.totalRecipients) * 100"></div>
                  <div class="progress-bar bg-danger" [style.width.%]="(c.failedCount / c.totalRecipients) * 100"></div>
                </div>
              </div>
            </div>
            <div class="d-flex gap-2 ms-3">
              <button *ngIf="c.status === 'Draft'" class="btn btn-success btn-sm" (click)="start(c.id)">
                <i class="bi bi-play-fill me-1"></i>Lancer
              </button>
              <button *ngIf="c.status === 'Running' || c.status === 'Scheduled'"
                      class="btn btn-outline-danger btn-sm" (click)="cancel(c.id)">
                <i class="bi bi-stop-fill me-1"></i>Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-card {
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden; margin-bottom: 1.5rem;
    }
    .settings-card-header {
      display: flex; align-items: center; gap: 1rem;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f0f0;
      background: #fafbfc;
    }
    .settings-card-body { padding: 1.5rem; }
    .settings-icon {
      width: 44px; height: 44px; border-radius: 10px;
      background: #e8f0fe; color: #1a73e8;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; flex-shrink: 0;
    }
  `]
})
export class CommunicationCampaignsComponent implements OnInit {
  private svc = inject(CommunicationService);
  private activeCoproperty = inject(ActiveCopropertyService);
  private ownerService = inject(OwnerService);
  private tenantService = inject(TenantService);

  campaigns = signal<CampaignDto[]>([]);
  owners = signal<OwnerWithUnits[]>([]);
  tenants = signal<Tenant[]>([]);
  loading = signal(false);
  loadingOwners = signal(false);
  loadingTenants = signal(false);
  showForm = signal(false);
  saving = signal(false);
  formError = signal('');
  selectedRecipients = signal<string[]>([]);
  recipientTab = signal<RecipientTab>('owners');
  search = signal('');

  activeCopropertyName = computed(() => this.activeCoproperty.activeCoproperty()?.name ?? 'Copropriété active');

  filteredOwners = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.owners();
    return this.owners().filter(o => {
      const name = `${o.firstName} ${o.lastName}`.toLowerCase();
      const units = (o.ownerUnits ?? []).map(ou => ou.unit?.unitNumber ?? '').join(' ').toLowerCase();
      return name.includes(q) || units.includes(q);
    });
  });

  filteredTenants = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.tenants();
    return this.tenants().filter(t => {
      const name = `${t.firstName} ${t.lastName}`.toLowerCase();
      const unit = (t.unit?.unitNumber ?? '').toLowerCase();
      return name.includes(q) || unit.includes(q);
    });
  });

  availableChannels = ['InApp', 'Push', 'Email'];

  draft: Omit<CreateCampaignDto, 'recipientIds'> & { description?: string } = this.emptyDraft();

  ngOnInit(): void {
    this.load();
    this.loadOwners();
    this.loadTenants();
  }

  load(): void {
    this.loading.set(true);
    const copropertyId = this.activeCoproperty.activeId();
    this.svc.getCampaigns({ size: 50, copropertyId: copropertyId ?? undefined }).subscribe({
      next: res => { this.campaigns.set(res.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadOwners(): void {
    const copropertyId = this.activeCoproperty.activeId();
    if (!copropertyId) return;
    this.loadingOwners.set(true);
    this.ownerService.getAllOwners(copropertyId).subscribe({
      next: owners => { this.owners.set(owners); this.loadingOwners.set(false); },
      error: () => this.loadingOwners.set(false),
    });
  }

  loadTenants(): void {
    const copropertyId = this.activeCoproperty.activeId();
    if (!copropertyId) return;
    this.loadingTenants.set(true);
    this.tenantService.getTenants(copropertyId).subscribe({
      next: tenants => { this.tenants.set(tenants); this.loadingTenants.set(false); },
      error: () => this.loadingTenants.set(false),
    });
  }

  emptyDraft() {
    return { name: '', channels: [] as string[], message: '', subject: '', description: '' };
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.draft = this.emptyDraft();
    this.selectedRecipients.set([]);
    this.formError.set('');
    this.recipientTab.set('owners');
    this.search.set('');
  }

  toggleChannel(ch: string): void {
    const idx = this.draft.channels.indexOf(ch);
    if (idx >= 0) this.draft.channels.splice(idx, 1);
    else this.draft.channels.push(ch);
  }

  toggleRecipient(id: string): void {
    this.selectedRecipients.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  selectAllCurrent(): void {
    if (this.recipientTab() === 'owners') {
      const ids = this.filteredOwners().map(o => o.userId).filter(Boolean);
      this.selectedRecipients.update(list => [...new Set([...list, ...ids])]);
    } else {
      const ids = this.filteredTenants().map(t => t.id).filter(Boolean);
      this.selectedRecipients.update(list => [...new Set([...list, ...ids])]);
    }
  }

  clearAllCurrent(): void {
    if (this.recipientTab() === 'owners') {
      const ids = new Set(this.filteredOwners().map(o => o.userId));
      this.selectedRecipients.update(list => list.filter(id => !ids.has(id)));
    } else {
      const ids = new Set(this.filteredTenants().map(t => t.id));
      this.selectedRecipients.update(list => list.filter(id => !ids.has(id)));
    }
  }

  selectAllBoth(): void {
    const ownerIds = this.owners().map(o => o.userId).filter(Boolean);
    const tenantIds = this.tenants().map(t => t.id).filter(Boolean);
    this.selectedRecipients.set([...new Set([...ownerIds, ...tenantIds])]);
  }

  createCampaign(): void {
    if (!this.draft.name.trim()) { this.formError.set('Le nom est requis.'); return; }
    if (!this.draft.channels.length) { this.formError.set('Sélectionnez au moins un canal.'); return; }
    if (!this.draft.message.trim()) { this.formError.set('Le message est requis.'); return; }
    if (!this.selectedRecipients().length) { this.formError.set('Sélectionnez au moins un destinataire.'); return; }

    this.saving.set(true);
    this.formError.set('');

    const payload: CreateCampaignDto = {
      name: this.draft.name,
      description: this.draft.description,
      copropertyId: this.activeCoproperty.activeId() ?? undefined,
      channels: this.draft.channels,
      recipientIds: this.selectedRecipients(),
      message: this.draft.message,
      subject: this.draft.subject,
    };

    this.svc.createCampaign(payload).subscribe({
      next: () => { this.saving.set(false); this.cancelForm(); this.load(); },
      error: () => { this.saving.set(false); this.formError.set('Erreur lors de la création.'); },
    });
  }

  start(id: string): void {
    this.svc.startCampaign(id).subscribe({ next: () => this.load(), error: () => {} });
  }

  cancel(id: string): void {
    this.svc.cancelCampaign(id).subscribe({ next: () => this.load(), error: () => {} });
  }

  statusBadge(s: string): string {
    return ({
      Draft: 'bg-secondary', Scheduled: 'bg-info text-dark',
      Running: 'bg-primary', Completed: 'bg-success', Cancelled: 'bg-danger',
    } as Record<string, string>)[s] ?? 'bg-light text-dark';
  }

  statusLabel(s: string): string {
    return ({ Draft: 'Brouillon', Scheduled: 'Planifiée', Running: 'En cours', Completed: 'Terminée', Cancelled: 'Annulée' } as Record<string, string>)[s] ?? s;
  }

  channelIcon(ch: string): string {
    return ({ InApp: 'bi-bell', Push: 'bi-phone', Email: 'bi-envelope' } as Record<string, string>)[ch] ?? 'bi-chat';
  }
}
