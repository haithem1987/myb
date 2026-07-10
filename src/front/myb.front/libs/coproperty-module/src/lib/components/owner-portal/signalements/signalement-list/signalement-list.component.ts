import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SignalementService } from '../../../../services/signalement.service';
import { KeycloakService } from '@myb-front/auth';
import { CopropertyService } from '../../../../services/coproperty.service';
import {
  Signalement,
  SignalementStatus,
  SIGNALEMENT_TYPE_LABELS,
  SIGNALEMENT_ZONE_LABELS,
  SIGNALEMENT_TYPE_ICONS,
  SIGNALEMENT_ZONE_ICONS,
  SIGNALEMENT_STATUS_LABELS,
} from '../../../../models/signalement.model';
import { take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

type Tab = 'en-cours' | 'resolus';

@Component({
  selector: 'app-signalement-list',
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
        <a routerLink="../signalements/nouveau" class="btn btn-primary">
          <i class="bi bi-plus-lg me-2"></i>Je signale
        </a>
      </div>

      <!-- Tabs -->
      <div class="tab-toggle mb-3">
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'en-cours'"
          (click)="setTab('en-cours')">
          En cours
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab() === 'resolus'"
          (click)="setTab('resolus')">
          Résolus
        </button>
      </div>

      <!-- Count banner -->
      <div class="count-banner mb-3" *ngIf="!loading()">
        <span class="count-badge">{{ displayedSignalements().length }}</span>
        <span class="ms-2 text-muted">
          {{ activeTab() === 'en-cours' ? 'Signalements en cours' : 'Signalements résolus' }}
        </span>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading() && displayedSignalements().length === 0" class="empty-state text-center py-5">
        <i class="bi bi-clipboard-check fs-1 text-muted"></i>
        <p class="mt-3 text-muted">Aucun signalement
          {{ activeTab() === 'en-cours' ? 'en cours' : 'résolu' }}
        </p>
      </div>

      <!-- Signalement cards -->
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
          <div class="reporter-avatar me-2">
            {{ initials(s.reporterName) }}
          </div>
          <span class="reporter-name me-3">{{ s.reporterName }}</span>

          <span class="status-badge" [ngClass]="statusClass(s.status)">
            {{ getStatusLabel(s.status) }}
          </span>

          <span class="views-badge ms-auto">
            <span class="me-1">{{ s.viewsCount }}</span>
            <i class="bi bi-eye"></i>
          </span>
        </div>

        <div *ngIf="s.syndicComment" class="syndic-comment mt-2">
          <i class="bi bi-chat-dots me-1"></i>{{ s.syndicComment }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-toggle {
      display: flex;
      border-radius: 8px;
      background: #e8f0fe;
      padding: 4px;
      width: fit-content;
    }
    .tab-btn {
      border: none;
      background: transparent;
      padding: 8px 24px;
      border-radius: 6px;
      font-weight: 500;
      color: #1a56db;
      cursor: pointer;
      transition: background 0.2s;
    }
    .tab-btn.active {
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.12);
      color: #1a56db;
      font-weight: 700;
    }
    .count-banner {
      display: flex;
      align-items: center;
      background: #f0f4ff;
      border-radius: 8px;
      padding: 10px 16px;
    }
    .count-badge {
      background: #c7d8ff;
      color: #1a56db;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    .signalement-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 6px rgba(0,0,0,.08);
      padding: 16px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .signalement-card:hover { box-shadow: 0 3px 12px rgba(0,0,0,.14); }
    .card-header-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .type-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #f0f4ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #1a56db;
      flex-shrink: 0;
    }
    .card-title-block { flex: 1; }
    .card-title { font-weight: 700; font-size: 15px; }
    .card-date { font-size: 12px; color: #888; text-align: right; white-space: nowrap; }
    .card-description {
      margin: 8px 0;
      color: #444;
      font-size: 14px;
      line-height: 1.5;
    }
    .card-footer-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }
    .reporter-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #c7d8ff;
      color: #1a56db;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    }
    .reporter-name { font-size: 13px; font-weight: 500; }
    .status-badge {
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-en-cours { background: #fff3cd; color: #856404; }
    .status-pris-en-compte { background: #cfe2ff; color: #084298; }
    .status-resolu { background: #d1e7dd; color: #0f5132; }
    .views-badge { font-size: 13px; color: #888; }
    .syndic-comment {
      font-size: 13px;
      color: #555;
      background: #f8f9fa;
      border-radius: 6px;
      padding: 6px 10px;
    }
  `]
})
export class SignalementListComponent implements OnInit {
  private signalementService = inject(SignalementService);
  private keycloakService = inject(KeycloakService);
  private copropertyService = inject(CopropertyService);

  signalements = signal<Signalement[]>([]);
  loading = signal(true);
  activeTab = signal<Tab>('en-cours');

  displayedSignalements = computed(() => {
    const tab = this.activeTab();
    return this.signalements().filter(s => {
      if (tab === 'en-cours') return s.status === 'EN_COURS' || s.status === 'PRIS_EN_COMPTE';
      return s.status === 'RESOLU';
    });
  });

  ngOnInit(): void {
    this.loadSignalements();
  }

  private loadSignalements(): void {
    this.loading.set(true);
    this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([]))).subscribe(cops => {
      if (!cops.length) { this.loading.set(false); return; }
      const copropertyId = cops[0].id;
      this.signalementService.getSignalements(copropertyId)
        .pipe(take(1), catchError(() => of([])))
        .subscribe(list => {
          this.signalements.set(list);
          this.loading.set(false);
        });
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  onCardClick(s: Signalement): void {
    this.signalementService.incrementViews(s.id).pipe(take(1)).subscribe();
  }

  getTypeLabel(type: string): string {
    return SIGNALEMENT_TYPE_LABELS[type] ?? type;
  }

  getZoneLabel(zone: string): string {
    return SIGNALEMENT_ZONE_LABELS[zone] ?? zone;
  }

  getZoneIcon(zone: string): string {
    return SIGNALEMENT_ZONE_ICONS[zone] ?? 'bi-three-dots';
  }

  getStatusLabel(status: SignalementStatus): string {
    return SIGNALEMENT_STATUS_LABELS[status] ?? status;
  }

  statusClass(status: SignalementStatus): string {
    switch (status) {
      case 'EN_COURS': return 'status-en-cours';
      case 'PRIS_EN_COMPTE': return 'status-pris-en-compte';
      case 'RESOLU': return 'status-resolu';
      default: return '';
    }
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
