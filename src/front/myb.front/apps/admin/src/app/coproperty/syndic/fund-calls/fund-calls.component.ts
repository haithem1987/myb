import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface FundCall {
  id: string;
  copropertyName: string;
  quarter: string;
  year: number;
  totalAmount: number;
  invoicesCount: number;
  paidCount: number;
  status: 'draft' | 'sent' | 'in-progress' | 'completed';
  dueDate: string;
  createdAt: string;
}

@Component({
  selector: 'app-fund-calls',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="fund-calls-container">
      <header class="page-header">
        <div>
          <h1>Appels de Fonds</h1>
          <p class="subtitle">Gérez les appels de fonds trimestriels de vos copropriétés</p>
        </div>
        <button class="btn btn-primary" (click)="createFundCall()">
          <i class="bi bi-plus-circle"></i>
          Créer un appel de fonds
        </button>
      </header>

      <div class="stats-cards">
        <div class="stat-card">
          <i class="bi bi-calendar-check icon"></i>
          <div class="stat-content">
            <div class="stat-value">{{ totalFundCalls() }}</div>
            <div class="stat-label">Total appels de fonds</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="bi bi-clock-history icon"></i>
          <div class="stat-content">
            <div class="stat-value">{{ inProgressCount() }}</div>
            <div class="stat-label">En cours</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="bi bi-currency-euro icon"></i>
          <div class="stat-content">
            <div class="stat-value">{{ totalAmount() | number:'1.0-0' }}€</div>
            <div class="stat-label">Montant total</div>
          </div>
        </div>
        <div class="stat-card">
          <i class="bi bi-check-circle icon success"></i>
          <div class="stat-content">
            <div class="stat-value">{{ collectionRate() }}%</div>
            <div class="stat-label">Taux de recouvrement</div>
          </div>
        </div>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>Statut</label>
          <select class="form-select">
            <option value="">Tous</option>
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyé</option>
            <option value="in-progress">En cours</option>
            <option value="completed">Terminé</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Année</label>
          <select class="form-select">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Trimestre</label>
          <select class="form-select">
            <option value="">Tous</option>
            <option value="Q1">T1</option>
            <option value="Q2">T2</option>
            <option value="Q3">T3</option>
            <option value="Q4">T4</option>
          </select>
        </div>
      </div>

      <div class="fund-calls-list">
        <div class="fund-call-card" *ngFor="let fundCall of fundCalls()">
          <div class="fund-call-header">
            <div>
              <h3>{{ fundCall.copropertyName }}</h3>
              <p class="period">{{ fundCall.quarter }} {{ fundCall.year }}</p>
            </div>
            <span class="status-badge" [class]="fundCall.status">
              {{ getStatusLabel(fundCall.status) }}
            </span>
          </div>
          
          <div class="fund-call-stats">
            <div class="stat">
              <i class="bi bi-currency-euro"></i>
              <div>
                <strong>{{ fundCall.totalAmount | number:'1.0-0' }}€</strong>
                <small>Montant total</small>
              </div>
            </div>
            <div class="stat">
              <i class="bi bi-file-text"></i>
              <div>
                <strong>{{ fundCall.invoicesCount }}</strong>
                <small>Factures</small>
              </div>
            </div>
            <div class="stat">
              <i class="bi bi-check-circle"></i>
              <div>
                <strong>{{ fundCall.paidCount }}/{{ fundCall.invoicesCount }}</strong>
                <small>Payées</small>
              </div>
            </div>
            <div class="stat">
              <i class="bi bi-calendar-event"></i>
              <div>
                <strong>{{ fundCall.dueDate }}</strong>
                <small>Échéance</small>
              </div>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" 
                 [style.width.%]="(fundCall.paidCount / fundCall.invoicesCount) * 100">
            </div>
          </div>
          <div class="progress-label">
            {{ ((fundCall.paidCount / fundCall.invoicesCount) * 100) | number:'1.0-0' }}% recouvré
          </div>

          <div class="fund-call-actions">
            <button class="btn btn-sm btn-outline-primary" (click)="viewDetails(fundCall.id)">
              <i class="bi bi-eye"></i>
              Détails
            </button>
            <button class="btn btn-sm btn-outline-secondary" (click)="downloadReport(fundCall.id)">
              <i class="bi bi-download"></i>
              Rapport
            </button>
            <button class="btn btn-sm btn-outline-warning" 
                    *ngIf="fundCall.paidCount < fundCall.invoicesCount"
                    (click)="sendReminders(fundCall.id)">
              <i class="bi bi-bell"></i>
              Relances
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="fundCalls().length === 0">
        <i class="bi bi-calendar-x"></i>
        <h3>Aucun appel de fonds</h3>
        <p>Créez votre premier appel de fonds pour commencer</p>
        <button class="btn btn-primary" (click)="createFundCall()">
          <i class="bi bi-plus-circle"></i>
          Créer un appel de fonds
        </button>
      </div>
    </div>
  `,
  styles: [`
    .fund-calls-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin: 0;
      color: #1a202c;
      font-size: 2rem;
      font-weight: 700;
    }

    .subtitle {
      color: #6b7280;
      margin: 0.5rem 0 0 0;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-card .icon {
      font-size: 2.5rem;
      color: #3b82f6;
    }

    .stat-card .icon.success {
      color: #10b981;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a202c;
    }

    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .filters {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .filter-group {
      flex: 1;
      min-width: 200px;
    }

    .filter-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #4b5563;
      font-size: 0.875rem;
    }

    .form-select {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .fund-calls-list {
      display: grid;
      gap: 1.5rem;
    }

    .fund-call-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .fund-call-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .fund-call-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .fund-call-header h3 {
      margin: 0;
      color: #1a202c;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .period {
      color: #6b7280;
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
    }

    .status-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.draft {
      background: #f3f4f6;
      color: #6b7280;
    }

    .status-badge.sent {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-badge.in-progress {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.completed {
      background: #d1fae5;
      color: #065f46;
    }

    .fund-call-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .fund-call-stats .stat {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .fund-call-stats .stat i {
      font-size: 1.5rem;
      color: #3b82f6;
    }

    .fund-call-stats .stat strong {
      display: block;
      color: #1a202c;
      font-size: 1.125rem;
    }

    .fund-call-stats .stat small {
      display: block;
      color: #6b7280;
      font-size: 0.75rem;
    }

    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      transition: width 0.3s;
    }

    .progress-label {
      font-size: 0.875rem;
      color: #6b7280;
      text-align: right;
      margin-bottom: 1rem;
    }

    .fund-call-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .btn-outline-primary {
      background: transparent;
      color: #3b82f6;
      border: 1px solid #3b82f6;
    }

    .btn-outline-primary:hover {
      background: #3b82f6;
      color: white;
    }

    .btn-outline-secondary {
      background: transparent;
      color: #6b7280;
      border: 1px solid #6b7280;
    }

    .btn-outline-secondary:hover {
      background: #6b7280;
      color: white;
    }

    .btn-outline-warning {
      background: transparent;
      color: #f59e0b;
      border: 1px solid #f59e0b;
    }

    .btn-outline-warning:hover {
      background: #f59e0b;
      color: white;
    }

    .empty-state {
      background: white;
      padding: 4rem 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      text-align: center;
    }

    .empty-state i {
      font-size: 4rem;
      color: #d1d5db;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #1a202c;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: #6b7280;
      margin: 0 0 1.5rem 0;
    }
  `]
})
export class FundCallsComponent implements OnInit {
  fundCalls = signal<FundCall[]>([]);
  totalFundCalls = signal(5);
  inProgressCount = signal(2);
  totalAmount = signal(125000);
  collectionRate = signal(87);

  ngOnInit() {
    this.loadFundCalls();
  }

  private loadFundCalls() {
    // Mock data - replace with actual API call
    const mockData: FundCall[] = [
      {
        id: '1',
        copropertyName: 'Résidence Les Jardins du Parc',
        quarter: 'T1',
        year: 2026,
        totalAmount: 28800,
        invoicesCount: 24,
        paidCount: 21,
        status: 'in-progress',
        dueDate: '15/02/2026',
        createdAt: '2026-01-15'
      },
      {
        id: '2',
        copropertyName: 'Résidence Beauséjour',
        quarter: 'T1',
        year: 2026,
        totalAmount: 42000,
        invoicesCount: 35,
        paidCount: 35,
        status: 'completed',
        dueDate: '28/01/2026',
        createdAt: '2026-01-05'
      },
      {
        id: '3',
        copropertyName: 'Résidence Les Chênes',
        quarter: 'T4',
        year: 2025,
        totalAmount: 31500,
        invoicesCount: 28,
        paidCount: 24,
        status: 'in-progress',
        dueDate: '31/12/2025',
        createdAt: '2025-12-01'
      },
      {
        id: '4',
        copropertyName: 'Résidence Le Parc',
        quarter: 'T4',
        year: 2025,
        totalAmount: 22700,
        invoicesCount: 18,
        paidCount: 18,
        status: 'completed',
        dueDate: '15/12/2025',
        createdAt: '2025-11-20'
      },
    ];

    this.fundCalls.set(mockData);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': 'Brouillon',
      'sent': 'Envoyé',
      'in-progress': 'En cours',
      'completed': 'Terminé'
    };
    return labels[status] || status;
  }

  createFundCall() {
    console.log('Create fund call');
    // Implement create fund call logic
  }

  viewDetails(id: string) {
    console.log('View details:', id);
    // Implement view details logic
  }

  downloadReport(id: string) {
    console.log('Download report:', id);
    // Implement download report logic
  }

  sendReminders(id: string) {
    console.log('Send reminders:', id);
    // Implement send reminders logic
  }
}
