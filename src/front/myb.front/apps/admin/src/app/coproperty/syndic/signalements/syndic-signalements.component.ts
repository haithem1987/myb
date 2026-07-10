import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SignalementService, CopropertyService } from '@myb-front/coproperty-module';
import { ToastService } from '@myb-front/shared-ui';
import {
  Signalement,
  SignalementStatus,
  SIGNALEMENT_TYPE_LABELS,
  SIGNALEMENT_ZONE_LABELS,
  SIGNALEMENT_ZONE_ICONS,
  SIGNALEMENT_TYPE_ICONS,
  SIGNALEMENT_STATUS_LABELS,
} from '@myb-front/coproperty-module';
import { take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

type Tab = 'en-cours' | 'resolus';

@Component({
  selector: 'app-syndic-signalements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid py-4">

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1">
            <i class="bi bi-megaphone me-2 text-primary"></i>Signalements résidents
          </h2>
          <p class="text-muted mb-0">Gérez les signalements soumis par les habitants</p>
        </div>
        <div class="d-flex gap-2">
          <select class="form-select" style="width:auto" [(ngModel)]="filterType" (ngModelChange)="applyFilters()">
            <option value="">Tous les types</option>
            <option *ngFor="let opt of typeOptions" [value]="opt.value">{{ opt.label }}</option>
          </select>
          <select class="form-select" style="width:auto" [(ngModel)]="filterZone" (ngModelChange)="applyFilters()">
            <option value="">Toutes les zones</option>
            <option *ngFor="let opt of zoneOptions" [value]="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>

      <!-- Stats row -->
      <div class="row g-3 mb-4" *ngIf="!loading()">
        <div class="col-md-3">
          <div class="stat-card border-start border-warning border-4">
            <div class="stat-value text-warning">{{ countByStatus('EN_COURS') }}</div>
            <div class="stat-label">En cours</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card border-start border-info border-4">
            <div class="stat-value text-info">{{ countByStatus('PRIS_EN_COMPTE') }}</div>
            <div class="stat-label">Pris en compte</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card border-start border-success border-4">
            <div class="stat-value text-success">{{ countByStatus('RESOLU') }}</div>
            <div class="stat-label">Résolus</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card border-start border-primary border-4">
            <div class="stat-value text-primary">{{ allSignalements().length }}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-toggle mb-3">
        <button class="tab-btn" [class.active]="activeTab() === 'en-cours'" (click)="setTab('en-cours')">
          En cours <span class="ms-1 badge bg-warning text-dark">{{ countByStatus('EN_COURS') + countByStatus('PRIS_EN_COMPTE') }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'resolus'" (click)="setTab('resolus')">
          Résolus <span class="ms-1 badge bg-success">{{ countByStatus('RESOLU') }}</span>
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading() && filteredSignalements().length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-clipboard-check fs-1"></i>
        <p class="mt-3">Aucun signalement {{ activeTab() === 'en-cours' ? 'en cours' : 'résolu' }}</p>
      </div>

      <!-- Cards -->
      <div class="row g-3" *ngIf="!loading()">
        <div class="col-12" *ngFor="let s of filteredSignalements()">
          <div class="signalement-card">
            <div class="d-flex gap-3">
              <!-- Zone icon -->
              <div class="zone-icon">
                <i class="bi" [ngClass]="getZoneIcon(s.zone)"></i>
              </div>

              <!-- Body -->
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <div>
                    <span class="fw-bold">{{ getZoneLabel(s.zone) }} — {{ getTypeLabel(s.type) }}</span>
                    <span class="text-muted small ms-2">
                      {{ formatDate(s.createdAt) }} {{ formatTime(s.createdAt) }}
                    </span>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="status-badge" [ngClass]="statusClass(s.status)">
                      {{ getStatusLabel(s.status) }}
                    </span>
                    <span class="text-muted small">
                      <i class="bi bi-eye me-1"></i>{{ s.viewsCount }}
                    </span>
                  </div>
                </div>

                <p class="mb-2 text-secondary">{{ s.description }}</p>

                <!-- Reporter -->
                <div class="d-flex align-items-center gap-2 mb-2">
                  <div class="reporter-avatar">{{ initials(s.reporterName) }}</div>
                  <span class="small fw-medium">{{ s.reporterName }}</span>
                </div>

                <!-- Syndic comment display -->
                <div *ngIf="s.syndicComment" class="syndic-comment mb-2">
                  <i class="bi bi-chat-dots me-1 text-primary"></i>
                  <em>{{ s.syndicComment }}</em>
                </div>

                <!-- Photo -->
                <div *ngIf="s.photoUrl" class="mb-2">
                  <img [src]="s.photoUrl" alt="photo" class="photo-thumb rounded" (click)="openPhoto(s.photoUrl!)">
                </div>

                <!-- Actions -->
                <div class="d-flex gap-2 flex-wrap mt-2" *ngIf="activeTab() === 'en-cours'">
                  <button class="btn btn-sm btn-outline-info"
                          [disabled]="updating() === s.id"
                          (click)="updateStatus(s, 'PRIS_EN_COMPTE')">
                    <i class="bi bi-check2 me-1"></i>Prendre en compte
                  </button>
                  <button class="btn btn-sm btn-outline-success"
                          [disabled]="updating() === s.id"
                          (click)="openResolveDialog(s)">
                    <i class="bi bi-check2-all me-1"></i>Marquer résolu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resolve Dialog -->
      <div class="modal-overlay" *ngIf="resolveTarget()" (click)="closeResolveDialog()">
        <div class="resolve-modal" (click)="$event.stopPropagation()">
          <h5 class="fw-bold mb-3"><i class="bi bi-check2-all me-2 text-success"></i>Résoudre le signalement</h5>
          <p class="text-muted small mb-3">
            <strong>{{ getZoneLabel(resolveTarget()!.zone) }} — {{ getTypeLabel(resolveTarget()!.type) }}</strong><br>
            {{ resolveTarget()!.description }}
          </p>
          <label class="form-label fw-semibold">Commentaire (optionnel)</label>
          <textarea class="form-control mb-3" rows="3" [(ngModel)]="resolveComment"
                    placeholder="Expliquez comment le problème a été résolu…"></textarea>
          <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-outline-secondary" (click)="closeResolveDialog()">Annuler</button>
            <button class="btn btn-success" [disabled]="updating() !== null" (click)="confirmResolve()">
              <span *ngIf="updating()" class="spinner-border spinner-border-sm me-1"></span>
              Confirmer résolu
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .stat-card {
      background: #fff;
      border-radius: 10px;
      padding: 16px 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,.07);
    }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 13px; color: #6b7280; }
    .tab-toggle {
      display: flex;
      background: #e8f0fe;
      border-radius: 8px;
      padding: 4px;
      width: fit-content;
      gap: 4px;
    }
    .tab-btn {
      border: none;
      background: transparent;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 500;
      color: #1a56db;
      cursor: pointer;
    }
    .tab-btn.active {
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.12);
      font-weight: 700;
    }
    .signalement-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 6px rgba(0,0,0,.07);
      padding: 18px;
      transition: box-shadow .2s;
    }
    .signalement-card:hover { box-shadow: 0 3px 12px rgba(0,0,0,.12); }
    .zone-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #2563eb;
      flex-shrink: 0;
    }
    .status-badge {
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-en-cours { background: #fff3cd; color: #856404; }
    .status-pris-en-compte { background: #cfe2ff; color: #084298; }
    .status-resolu { background: #d1e7dd; color: #0f5132; }
    .reporter-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #c7d8ff;
      color: #1a56db;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
    }
    .syndic-comment {
      background: #f0f7ff;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 13px;
      color: #444;
    }
    .photo-thumb { max-height: 80px; cursor: pointer; object-fit: cover; }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .resolve-modal {
      background: #fff;
      border-radius: 14px;
      padding: 28px;
      width: 460px;
      max-width: 95vw;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
    }
  `]
})
export class SyndicSignalementsComponent implements OnInit {
  private signalementService = inject(SignalementService);
  private copropertyService = inject(CopropertyService);
  private toastService = inject(ToastService);

  allSignalements = signal<Signalement[]>([]);
  loading = signal(true);
  updating = signal<string | null>(null);
  activeTab = signal<Tab>('en-cours');
  resolveTarget = signal<Signalement | null>(null);
  resolveComment = '';
  filterType = '';
  filterZone = '';

  typeOptions = Object.entries(SIGNALEMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  zoneOptions = Object.entries(SIGNALEMENT_ZONE_LABELS).map(([value, label]) => ({ value, label }));

  filteredSignalements = computed(() => {
    const tab = this.activeTab();
    let list = this.allSignalements().filter(s =>
      tab === 'en-cours'
        ? s.status === 'EN_COURS' || s.status === 'PRIS_EN_COMPTE'
        : s.status === 'RESOLU'
    );
    if (this.filterType) list = list.filter(s => s.type === this.filterType);
    if (this.filterZone) list = list.filter(s => s.zone === this.filterZone);
    return list;
  });

  ngOnInit(): void {
    this.loadSignalements();
  }

  private loadSignalements(): void {
    this.loading.set(true);
    this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([]))).subscribe(cops => {
      if (!cops.length) { this.loading.set(false); return; }
      this.signalementService.getSignalements(cops[0].id)
        .pipe(take(1), catchError(() => of([])))
        .subscribe(list => {
          this.allSignalements.set(list);
          this.loading.set(false);
        });
    });
  }

  applyFilters(): void { /* computed handles it */ }

  setTab(tab: Tab): void { this.activeTab.set(tab); }

  countByStatus(status: SignalementStatus): number {
    return this.allSignalements().filter(s => s.status === status).length;
  }

  updateStatus(s: Signalement, status: SignalementStatus): void {
    this.updating.set(s.id);
    this.signalementService.updateStatus(s.id, status)
      .pipe(take(1), catchError(() => of(null)))
      .subscribe(updated => {
        this.updating.set(null);
        if (updated) {
          this.allSignalements.update(list =>
            list.map(item => item.id === s.id ? { ...item, status } : item)
          );
          this.toastService.show('Statut mis à jour', { classname: 'bg-success text-light' });
        }
      });
  }

  openResolveDialog(s: Signalement): void {
    this.resolveTarget.set(s);
    this.resolveComment = '';
  }

  closeResolveDialog(): void {
    this.resolveTarget.set(null);
    this.resolveComment = '';
  }

  confirmResolve(): void {
    const s = this.resolveTarget();
    if (!s) return;
    this.updating.set(s.id);
    this.signalementService.updateStatus(s.id, 'RESOLU', this.resolveComment || undefined)
      .pipe(take(1), catchError(() => of(null)))
      .subscribe(updated => {
        this.updating.set(null);
        if (updated) {
          this.allSignalements.update(list =>
            list.map(item => item.id === s.id
              ? { ...item, status: 'RESOLU' as SignalementStatus, syndicComment: this.resolveComment || item.syndicComment }
              : item)
          );
          this.toastService.show('Signalement marqué résolu', { classname: 'bg-success text-light' });
          this.closeResolveDialog();
        }
      });
  }

  openPhoto(url: string): void { window.open(url, '_blank'); }

  getTypeLabel(type: string): string { return SIGNALEMENT_TYPE_LABELS[type] ?? type; }
  getZoneLabel(zone: string): string { return SIGNALEMENT_ZONE_LABELS[zone] ?? zone; }
  getZoneIcon(zone: string): string { return SIGNALEMENT_ZONE_ICONS[zone] ?? 'bi-three-dots'; }
  getStatusLabel(status: SignalementStatus): string { return SIGNALEMENT_STATUS_LABELS[status] ?? status; }

  statusClass(status: SignalementStatus): string {
    const map: Record<string, string> = {
      EN_COURS: 'status-en-cours',
      PRIS_EN_COMPTE: 'status-pris-en-compte',
      RESOLU: 'status-resolu',
    };
    return map[status] ?? '';
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
