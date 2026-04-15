import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileDownloadService, ToastService } from '@myb-front/shared-ui';

interface Document {
  id: string;
  name: string;
  type: 'regulation' | 'ag-minutes' | 'contract' | 'technical' | 'financial' | 'other';
  category: string;
  size: number;
  uploadDate: Date;
  copropertyName: string;
}

@Component({
  selector: 'app-owner-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="mb-1">
            <i class="bi bi-file-text me-2"></i>
            Mes Documents
          </h2>
          <p class="text-muted">Accédez à tous les documents de votre copropriété</p>
        </div>
      </div>

      <!-- Statistics -->
      <div class="row mb-4">
        <div class="col-md-2-4">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="bi bi-file-earmark-text"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().regulation }}</div>
              <div class="stat-label">Règlements</div>
            </div>
          </div>
        </div>
        <div class="col-md-2-4">
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="bi bi-file-earmark-check"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().agMinutes }}</div>
              <div class="stat-label">PV d'AG</div>
            </div>
          </div>
        </div>
        <div class="col-md-2-4">
          <div class="stat-card">
            <div class="stat-icon bg-info">
              <i class="bi bi-file-earmark-pdf"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().contracts }}</div>
              <div class="stat-label">Contrats</div>
            </div>
          </div>
        </div>
        <div class="col-md-2-4">
          <div class="stat-card">
            <div class="stat-icon bg-warning">
              <i class="bi bi-file-earmark-bar-graph"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().financial }}</div>
              <div class="stat-label">Financiers</div>
            </div>
          </div>
        </div>
        <div class="col-md-2-4">
          <div class="stat-card">
            <div class="stat-icon bg-secondary">
              <i class="bi bi-files"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().total }}</div>
              <div class="stat-label">Total</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="row mb-4">
        <div class="col-md-3">
          <select class="form-select" [(ngModel)]="selectedType" (change)="filterDocuments()">
            <option value="all">Tous les types</option>
            <option value="regulation">Règlements</option>
            <option value="ag-minutes">PV d'AG</option>
            <option value="contract">Contrats</option>
            <option value="technical">Documents techniques</option>
            <option value="financial">Documents financiers</option>
            <option value="other">Autres</option>
          </select>
        </div>
        <div class="col-md-3">
          <input type="text" class="form-control" placeholder="Rechercher..." 
                 [(ngModel)]="searchTerm" (input)="filterDocuments()">
        </div>
      </div>

      <!-- Documents Grid -->
      <div class="row">
        <div class="col-md-3 mb-4" *ngFor="let doc of filteredDocuments()">
          <div class="document-card">
            <div class="document-icon" [attr.data-type]="doc.type">
              <i class="bi" [class]="getTypeIcon(doc.type)"></i>
            </div>
            <div class="document-body">
              <h6 class="document-name" [title]="doc.name">{{ doc.name }}</h6>
              <div class="document-meta">
                <span class="badge bg-light text-dark mb-2">{{ getCategoryLabel(doc.type) }}</span>
                <div class="meta-item">
                  <i class="bi bi-calendar3"></i>
                  {{ doc.uploadDate | date:'dd/MM/yyyy' }}
                </div>
                <div class="meta-item">
                  <i class="bi bi-file-earmark"></i>
                  {{ formatFileSize(doc.size) }}
                </div>
              </div>
            </div>
            <div class="document-actions">
              <button class="btn btn-sm btn-outline-primary" (click)="viewDocument(doc.id)">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-secondary" (click)="downloadDocument(doc.id)">
                <i class="bi bi-download"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .col-md-2-4 {
      flex: 0 0 auto;
      width: 20%;
    }

    @media (max-width: 768px) {
      .col-md-2-4 {
        width: 50%;
      }
    }

    @media (max-width: 576px) {
      .col-md-2-4 { width: 50%; margin-bottom: 0.5rem; }
      .stat-card { padding: 12px; gap: 10px; }
      .stat-icon { width: 40px; height: 40px; font-size: 18px; }
      .stat-value { font-size: 20px; }
      .stat-label { font-size: 11px; }

      .document-card { padding: 16px; }
      .document-icon { width: 48px; height: 48px; font-size: 22px; margin-bottom: 12px; }
      .document-name { font-size: 14px; min-height: 36px; }
      .document-actions { padding-top: 12px; }
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      height: 100%;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #6c757d;
    }

    .document-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .document-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .document-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin: 0 auto 16px;
      background: #f8f9fa;
      color: #495057;
    }

    .document-icon[data-type="regulation"] {
      background: #e3f2fd;
      color: #1976d2;
    }

    .document-icon[data-type="ag-minutes"] {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .document-icon[data-type="contract"] {
      background: #e1f5fe;
      color: #0288d1;
    }

    .document-icon[data-type="financial"] {
      background: #fff3e0;
      color: #f57c00;
    }

    .document-icon[data-type="technical"] {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .document-body {
      flex: 1;
      text-align: center;
      margin-bottom: 16px;
    }

    .document-name {
      font-weight: 600;
      margin-bottom: 12px;
      min-height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .document-meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .meta-item {
      font-size: 12px;
      color: #6c757d;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .document-actions {
      display: flex;
      gap: 8px;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
    }

    .document-actions button {
      flex: 1;
    }
  `]
})
export class OwnerDocumentsComponent {
  selectedType = 'all';
  searchTerm = '';

  documents = signal<Document[]>([
    {
      id: '1',
      name: 'Règlement de copropriété 2025',
      type: 'regulation',
      category: 'Règlement',
      size: 1240000,
      uploadDate: new Date('2025-01-10'),
      copropertyName: 'Résidence Les Jardins du Parc'
    },
    {
      id: '2',
      name: 'PV AG Ordinaire Juin 2025',
      type: 'ag-minutes',
      category: 'Assemblée Générale',
      size: 850000,
      uploadDate: new Date('2025-06-20'),
      copropertyName: 'Résidence Les Jardins du Parc'
    },
    {
      id: '3',
      name: 'Contrat entretien ascenseurs',
      type: 'contract',
      category: 'Contrat',
      size: 420000,
      uploadDate: new Date('2025-01-05'),
      copropertyName: 'Résidence Les Jardins du Parc'
    },
    {
      id: '4',
      name: 'Bilan financier 2024',
      type: 'financial',
      category: 'Financier',
      size: 980000,
      uploadDate: new Date('2025-02-15'),
      copropertyName: 'Résidence Les Jardins du Parc'
    },
    {
      id: '5',
      name: 'Diagnostic technique global',
      type: 'technical',
      category: 'Technique',
      size: 2100000,
      uploadDate: new Date('2025-03-20'),
      copropertyName: 'Résidence Les Jardins du Parc'
    },
    {
      id: '6',
      name: 'PV AG Extraordinaire Mars 2026',
      type: 'ag-minutes',
      category: 'Assemblée Générale',
      size: 650000,
      uploadDate: new Date('2026-03-25'),
      copropertyName: 'Résidence Les Jardins du Parc'
    }
  ]);

  filteredDocuments = signal<Document[]>(this.documents());

  stats = computed(() => {
    const docs = this.documents();
    const regulation = docs.filter(d => d.type === 'regulation').length;
    const agMinutes = docs.filter(d => d.type === 'ag-minutes').length;
    const contracts = docs.filter(d => d.type === 'contract').length;
    const financial = docs.filter(d => d.type === 'financial').length;
    const total = docs.length;

    return { regulation, agMinutes, contracts, financial, total };
  });

  filterDocuments() {
    let filtered = this.documents();

    if (this.selectedType !== 'all') {
      filtered = filtered.filter(d => d.type === this.selectedType);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d => d.name.toLowerCase().includes(term));
    }

    this.filteredDocuments.set(filtered);
  }

  getCategoryLabel(type: string): string {
    const labels: Record<string, string> = {
      regulation: 'Règlement',
      'ag-minutes': 'PV d\'AG',
      contract: 'Contrat',
      technical: 'Technique',
      financial: 'Financier',
      other: 'Autre'
    };
    return labels[type] || type;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      regulation: 'bi-file-earmark-text',
      'ag-minutes': 'bi-file-earmark-check',
      contract: 'bi-file-earmark-pdf',
      technical: 'bi-file-earmark-code',
      financial: 'bi-file-earmark-bar-graph',
      other: 'bi-file-earmark'
    };
    return icons[type] || 'bi-file-earmark';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private fileService = inject(FileDownloadService);
  private toastService = inject(ToastService);

  viewDocument(id: string): void {
    const doc = this.documents().find(d => d.id === id);
    if (!doc) return;

    this.toastService.show(
      `${doc.name} s'ouvre dans un nouvel onglet`,
      { classname: 'toast-info' }
    );
    
    setTimeout(() => {
      this.fileService.openInNewTab('#');
    }, 500);
  }

  downloadDocument(id: string): void {
    const doc = this.documents().find(d => d.id === id);
    if (!doc) return;

    this.fileService.downloadPDF(doc.name, `Document ${doc.name}`);
    this.toastService.show(
      `${doc.name} téléchargé`,
      { classname: 'toast-success' }
    );
  }
}
