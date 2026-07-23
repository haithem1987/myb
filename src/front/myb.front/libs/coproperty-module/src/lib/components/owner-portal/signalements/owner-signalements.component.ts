import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SignalementService, CopropertyService } from '@myb-front/coproperty-module';
import { KeycloakService } from '@myb-front/auth';
import { ToastService } from '@myb-front/shared-ui';
import {
  Signalement,
  SignalementStatus,
  SIGNALEMENT_TYPE_LABELS,
  SIGNALEMENT_ZONE_LABELS,
  SIGNALEMENT_ZONE_ICONS,
  SIGNALEMENT_STATUS_LABELS,
} from '@myb-front/coproperty-module';
import { take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

type Tab = 'en-cours' | 'resolus';

@Component({
  selector: 'myb-coproperty-owner-signalements',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1 fw-bold">Signalements</h2>
          <p class="text-muted mb-0">Incidents signalés dans votre copropriété</p>
        </div>
        <button class="btn btn-primary" (click)="goToNew()">
          <i class="bi bi-plus-lg me-2"></i>Je signale
        </button>
      </div>

      <!-- Tabs -->
      <div class="tab-toggle mb-3">
        <button class="tab-btn" [class.active]="activeTab() === 'en-cours'" (click)="setTab('en-cours')">En cours</button>
        <button class="tab-btn" [class.active]="activeTab() === 'resolus'" (click)="setTab('resolus')">Résolus</button>
      </div>

      <!-- Count -->
      <div class="count-banner mb-3" *ngIf="!loading()">
        <span class="count-badge">{{ displayedSignalements().length }}</span>
        <span class="ms-2 text-muted">
          {{ activeTab() === 'en-cours' ? 'Signalements en cours' : 'Signalements résolus' }}
        </span>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading() && displayedSignalements().length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-clipboard-check fs-1"></i>
        <p class="mt-3">Aucun signalement {{ activeTab() === 'en-cours' ? 'en cours' : 'résolu' }}</p>
      </div>

      <!-- Cards -->
      <div class="signalement-card" *ngFor="let s of displayedSignalements()" (click)="onCardClick(s)">
        <div class="card-header-row">
          <div class="type-icon-wrap">
            <i class="bi" [ngClass]="getZoneIcon(s.zone)"></i>
          </div>
          <div class="card-title-block">
            <span class="card-title">{{ getZoneLabel(s.zone) }} - {{ getTypeLabel(s.type) }}</span>
          </div>
          <div class="card-date">
            <span>{{ formatDate(s.createdAt) }}</span>
            <span class="d-block">{{ formatTime(s.createdAt) }}</span>
          </div>
        </div>
        <p class="card-description">{{ s.description }}</p>
        <div class="card-footer-row">
          <div class="reporter-avatar me-2">{{ initials(s.reporterName) }}</div>
          <span class="reporter-name me-3">{{ s.reporterName }}</span>
          <span class="status-badge" [ngClass]="statusClass(s.status)">{{ getStatusLabel(s.status) }}</span>
          <span class="views-badge ms-auto"><span class="me-1">{{ s.viewsCount }}</span><i class="bi bi-eye"></i></span>
        </div>
        <div *ngIf="s.syndicComment" class="syndic-comment mt-2">
          <i class="bi bi-chat-dots me-1"></i>{{ s.syndicComment }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-toggle { display:flex; background:#e8f0fe; border-radius:8px; padding:4px; width:fit-content; }
    .tab-btn { border:none; background:transparent; padding:8px 24px; border-radius:6px; font-weight:500; color:#1a56db; cursor:pointer; }
    .tab-btn.active { background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.12); font-weight:700; }
    .count-banner { display:flex; align-items:center; background:#f0f4ff; border-radius:8px; padding:10px 16px; }
    .count-badge { background:#c7d8ff; color:#1a56db; border-radius:50%; width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; font-weight:700; }
    .signalement-card { background:#fff; border-radius:12px; box-shadow:0 1px 6px rgba(0,0,0,.08); padding:16px; margin-bottom:12px; cursor:pointer; transition:box-shadow .2s; }
    .signalement-card:hover { box-shadow:0 3px 12px rgba(0,0,0,.14); }
    .card-header-row { display:flex; align-items:flex-start; gap:12px; }
    .type-icon-wrap { width:36px; height:36px; border-radius:8px; background:#f0f4ff; display:flex; align-items:center; justify-content:center; font-size:18px; color:#1a56db; flex-shrink:0; }
    .card-title-block { flex:1; }
    .card-title { font-weight:700; font-size:15px; }
    .card-date { font-size:12px; color:#888; text-align:right; white-space:nowrap; }
    .card-description { margin:8px 0; color:#444; font-size:14px; line-height:1.5; }
    .card-footer-row { display:flex; align-items:center; flex-wrap:wrap; gap:4px; }
    .reporter-avatar { width:28px; height:28px; border-radius:50%; background:#c7d8ff; color:#1a56db; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }
    .reporter-name { font-size:13px; font-weight:500; }
    .status-badge { padding:2px 10px; border-radius:20px; font-size:12px; font-weight:600; }
    .status-en-cours { background:#fff3cd; color:#856404; }
    .status-pris-en-compte { background:#cfe2ff; color:#084298; }
    .status-resolu { background:#d1e7dd; color:#0f5132; }
    .views-badge { font-size:13px; color:#888; }
    .syndic-comment { font-size:13px; color:#555; background:#f8f9fa; border-radius:6px; padding:6px 10px; }
  `]
})
export class OwnerSignalementsComponent implements OnInit {
  private signalementService = inject(SignalementService);
  private copropertyService = inject(CopropertyService);
  private router = inject(Router);

  signalements = signal<Signalement[]>([]);
  loading = signal(true);
  activeTab = signal<Tab>('en-cours');

  displayedSignalements = computed(() => {
    const tab = this.activeTab();
    return this.signalements().filter(s =>
      tab === 'en-cours' ? s.status !== 'RESOLU' : s.status === 'RESOLU'
    );
  });

  ngOnInit(): void {
    this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([]))).subscribe(cops => {
      if (!cops.length) { this.loading.set(false); return; }
      this.signalementService.getSignalements(cops[0].id)
        .pipe(take(1), catchError(() => of([])))
        .subscribe(list => { this.signalements.set(list); this.loading.set(false); });
    });
  }

  setTab(tab: Tab): void { this.activeTab.set(tab); }

  onCardClick(s: Signalement): void {
    this.signalementService.incrementViews(s.id).pipe(take(1)).subscribe();
  }

  goToNew(): void { this.router.navigate(['/coproperty/owner/signalements/nouveau']); }

  getTypeLabel(type: string): string { return SIGNALEMENT_TYPE_LABELS[type] ?? type; }
  getZoneLabel(zone: string): string { return SIGNALEMENT_ZONE_LABELS[zone] ?? zone; }
  getZoneIcon(zone: string): string { return SIGNALEMENT_ZONE_ICONS[zone] ?? 'bi-three-dots'; }
  getStatusLabel(status: SignalementStatus): string { return SIGNALEMENT_STATUS_LABELS[status] ?? status; }
  statusClass(status: SignalementStatus): string {
    const map: Record<string, string> = { EN_COURS: 'status-en-cours', PRIS_EN_COMPTE: 'status-pris-en-compte', RESOLU: 'status-resolu' };
    return map[status] ?? '';
  }
  initials(name: string): string { return name.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase(); }
  formatDate(iso: string): string { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  formatTime(iso: string): string { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
}
