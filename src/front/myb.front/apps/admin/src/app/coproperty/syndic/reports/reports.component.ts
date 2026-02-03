import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, FileDownloadService, ToastService } from '@myb-front/shared-ui';

interface Report {
  id: string;
  title: string;
  type: string;
  period: string;
  generatedDate: string;
  size: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-container">
      <header class="page-header">
        <div>
          <h1>Rapports</h1>
          <p class="subtitle">Consultez et téléchargez vos rapports financiers et de gestion</p>
        </div>
        <button class="btn btn-primary" (click)="generateReport()">
          <i class="bi bi-file-earmark-plus"></i>
          Générer un rapport
        </button>
      </header>

      <div class="report-categories">
        <button 
          class="category-btn" 
          [class.active]="selectedCategory() === 'all'"
          (click)="selectCategory('all')">
          <i class="bi bi-collection"></i>
          Tous les rapports
        </button>
        <button 
          class="category-btn" 
          [class.active]="selectedCategory() === 'financial'"
          (click)="selectCategory('financial')">
          <i class="bi bi-currency-euro"></i>
          Financiers
        </button>
        <button 
          class="category-btn" 
          [class.active]="selectedCategory() === 'management'"
          (click)="selectCategory('management')">
          <i class="bi bi-briefcase"></i>
          Gestion
        </button>
        <button 
          class="category-btn" 
          [class.active]="selectedCategory() === 'assembly'"
          (click)="selectCategory('assembly')">
          <i class="bi bi-people"></i>
          Assemblées
        </button>
      </div>

      <div class="quick-reports">
        <h2>Rapports Rapides</h2>
        <div class="quick-reports-grid">
          <div class="quick-report-card" (click)="generateQuickReport('treasury')">
            <i class="bi bi-cash-stack"></i>
            <h3>Situation de Trésorerie</h3>
            <p>État actuel de la trésorerie</p>
          </div>
          <div class="quick-report-card" (click)="generateQuickReport('unpaid')">
            <i class="bi bi-exclamation-triangle"></i>
            <h3>Impayés</h3>
            <p>Liste des factures impayées</p>
          </div>
          <div class="quick-report-card" (click)="generateQuickReport('charges')">
            <i class="bi bi-receipt"></i>
            <h3>Répartition Charges</h3>
            <p>Détail par copropriété</p>
          </div>
          <div class="quick-report-card" (click)="generateQuickReport('maintenance')">
            <i class="bi bi-tools"></i>
            <h3>Travaux en Cours</h3>
            <p>État d'avancement</p>
          </div>
        </div>
      </div>

      <div class="reports-list">
        <h2>Rapports Générés</h2>
        <div class="reports-grid">
          <div class="report-card" *ngFor="let report of reports()">
            <div class="report-icon" [style.background]="report.color">
              <i [class]="report.icon"></i>
            </div>
            <div class="report-content">
              <h3>{{ report.title }}</h3>
              <div class="report-meta">
                <span class="meta-item">
                  <i class="bi bi-tag"></i>
                  {{ report.type }}
                </span>
                <span class="meta-item">
                  <i class="bi bi-calendar"></i>
                  {{ report.period }}
                </span>
                <span class="meta-item">
                  <i class="bi bi-clock"></i>
                  {{ report.generatedDate }}
                </span>
                <span class="meta-item">
                  <i class="bi bi-file-earmark"></i>
                  {{ report.size }}
                </span>
              </div>
            </div>
            <div class="report-actions">
              <button class="btn-icon" title="Télécharger" (click)="downloadReport(report.id)">
                <i class="bi bi-download"></i>
              </button>
              <button class="btn-icon" title="Voir" (click)="viewReport(report.id)">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn-icon" title="Partager" (click)="shareReport(report.id)">
                <i class="bi bi-share"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="templates-section">
        <h2>Modèles de Rapports</h2>
        <div class="templates-grid">
          <div class="template-card">
            <i class="bi bi-file-earmark-spreadsheet"></i>
            <h3>Rapport Annuel</h3>
            <p>Bilan financier complet</p>
            <button class="btn btn-sm btn-outline-primary">Utiliser</button>
          </div>
          <div class="template-card">
            <i class="bi bi-file-earmark-bar-graph"></i>
            <h3>Rapport Trimestriel</h3>
            <p>Synthèse trimestrielle</p>
            <button class="btn btn-sm btn-outline-primary">Utiliser</button>
          </div>
          <div class="template-card">
            <i class="bi bi-file-earmark-text"></i>
            <h3>PV Assemblée Générale</h3>
            <p>Procès-verbal standardisé</p>
            <button class="btn btn-sm btn-outline-primary">Utiliser</button>
          </div>
          <div class="template-card">
            <i class="bi bi-file-earmark-ruled"></i>
            <h3>État des Charges</h3>
            <p>Détail par copropriété</p>
            <button class="btn btn-sm btn-outline-primary">Utiliser</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
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

    .report-categories {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .category-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e5e7eb;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .category-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .category-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    h2 {
      color: #1a202c;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1.5rem 0;
    }

    .quick-reports {
      margin-bottom: 3rem;
    }

    .quick-reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .quick-report-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .quick-report-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }

    .quick-report-card i {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      display: block;
    }

    .quick-report-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      color: white;
    }

    .quick-report-card p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.875rem;
    }

    .reports-list {
      margin-bottom: 3rem;
    }

    .reports-grid {
      display: grid;
      gap: 1rem;
    }

    .report-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .report-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .report-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .report-icon i {
      font-size: 1.75rem;
      color: white;
    }

    .report-content {
      flex: 1;
    }

    .report-content h3 {
      margin: 0 0 0.75rem 0;
      color: #1a202c;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .report-meta {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .meta-item i {
      font-size: 1rem;
    }

    .report-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 40px;
      height: 40px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f3f4f6;
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .templates-section {
      margin-bottom: 2rem;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .template-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .template-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .template-card i {
      font-size: 3rem;
      color: #3b82f6;
      margin-bottom: 1rem;
    }

    .template-card h3 {
      margin: 0 0 0.5rem 0;
      color: #1a202c;
      font-size: 1.125rem;
    }

    .template-card p {
      color: #6b7280;
      margin: 0 0 1.5rem 0;
      font-size: 0.875rem;
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
  `]
})
export class ReportsComponent {
  selectedCategory = signal('all');
  reports = signal<Report[]>([]);

  constructor() {
    this.loadReports();
  }

  private loadReports() {
    // Mock data
    const mockReports: Report[] = [
      {
        id: '1',
        title: 'Rapport Financier Annuel 2025',
        type: 'Financier',
        period: '2025',
        generatedDate: '03/02/2026',
        size: '2.4 MB',
        icon: 'bi bi-file-earmark-spreadsheet',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      {
        id: '2',
        title: 'État des Charges T4 2025',
        type: 'Gestion',
        period: 'T4 2025',
        generatedDate: '15/01/2026',
        size: '1.8 MB',
        icon: 'bi bi-file-earmark-bar-graph',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      {
        id: '3',
        title: 'PV Assemblée Générale - Les Jardins',
        type: 'Assemblée',
        period: '15/12/2025',
        generatedDate: '20/12/2025',
        size: '856 KB',
        icon: 'bi bi-file-earmark-text',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      },
      {
        id: '4',
        title: 'Rapport Impayés Janvier 2026',
        type: 'Financier',
        period: 'Janvier 2026',
        generatedDate: '01/02/2026',
        size: '425 KB',
        icon: 'bi bi-file-earmark-ruled',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
      },
    ];

    this.reports.set(mockReports);
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    // Filter reports based on category
  }

  private modalService = inject(ModalService);
  private fileService = inject(FileDownloadService);
  private toastService = inject(ToastService);

  async generateReport(): Promise<void> {
    await this.modalService.alert(
      'Générer un rapport',
      'Assistant de génération de rapports en cours de développement'
    );
  }

  generateQuickReport(type: string): void {
    this.toastService.show(
      `Rapport ${type} en cours de génération...`,
      { classname: 'toast-info' }
    );
    
    setTimeout(() => {
      this.fileService.downloadPDF(
        `Rapport_${type}_${new Date().toISOString().split('T')[0]}.pdf`,
        `Rapport ${type}`
      );
      this.toastService.show(
        `Rapport ${type} prêt`,
        { classname: 'toast-success' }
      );
    }, 1000);
  }

  downloadReport(id: string): void {
    const report = this.reports().find(r => r.id === id);
    if (!report) return;

    this.fileService.downloadPDF(
      `${report.title}.pdf`,
      `Rapport ${report.title}`
    );
    this.toastService.show(report.title, { classname: 'toast-success' });
  }

  viewReport(id: string): void {
    const report = this.reports().find(r => r.id === id);
    if (!report) return;

    this.modalService.open({
      title: report.title,
      message: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Type:</strong> ${report.type}</p>
          <p><strong>Période:</strong> ${report.period}</p>
          <p><strong>Taille:</strong> ${report.size}</p>
          <hr/>
          <p>Aperçu du rapport disponible prochainement.</p>
        </div>
      `,
      size: 'lg',
      showCancelButton: false
    });
  }

  async shareReport(id: string): Promise<void> {
    const report = this.reports().find(r => r.id === id);
    if (!report) return;

    const confirmed = await this.modalService.confirm({
      title: 'Partager le rapport',
      message: `Partager "${report.title}" avec tous les copropriétaires?`,
      confirmButtonText: 'Partager'
    });

    if (confirmed) {
      this.toastService.show(
        'Email envoyé aux copropriétaires',
        { classname: 'toast-success' }
      );
    }
  }
}
