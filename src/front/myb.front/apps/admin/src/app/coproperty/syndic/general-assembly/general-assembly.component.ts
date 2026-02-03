import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ModalService, FileDownloadService, ToastService } from '@myb-front/shared-ui';

interface GeneralAssembly {
  id: string;
  title: string;
  type: 'ordinary' | 'extraordinary';
  date: Date;
  status: 'planned' | 'convened' | 'held' | 'cancelled';
  copropertyId: string;
  copropertyName: string;
  location: string;
  attendees: number;
  totalUnits: number;
  resolutions: number;
  votesRequired: number;
  documentsCount: number;
}

@Component({
  selector: 'app-general-assembly',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-md-8">
          <h2 class="mb-1">
            <i class="bi bi-people-fill me-2"></i>
            Assemblées Générales
          </h2>
          <p class="text-muted">Gestion des AG et convocations</p>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" (click)="createAssembly()">
            <i class="bi bi-plus-lg me-2"></i>
            Nouvelle AG
          </button>
        </div>
      </div>

      <!-- Statistics -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="bi bi-calendar-event"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().upcoming }}</div>
              <div class="stat-label">AG à venir</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="bi bi-check-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().held }}</div>
              <div class="stat-label">AG réalisées</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-warning">
              <i class="bi bi-file-earmark-text"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().resolutions }}</div>
              <div class="stat-label">Résolutions</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-info">
              <i class="bi bi-person-check"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().avgAttendance }}%</div>
              <div class="stat-label">Taux présence</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-4">
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="selectedStatus" (change)="filterAssemblies()">
            <option value="all">Tous les statuts</option>
            <option value="planned">Planifiées</option>
            <option value="convened">Convoquées</option>
            <option value="held">Tenues</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="selectedType" (change)="filterAssemblies()">
            <option value="all">Tous les types</option>
            <option value="ordinary">AG Ordinaires</option>
            <option value="extraordinary">AG Extraordinaires</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="selectedYear" (change)="filterAssemblies()">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
        <div class="col-md-3">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Rechercher..."
            [(ngModel)]="searchTerm"
            (input)="filterAssemblies()">
        </div>
      </div>

      <!-- Assemblies List -->
      <div class="row">
        <div class="col-12" *ngFor="let assembly of filteredAssemblies()">
          <div class="assembly-card mb-3">
            <div class="assembly-header">
              <div class="assembly-info">
                <div class="d-flex align-items-center gap-3">
                  <div class="assembly-type" [class.ordinary]="assembly.type === 'ordinary'" 
                       [class.extraordinary]="assembly.type === 'extraordinary'">
                    {{ assembly.type === 'ordinary' ? 'AG Ordinaire' : 'AG Extraordinaire' }}
                  </div>
                  <h5 class="mb-0">{{ assembly.title }}</h5>
                  <span class="badge" 
                        [class.bg-info]="assembly.status === 'planned'"
                        [class.bg-primary]="assembly.status === 'convened'"
                        [class.bg-success]="assembly.status === 'held'"
                        [class.bg-secondary]="assembly.status === 'cancelled'">
                    {{ getStatusLabel(assembly.status) }}
                  </span>
                </div>
                <div class="text-muted mt-1">
                  <i class="bi bi-building me-2"></i>{{ assembly.copropertyName }}
                </div>
              </div>
              <div class="assembly-actions">
                <button class="btn btn-sm btn-outline-primary me-2" (click)="viewAssembly(assembly.id)">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary me-2" (click)="editAssembly(assembly.id)">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="deleteAssembly(assembly.id)">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <div class="assembly-body">
              <div class="row">
                <div class="col-md-3">
                  <div class="info-item">
                    <i class="bi bi-calendar3 text-primary"></i>
                    <div>
                      <div class="info-label">Date</div>
                      <div class="info-value">{{ assembly.date | date:'dd/MM/yyyy HH:mm' }}</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="info-item">
                    <i class="bi bi-geo-alt text-danger"></i>
                    <div>
                      <div class="info-label">Lieu</div>
                      <div class="info-value">{{ assembly.location }}</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="info-item">
                    <i class="bi bi-people text-success"></i>
                    <div>
                      <div class="info-label">Présence</div>
                      <div class="info-value">{{ assembly.attendees }}/{{ assembly.totalUnits }}</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="info-item">
                    <i class="bi bi-file-text text-warning"></i>
                    <div>
                      <div class="info-label">Résolutions</div>
                      <div class="info-value">{{ assembly.resolutions }}</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="info-item">
                    <i class="bi bi-paperclip text-info"></i>
                    <div>
                      <div class="info-label">Documents</div>
                      <div class="info-value">{{ assembly.documentsCount }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="assembly-footer">
              <div class="action-buttons">
                <button class="btn btn-sm btn-outline-primary" *ngIf="assembly.status === 'planned'" 
                        (click)="sendConvocations(assembly.id)">
                  <i class="bi bi-send me-1"></i>
                  Envoyer convocations
                </button>
                <button class="btn btn-sm btn-outline-success" *ngIf="assembly.status === 'convened'" 
                        (click)="startAssembly(assembly.id)">
                  <i class="bi bi-play-circle me-1"></i>
                  Démarrer l'AG
                </button>
                <button class="btn btn-sm btn-outline-info" *ngIf="assembly.status === 'held'" 
                        (click)="viewMinutes(assembly.id)">
                  <i class="bi bi-file-earmark-text me-1"></i>
                  Voir PV
                </button>
                <button class="btn btn-sm btn-outline-secondary" (click)="downloadDocuments(assembly.id)">
                  <i class="bi bi-download me-1"></i>
                  Documents
                </button>
                <button class="btn btn-sm btn-outline-warning" (click)="manageResolutions(assembly.id)">
                  <i class="bi bi-list-check me-1"></i>
                  Résolutions
                </button>
              </div>
              <div class="progress-info" *ngIf="assembly.status === 'convened'">
                <small class="text-muted">
                  <i class="bi bi-clock me-1"></i>
                  {{ getDaysUntil(assembly.date) }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="filteredAssemblies().length === 0">
        <i class="bi bi-calendar-x"></i>
        <h4>Aucune assemblée générale</h4>
        <p>Créez votre première AG pour commencer</p>
        <button class="btn btn-primary" (click)="createAssembly()">
          <i class="bi bi-plus-lg me-2"></i>
          Créer une AG
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

    .assembly-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .assembly-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .assembly-header {
      padding: 20px;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .assembly-type {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .assembly-type.ordinary {
      background: #e3f2fd;
      color: #1976d2;
    }

    .assembly-type.extraordinary {
      background: #fff3e0;
      color: #f57c00;
    }

    .assembly-actions {
      display: flex;
      gap: 8px;
    }

    .assembly-body {
      padding: 20px;
      background: #f8f9fa;
    }

    .info-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .info-item i {
      font-size: 20px;
      margin-top: 2px;
    }

    .info-label {
      font-size: 12px;
      color: #6c757d;
      margin-bottom: 2px;
    }

    .info-value {
      font-weight: 600;
      font-size: 14px;
    }

    .assembly-footer {
      padding: 16px 20px;
      background: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e9ecef;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
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
export class GeneralAssemblyComponent {
  selectedStatus = 'all';
  selectedType = 'all';
  selectedYear = '2026';
  searchTerm = '';

  stats = signal({
    upcoming: 3,
    held: 8,
    resolutions: 42,
    avgAttendance: 78
  });

  assemblies = signal<GeneralAssembly[]>([
    {
      id: '1',
      title: 'Assemblée Générale Ordinaire 2026',
      type: 'ordinary',
      date: new Date('2026-06-15T18:30:00'),
      status: 'convened',
      copropertyId: 'cp1',
      copropertyName: 'Résidence Les Jardins du Parc',
      location: 'Salle polyvalente - Rez-de-chaussée',
      attendees: 18,
      totalUnits: 24,
      resolutions: 12,
      votesRequired: 13,
      documentsCount: 8
    },
    {
      id: '2',
      title: 'AG Extraordinaire - Ravalement Façade',
      type: 'extraordinary',
      date: new Date('2026-03-20T19:00:00'),
      status: 'planned',
      copropertyId: 'cp1',
      copropertyName: 'Résidence Les Jardins du Parc',
      location: 'Salle polyvalente',
      attendees: 0,
      totalUnits: 24,
      resolutions: 3,
      votesRequired: 17,
      documentsCount: 5
    },
    {
      id: '3',
      title: 'Assemblée Générale Ordinaire 2025',
      type: 'ordinary',
      date: new Date('2025-06-10T18:30:00'),
      status: 'held',
      copropertyId: 'cp1',
      copropertyName: 'Résidence Les Jardins du Parc',
      location: 'Salle polyvalente',
      attendees: 20,
      totalUnits: 24,
      resolutions: 15,
      votesRequired: 13,
      documentsCount: 12
    }
  ]);

  filteredAssemblies = signal<GeneralAssembly[]>(this.assemblies());

  filterAssemblies() {
    let filtered = this.assemblies();

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(a => a.status === this.selectedStatus);
    }

    if (this.selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === this.selectedType);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(term) ||
        a.copropertyName.toLowerCase().includes(term)
      );
    }

    this.filteredAssemblies.set(filtered);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      planned: 'Planifiée',
      convened: 'Convoquée',
      held: 'Tenue',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  }

  getDaysUntil(date: Date): string {
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Demain";
    if (days < 0) return `Il y a ${Math.abs(days)} jours`;
    return `Dans ${days} jours`;
  }

  private modalService = inject(ModalService);
  private fileService = inject(FileDownloadService);
  private toastService = inject(ToastService);

  async createAssembly(): Promise<void> {
    const confirmed = await this.modalService.confirm({
      title: 'Nouvelle Assemblée Générale',
      message: '<p>Formulaire de création en cours de développement.</p>',
      confirmButtonText: 'OK',
      showCancelButton: false
    });
  }

  viewAssembly(id: string): void {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    this.modalService.open({
      title: assembly.title,
      message: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Type:</strong> ${assembly.type === 'ordinary' ? 'Ordinaire' : 'Extraordinaire'}</p>
          <p><strong>Date:</strong> ${assembly.date.toLocaleDateString('fr-FR')}</p>
          <p><strong>Lieu:</strong> ${assembly.location}</p>
          <p><strong>Statut:</strong> ${this.getStatusLabel(assembly.status)}</p>
          <p><strong>Participants:</strong> ${assembly.attendees}/${assembly.totalUnits}</p>
          <p><strong>Résolutions:</strong> ${assembly.resolutions}</p>
        </div>
      `,
      size: 'md',
      showCancelButton: false
    });
  }

  async editAssembly(id: string): Promise<void> {
    await this.modalService.alert('Modification', 'Formulaire de modification en cours de développement');
  }

  async deleteAssembly(id: string): Promise<void> {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    const confirmed = await this.modalService.confirm({
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer l'AG "${assembly.title}"?`,
      confirmButtonText: 'Supprimer',
      confirmButtonClass: 'btn-danger'
    });

    if (confirmed) {
      this.assemblies.set(this.assemblies().filter(a => a.id !== id));
      this.toastService.show(
        'L\'assemblée a été supprimée',
        { classname: 'toast-success' }
      );
    }
  }

  async sendConvocations(id: string): Promise<void> {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    const confirmed = await this.modalService.confirm({
      title: 'Envoyer les convocations',
      message: `Envoyer les convocations à tous les copropriétaires pour "${assembly.title}"?`,
      confirmButtonText: 'Envoyer'
    });

    if (confirmed) {
      assembly.status = 'convened';
      this.assemblies.set([...this.assemblies()]);
      this.toastService.show(
        `${assembly.totalUnits} convocations envoyées par email`,
        { classname: 'toast-success' }
      );
    }
  }

  async startAssembly(id: string): Promise<void> {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    assembly.status = 'held';
    this.assemblies.set([...this.assemblies()]);
    this.toastService.show(
      'Session de vote ouverte',
      { classname: 'toast-info' }
    );
  }

  viewMinutes(id: string): void {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    this.fileService.downloadPDF(
      `PV_${assembly.title.replace(/\s+/g, '_')}.pdf`,
      `Procès-verbal ${assembly.title}`
    );
    this.toastService.show('PV téléchargé', { classname: 'toast-success' });
  }

  downloadDocuments(id: string): void {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    this.fileService.downloadPDF(
      `Documents_${assembly.title.replace(/\s+/g, '_')}.pdf`,
      `Documents ${assembly.title}`
    );
    this.toastService.show(`${assembly.documentsCount} documents téléchargés`, { classname: 'toast-success' });
  }

  async manageResolutions(id: string): Promise<void> {
    await this.modalService.alert(
      'Gestion des résolutions',
      'Interface de gestion des résolutions en cours de développement'
    );
  }
}
