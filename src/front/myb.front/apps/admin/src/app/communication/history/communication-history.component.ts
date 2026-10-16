import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunicationService, CommunicationLogDto, LogFilter } from 'libs/shared/infra/services/communication.service';

@Component({
  selector: 'app-communication-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="communication-history">
      <div class="page-header mb-4">
        <h4 class="mb-0"><i class="bi bi-clock-history me-2"></i>Historique des communications</h4>
      </div>

      <!-- Filters -->
      <div class="card mb-3">
        <div class="card-body py-2">
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
            <div class="col-md-2">
              <button class="btn btn-outline-secondary btn-sm" (click)="resetFilter()">
                <i class="bi bi-x-circle me-1"></i>Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="card-body p-0">
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
        <div *ngIf="total() > pageSize" class="card-footer d-flex align-items-center justify-content-between py-2">
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
})
export class CommunicationHistoryComponent implements OnInit {
  private svc = inject(CommunicationService);

  logs = signal<CommunicationLogDto[]>([]);
  loading = signal(false);
  total = signal(0);
  page = signal(0);
  pageSize = 20;
  filter: LogFilter = {};

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getLogs({ ...this.filter, page: this.page(), size: this.pageSize }).subscribe({
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
    return { InApp: 'bg-primary', Push: 'bg-purple text-white', Email: 'bg-warning text-dark' }[ch] ?? 'bg-secondary';
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
