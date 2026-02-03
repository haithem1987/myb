import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '@myb-front/shared-ui';

interface MaintenanceRequest {
  id: string;
  title: string;
  category: 'plumbing' | 'electricity' | 'heating' | 'common-areas' | 'other';
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'submitted' | 'acknowledged' | 'in-progress' | 'completed' | 'rejected';
  unitNumber: string;
  submittedDate: Date;
  lastUpdate: Date;
  assignedContractor?: string;
  estimatedCost?: number;
  completionDate?: Date;
  syndicComments?: string;
}

@Component({
  selector: 'app-owner-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-md-8">
          <h2 class="mb-1">
            <i class="bi bi-tools me-2"></i>
            Mes Demandes de Travaux
          </h2>
          <p class="text-muted">Signalez un problème ou suivez vos demandes</p>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="createRequest()">
            <i class="bi bi-plus-lg me-2"></i>
            Nouvelle demande
          </button>
        </div>
      </div>

      <!-- Statistics -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="bi bi-clock-history"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().active }}</div>
              <div class="stat-label">En cours</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="bi bi-check-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().completed }}</div>
              <div class="stat-label">Terminées</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-warning">
              <i class="bi bi-hourglass-split"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().avgDays }}j</div>
              <div class="stat-label">Délai moyen</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-info">
              <i class="bi bi-file-text"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().total }}</div>
              <div class="stat-label">Total demandes</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-4">
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="selectedStatus" (change)="filterRequests()">
            <option value="all">Tous les statuts</option>
            <option value="submitted">Soumises</option>
            <option value="acknowledged">Prises en compte</option>
            <option value="in-progress">En cours</option>
            <option value="completed">Terminées</option>
            <option value="rejected">Rejetées</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="selectedCategory" (change)="filterRequests()">
            <option value="all">Toutes les catégories</option>
            <option value="plumbing">Plomberie</option>
            <option value="electricity">Électricité</option>
            <option value="heating">Chauffage</option>
            <option value="common-areas">Parties communes</option>
            <option value="other">Autre</option>
          </select>
        </div>
      </div>

      <!-- Requests List -->
      <div class="row">
        <div class="col-md-6 mb-4" *ngFor="let request of filteredRequests()">
          <div class="request-card">
            <div class="request-header">
              <div class="d-flex align-items-start justify-content-between">
                <div>
                  <div class="category-badge" [attr.data-category]="request.category">
                    <i class="bi" [class]="getCategoryIcon(request.category)"></i>
                    {{ getCategoryLabel(request.category) }}
                  </div>
                  <h5 class="mt-2 mb-1">{{ request.title }}</h5>
                  <small class="text-muted">Lot {{ request.unitNumber }}</small>
                </div>
                <div class="d-flex flex-column align-items-end gap-2">
                  <span class="badge" 
                        [class.bg-secondary]="request.status === 'submitted'"
                        [class.bg-info]="request.status === 'acknowledged'"
                        [class.bg-primary]="request.status === 'in-progress'"
                        [class.bg-success]="request.status === 'completed'"
                        [class.bg-danger]="request.status === 'rejected'">
                    {{ getStatusLabel(request.status) }}
                  </span>
                  <span class="priority-badge" [attr.data-priority]="request.priority">
                    {{ getPriorityLabel(request.priority) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="request-body">
              <p class="description">{{ request.description }}</p>

              <div class="request-details">
                <div class="detail-item">
                  <i class="bi bi-calendar3 text-primary"></i>
                  <div>
                    <div class="detail-label">Soumise le</div>
                    <div class="detail-value">{{ request.submittedDate | date:'dd/MM/yyyy HH:mm' }}</div>
                  </div>
                </div>

                <div class="detail-item" *ngIf="request.assignedContractor">
                  <i class="bi bi-person-badge text-success"></i>
                  <div>
                    <div class="detail-label">Technicien</div>
                    <div class="detail-value">{{ request.assignedContractor }}</div>
                  </div>
                </div>

                <div class="detail-item" *ngIf="request.estimatedCost">
                  <i class="bi bi-cash text-warning"></i>
                  <div>
                    <div class="detail-label">Coût estimé</div>
                    <div class="detail-value">{{ request.estimatedCost }} €</div>
                  </div>
                </div>
              </div>

              <div class="syndic-comments" *ngIf="request.syndicComments">
                <div class="comments-header">
                  <i class="bi bi-chat-left-text"></i>
                  Commentaire du syndic
                </div>
                <p>{{ request.syndicComments }}</p>
              </div>
            </div>

            <div class="request-footer">
              <small class="text-muted">
                <i class="bi bi-clock-history me-1"></i>
                Dernière mise à jour: {{ request.lastUpdate | date:'dd/MM/yyyy HH:mm' }}
              </small>
              <button class="btn btn-sm btn-outline-primary" (click)="viewDetails(request.id)">
                <i class="bi bi-eye me-1"></i>
                Détails
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="filteredRequests().length === 0">
        <i class="bi bi-tools"></i>
        <h4>Aucune demande de travaux</h4>
        <p>Vous n'avez pas encore soumis de demande</p>
        <button class="btn btn-primary" (click)="createRequest()">
          <i class="bi bi-plus-lg me-2"></i>
          Créer une demande
        </button>
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

    .request-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .request-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .request-header {
      padding: 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .category-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: #e3f2fd;
      color: #1976d2;
    }

    .category-badge[data-category="plumbing"] {
      background: #e3f2fd;
      color: #1976d2;
    }

    .category-badge[data-category="electricity"] {
      background: #fff3e0;
      color: #f57c00;
    }

    .category-badge[data-category="heating"] {
      background: #ffebee;
      color: #d32f2f;
    }

    .category-badge[data-category="common-areas"] {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .priority-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .priority-badge[data-priority="low"] {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .priority-badge[data-priority="normal"] {
      background: #e3f2fd;
      color: #1976d2;
    }

    .priority-badge[data-priority="high"] {
      background: #fff3e0;
      color: #f57c00;
    }

    .priority-badge[data-priority="urgent"] {
      background: #ffebee;
      color: #c62828;
    }

    .request-body {
      padding: 20px;
      flex: 1;
    }

    .description {
      margin-bottom: 16px;
      color: #495057;
    }

    .request-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .detail-item {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .detail-item i {
      font-size: 18px;
      margin-top: 2px;
    }

    .detail-label {
      font-size: 11px;
      color: #6c757d;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .detail-value {
      font-weight: 600;
      font-size: 13px;
    }

    .syndic-comments {
      background: #fff8e1;
      border-left: 3px solid #ffc107;
      padding: 12px;
      border-radius: 4px;
      margin-top: 16px;
    }

    .comments-header {
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f57c00;
    }

    .request-footer {
      padding: 16px 20px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 12px;
    }

    .empty-state i {
      font-size: 64px;
      color: #dee2e6;
      margin-bottom: 20px;
    }

    .empty-state h4 {
      color: #495057;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: #6c757d;
      margin-bottom: 24px;
    }
  `]
})
export class OwnerMaintenanceComponent {
  selectedStatus = 'all';
  selectedCategory = 'all';

  requests = signal<MaintenanceRequest[]>([
    {
      id: '1',
      title: 'Fuite d\'eau salle de bain',
      category: 'plumbing',
      description: 'Fuite importante au niveau du WC. L\'eau s\'infiltre chez le voisin du dessous.',
      priority: 'urgent',
      status: 'in-progress',
      unitNumber: 'A101',
      submittedDate: new Date('2026-01-29T08:30:00'),
      lastUpdate: new Date('2026-01-29T14:00:00'),
      assignedContractor: 'Dupont Plomberie',
      estimatedCost: 350,
      syndicComments: 'Intervention programmée pour aujourd\'hui entre 14h et 17h.'
    },
    {
      id: '2',
      title: 'Ampoule couloir défectueuse',
      category: 'electricity',
      description: 'L\'éclairage du couloir du 1er étage ne fonctionne plus.',
      priority: 'normal',
      status: 'acknowledged',
      unitNumber: 'A101',
      submittedDate: new Date('2026-01-28T16:20:00'),
      lastUpdate: new Date('2026-01-29T09:00:00'),
      syndicComments: 'Prise en compte. Intervention prévue dans les 48h.'
    }
  ]);

  filteredRequests = signal<MaintenanceRequest[]>(this.requests());

  stats = signal({
    active: 2,
    completed: 0,
    avgDays: 3,
    total: 2
  });

  filterRequests() {
    let filtered = this.requests();

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(r => r.status === this.selectedStatus);
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === this.selectedCategory);
    }

    this.filteredRequests.set(filtered);
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      plumbing: 'Plomberie',
      electricity: 'Électricité',
      heating: 'Chauffage',
      'common-areas': 'Parties communes',
      other: 'Autre'
    };
    return labels[category] || category;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      plumbing: 'bi-droplet',
      electricity: 'bi-lightning',
      heating: 'bi-thermometer-half',
      'common-areas': 'bi-building',
      other: 'bi-gear'
    };
    return icons[category] || 'bi-gear';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      submitted: 'Soumise',
      acknowledged: 'Prise en compte',
      'in-progress': 'En cours',
      completed: 'Terminée',
      rejected: 'Rejetée'
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'Basse',
      normal: 'Normale',
      high: 'Haute',
      urgent: 'Urgente'
    };
    return labels[priority] || priority;
  }

  private modalService = inject(ModalService);

  async createRequest(): Promise<void> {
    const confirmed = await this.modalService.confirm({
      title: 'Nouvelle demande de travaux',
      message: '<p>Formulaire de création en cours de développement.</p><p>Cette fonctionnalité permettra de soumettre une demande complète avec photos et description détaillée.</p>',
      confirmButtonText: 'OK',
      showCancelButton: false
    });
  }

  viewDetails(id: string): void {
    const request = this.requests().find(r => r.id === id);
    if (!request) return;

    const statusLabel = this.getStatusLabel(request.status);
    const categoryLabel = this.getCategoryLabel(request.category);
    const priorityLabel = this.getPriorityLabel(request.priority);

    this.modalService.open({
      title: request.title,
      message: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Catégorie:</strong> ${categoryLabel}</p>
          <p><strong>Priorité:</strong> <span class="badge bg-${request.priority === 'urgent' ? 'danger' : request.priority === 'high' ? 'warning' : 'secondary'}">${priorityLabel}</span></p>
          <p><strong>Statut:</strong> <span class="badge bg-${request.status === 'completed' ? 'success' : request.status === 'in-progress' ? 'primary' : 'secondary'}">${statusLabel}</span></p>
          <p><strong>Lot:</strong> ${request.unitNumber}</p>
          <p><strong>Date de soumission:</strong> ${request.submittedDate.toLocaleDateString('fr-FR')}</p>
          <hr/>
          <p><strong>Description:</strong></p>
          <p>${request.description}</p>
          ${request.assignedContractor ? `<p><strong>Artisan assigné:</strong> ${request.assignedContractor}</p>` : ''}
          ${request.estimatedCost ? `<p><strong>Coût estimé:</strong> ${request.estimatedCost.toFixed(2)}€</p>` : ''}
          ${request.syndicComments ? `<hr/><p><strong>Commentaires du syndic:</strong></p><p>${request.syndicComments}</p>` : ''}
        </div>
      `,
      size: 'lg',
      showCancelButton: false,
      confirmButtonText: 'Fermer'
    });
  }
}
