import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunicationService, CommunicationLogDto, LogFilter } from 'libs/shared/infra/services/communication.service';
import { ActiveCopropertyService } from '@myb-front/coproperty-module';

@Component({
  selector: 'app-communication-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="communication-history">

      <!-- Filters card -->
      <div class="settings-card mb-3">
        <div class="settings-card-header">
          <div class="settings-icon">
            <i class="bi bi-funnel"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-semibold">Filtres</div>
          </div>
          <button class="btn btn-outline-secondary btn-sm" (click)="resetFilter()">
            <i class="bi bi-x-circle me-1"></i>Réinitialiser
          </button>
        </div>
        <div class="settings-card-body py-2">
          <div class="row g-2 align-items-end">
            <div class="col-md-2">
              <label class="form-label small mb-1">De</label>
              <input type="date" class="form-control form-control-sm" [(ngModel)]="filter.from" (change)="load()">
            </div>
            <div class="col-md-2">
              <label class="form-label small mb-1">À</label>
              <input type="date" class="form-control form-control-sm" [(ngModel)]="filter.to" (change)="load()">
            </div>
            <div class="col-md-2">
              <label class="form-label small mb-1">Canal</label>
              <select class="form-select form-select-sm" [(ngModel)]="filter.channel" (change)="load()">
                <option value="">Tous</option>
                <option value="InApp">In-App</option>
                <option value="Push">Push</option>
                <option value="Email">Email</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label small mb-1">Statut</label>
              <select class="form-select form-select-sm" [(ngModel)]="filter.status" (change)="load()">
                <option value="">Tous</option>
                <option value="Pending">En attente</option>
                <option value="Sent">Envoyé</option>
                <option value="Delivered">Délivré</option>
                <option value="Failed">Échoué</option>
                <option value="Read">Lu</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Results card -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon">
            <i class="bi bi-table"></i>
          </div>
          <div>
            <div class="fw-semibold">Historique des envois</div>
            <div class="text-muted small" *ngIf="total() > 0">{{ total() }} résultat(s)</div>
          </div>
        </div>
        <div class="p-0">
          <div *ngIf="loading()" class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary"></div>
          </div>

          <div *ngIf="!loading() && logs().length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-2 d-block mb-2"></i>
            Aucune communication trouvée
          </div>

          <table *ngIf="!loading() && logs().length > 0" class="table table-hover table-sm mb-0">
            <thead class="table-light">
              <tr>
                <th>Date</th>
                <th>Canal</th>
                <th>Destinataire</th>
                <th>Sujet</th>
                <th>Statut</th>
                <th>Copropriété</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of logs()">
                <td class="text-nowrap small">{{ log.sentAt | date:'dd/MM/yy HH:mm' }}</td>
                <td>
                  <span class="badge" [ngClass]="channelBadge(log.channel)">
                    <i class="bi me-1" [ngClass]="channelIcon(log.channel)"></i>{{ log.channel }}
                  </span>
                </td>
                <td class="small">{{ log.recipientEmail || log.recipientId }}</td>
                <td class="small text-truncate" style="max-width:200px" [title]="log.subject">{{ log.subject }}</td>
                <td>
                  <span class="badge" [ngClass]="statusBadge(log.status)">{{ statusLabel(log.status) }}</span>
                </td>
                <td class="small text-muted">{{ log.copropertyId || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="total() > pageSize" class="settings-card-footer d-flex align-items-center justify-content-between">
          <small class="text-muted">{{ total() }} résultats</small>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" [class.disabled]="page() === 0">
                <button class="page-link" (click)="prevPage()"><i class="bi bi-chevron-left"></i></button>
              </li>
              <li class="page-item disabled">
                <span class="page-link">{{ page() + 1 }} / {{ totalPages() }}</span>
              </li>
              <li class="page-item" [class.disabled]="page() >= totalPages() - 1">
                <button class="page-link" (click)="nextPage()"><i class="bi bi-chevron-right"></i></button>
              </li>
            </ul>
          </nav>
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
    .settings-card-footer {
      padding: 0.625rem 1.5rem; border-top: 1px solid #f0f0f0;
      background: #fafbfc;
    }
    .settings-icon {
      width: 44px; height: 44px; border-radius: 10px;
      background: #e8f0fe; color: #1a73e8;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; flex-shrink: 0;
    }
    .py-2.settings-card-body { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  `]
})
export class CommunicationHistoryComponent implements OnInit {
  private svc = inject(CommunicationService);
  private activeCoproperty = inject(ActiveCopropertyService);

  logs = signal<CommunicationLogDto[]>([]);
  loading = signal(false);
  total = signal(0);
  page = signal(0);
  pageSize = 20;
  filter: LogFilter = {};

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const copropertyId = this.activeCoproperty.activeId();
    this.svc.getLogs({ ...this.filter, copropertyId: copropertyId ?? undefined, page: this.page(), size: this.pageSize }).subscribe({
      next: res => { this.logs.set(res.items); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  resetFilter(): void {
    this.filter = {};
    this.page.set(0);
    this.load();
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() < this.totalPages() - 1) { this.page.update(p => p + 1); this.load(); } }
  totalPages(): number { return Math.ceil(this.total() / this.pageSize) || 1; }

  channelBadge(ch: string): string {
    return { InApp: 'bg-primary', Push: 'bg-info text-dark', Email: 'bg-warning text-dark' }[ch] ?? 'bg-secondary';
  }

  channelIcon(ch: string): string {
    return { InApp: 'bi-bell', Push: 'bi-phone', Email: 'bi-envelope' }[ch] ?? 'bi-chat';
  }

  statusBadge(s: string): string {
    return {
      Pending: 'bg-secondary',
      Sent: 'bg-secondary',
      Delivered: 'bg-success',
      Failed: 'bg-danger',
      Read: 'bg-success bg-opacity-75',
    }[s] ?? 'bg-light text-dark';
  }

  statusLabel(s: string): string {
    return { Pending: 'En attente', Sent: 'Envoyé', Delivered: 'Délivré', Failed: 'Échoué', Read: 'Lu' }[s] ?? s;
  }
}
