import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileDownloadService, ToastService } from '@myb-front/shared-ui';
import { AssemblyService, OwnerService, Assembly as BackendAssembly, Unit } from '../../../index';
import { KeycloakService } from '@myb-front/auth';

interface OwnerAssembly {
  id: string;
  title: string;
  type: 'ordinary' | 'extraordinary';
  date: Date;
  status: 'upcoming' | 'past';
  location: string;
  resolutions: number;
  documentsAvailable: boolean;
  minutesAvailable: boolean;
  copropertyName: string;
}

@Component({
  selector: 'app-owner-general-assembly',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="mb-1">
            <i class="bi bi-people-fill me-2"></i>
            Assemblées Générales
          </h2>
          <p class="text-muted">Consultez les AG et accédez aux documents</p>
        </div>
      </div>

      <!-- Statistics -->
      <div class="row mb-4">
        <div class="col-md-4">
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
        <div class="col-md-4">
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="bi bi-check-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().past }}</div>
              <div class="stat-label">AG passées</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card">
            <div class="stat-icon bg-info">
              <i class="bi bi-file-text"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats().documentsAvailable }}</div>
              <div class="stat-label">Documents disponibles</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Assemblies -->
      <div class="section" *ngIf="upcomingAssemblies().length > 0">
        <h4 class="section-title">
          <i class="bi bi-calendar-event me-2"></i>
          Prochaines assemblées
        </h4>
        <div class="row">
          <div class="col-12 mb-3" *ngFor="let assembly of upcomingAssemblies()">
            <div class="assembly-card upcoming">
              <div class="assembly-header">
                <div>
                  <div class="assembly-type-badge" [class.ordinary]="assembly.type === 'ordinary'"
                       [class.extraordinary]="assembly.type === 'extraordinary'">
                    {{ assembly.type === 'ordinary' ? 'AG Ordinaire' : 'AG Extraordinaire' }}
                  </div>
                  <h5 class="mt-2">{{ assembly.title }}</h5>
                  <p class="text-muted mb-0">{{ assembly.copropertyName }}</p>
                </div>
                <div class="date-badge">
                  <div class="day">{{ assembly.date | date:'dd' }}</div>
                  <div class="month">{{ assembly.date | date:'MMM' }}</div>
                  <div class="year">{{ assembly.date | date:'yyyy' }}</div>
                </div>
              </div>
              <div class="assembly-body">
                <div class="info-grid">
                  <div class="info-item">
                    <i class="bi bi-calendar3"></i>
                    <div>
                      <div class="info-label">Date et heure</div>
                      <div class="info-value">{{ assembly.date | date:'dd/MM/yyyy à HH:mm' }}</div>
                    </div>
                  </div>
                  <div class="info-item">
                    <i class="bi bi-geo-alt"></i>
                    <div>
                      <div class="info-label">Lieu</div>
                      <div class="info-value">{{ assembly.location }}</div>
                    </div>
                  </div>
                  <div class="info-item">
                    <i class="bi bi-list-check"></i>
                    <div>
                      <div class="info-label">Résolutions</div>
                      <div class="info-value">{{ assembly.resolutions }} points à l'ordre du jour</div>
                    </div>
                  </div>
                </div>
                <div class="countdown-banner" *ngIf="getDaysUntil(assembly.date) > 0">
                  <i class="bi bi-clock-history me-2"></i>
                  Dans {{ getDaysUntil(assembly.date) }} jours
                </div>
              </div>
              <div class="assembly-footer">
                <button class="btn btn-sm btn-outline-primary" 
                        *ngIf="assembly.documentsAvailable"
                        (click)="viewDocuments(assembly.id)">
                  <i class="bi bi-file-text me-1"></i>
                  Documents
                </button>
                <button class="btn btn-sm btn-primary" (click)="addToCalendar(assembly.id)">
                  <i class="bi bi-calendar-plus me-1"></i>
                  Ajouter au calendrier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Past Assemblies -->
      <div class="section mt-4">
        <h4 class="section-title">
          <i class="bi bi-clock-history me-2"></i>
          Assemblées passées
        </h4>
        <div class="row">
          <div class="col-md-6 mb-3" *ngFor="let assembly of pastAssemblies()">
            <div class="assembly-card past">
              <div class="assembly-header">
                <div>
                  <div class="assembly-type-badge" [class.ordinary]="assembly.type === 'ordinary'"
                       [class.extraordinary]="assembly.type === 'extraordinary'">
                    {{ assembly.type === 'ordinary' ? 'AG Ordinaire' : 'AG Extraordinaire' }}
                  </div>
                  <h6 class="mt-2 mb-1">{{ assembly.title }}</h6>
                  <small class="text-muted">{{ assembly.date | date:'dd MMMM yyyy' }}</small>
                </div>
              </div>
              <div class="assembly-body">
                <div class="documents-status">
                  <div class="status-item" [class.available]="assembly.minutesAvailable">
                    <i class="bi" [class.bi-check-circle]="assembly.minutesAvailable" 
                       [class.bi-x-circle]="!assembly.minutesAvailable"></i>
                    <span>Procès-verbal</span>
                  </div>
                  <div class="status-item" [class.available]="assembly.documentsAvailable">
                    <i class="bi" [class.bi-check-circle]="assembly.documentsAvailable" 
                       [class.bi-x-circle]="!assembly.documentsAvailable"></i>
                    <span>Documents</span>
                  </div>
                </div>
              </div>
              <div class="assembly-footer">
                <button class="btn btn-sm btn-outline-primary" 
                        *ngIf="assembly.minutesAvailable"
                        (click)="viewMinutes(assembly.id)">
                  <i class="bi bi-file-earmark-text me-1"></i>
                  PV
                </button>
                <button class="btn btn-sm btn-outline-secondary" 
                        *ngIf="assembly.documentsAvailable"
                        (click)="viewDocuments(assembly.id)">
                  <i class="bi bi-files me-1"></i>
                  Documents
                </button>
              </div>
            </div>
          </div>
        </div>
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

    .section-title {
      margin-bottom: 20px;
      color: #212529;
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

    .assembly-card.upcoming {
      border-left: 4px solid #0d6efd;
    }

    .assembly-card.past {
      opacity: 0.95;
    }

    .assembly-header {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #f8f9fa;
    }

    .assembly-type-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .assembly-type-badge.ordinary {
      background: #e3f2fd;
      color: #1976d2;
    }

    .assembly-type-badge.extraordinary {
      background: #fff3e0;
      color: #f57c00;
    }

    .date-badge {
      background: white;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      min-width: 80px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .date-badge .day {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      color: #0d6efd;
    }

    .date-badge .month {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      color: #495057;
    }

    .date-badge .year {
      font-size: 12px;
      color: #6c757d;
    }

    .assembly-body {
      padding: 20px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .info-item i {
      font-size: 20px;
      color: #0d6efd;
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

    .countdown-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
    }

    .documents-status {
      display: flex;
      gap: 20px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6c757d;
    }

    .status-item.available {
      color: #198754;
    }

    .status-item i {
      font-size: 18px;
    }

    .assembly-footer {
      padding: 16px 20px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 8px;
    }

    @media (max-width: 992px) {
      .stat-card { padding: 16px; }
      .stat-icon { width: 44px; height: 44px; font-size: 20px; }
      .stat-value { font-size: 22px; }
      .info-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 576px) {
      .stat-card { padding: 14px; gap: 12px; }
      .stat-icon { width: 40px; height: 40px; font-size: 18px; }
      .stat-value { font-size: 20px; }
      .stat-label { font-size: 12px; }

      .assembly-header {
        flex-direction: column;
        gap: 12px;
        padding: 16px;
      }

      .date-badge {
        align-self: flex-start;
        min-width: 64px;
        padding: 8px;
      }
      .date-badge .day { font-size: 22px; }
      .date-badge .month { font-size: 12px; }

      .assembly-body { padding: 14px; }
      .info-item i { font-size: 18px; }
      .info-value { font-size: 13px; }
      .countdown-banner { padding: 10px; font-size: 14px; }

      .assembly-footer {
        padding: 12px 16px;
        flex-wrap: wrap;
      }
      .assembly-footer .btn { flex: 1; min-width: 120px; font-size: 13px; }

      .documents-status { flex-direction: column; gap: 10px; }
    }
  `]
})
export class OwnerGeneralAssemblyComponent implements OnInit {
  assemblies = signal<OwnerAssembly[]>([]);

  upcomingAssemblies = signal<OwnerAssembly[]>([]);

  pastAssemblies = signal<OwnerAssembly[]>([]);

  stats = computed(() => {
    const assemblies = this.assemblies();
    const upcoming = assemblies.filter(a => a.status === 'upcoming').length;
    const past = assemblies.filter(a => a.status === 'past').length;
    const documentsAvailable = assemblies.filter(a => a.documentsAvailable).length;

    return { upcoming, past, documentsAvailable };
  });

  getDaysUntil(date: Date): number {
    return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  private fileService = inject(FileDownloadService);
  private toastService = inject(ToastService);
  private assemblyService = inject(AssemblyService);
  private ownerService = inject(OwnerService);
  private keycloakService = inject(KeycloakService);
  private unitsById = new Map<string, Unit>();

  ngOnInit(): void {
    this.loadAssembliesForCurrentOwner();
  }

  private loadAssembliesForCurrentOwner(): void {
    const userId = this.getCurrentUserId();

    if (!userId) {
      console.error('OwnerGeneralAssemblyComponent: user ID not available');
      return;
    }

    this.ownerService.getMyUnits(userId).subscribe({
      next: (units) => {
        if (!units || units.length === 0) {
          this.assemblies.set([]);
          this.upcomingAssemblies.set([]);
          this.pastAssemblies.set([]);
          return;
        }

        units.forEach((unit) => this.unitsById.set(unit.id, unit));

        const copropertyIds = Array.from(new Set(units.map(u => u.copropertyId)));

        const observables = copropertyIds.map(id => this.assemblyService.getAssemblies(id));

        // Combine all assemblies across the owner's coproperties
        Promise.all(observables.map(o => o.toPromise())).then(results => {
          const allBackendAssemblies: BackendAssembly[] = [];
          for (const list of results) {
            if (list && Array.isArray(list)) {
              allBackendAssemblies.push(...(list as BackendAssembly[]));
            }
          }

          const uiAssemblies = allBackendAssemblies.map(a => this.mapAssembly(a));

          this.assemblies.set(uiAssemblies);
          const now = new Date();
          this.upcomingAssemblies.set(uiAssemblies.filter(a => a.date > now));
          this.pastAssemblies.set(uiAssemblies.filter(a => a.date <= now));
        }).catch(error => {
          console.error('Error loading assemblies for owner:', error);
        });
      },
      error: (error) => {
        console.error('Error loading owner units for assemblies:', error);
      }
    });
  }

  private getCurrentUserId(): string | null {
    const token = this.keycloakService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null;
      } catch (error) {
        console.error('Error parsing Keycloak token in OwnerGeneralAssemblyComponent:', error);
        return null;
      }
    }
    return null;
  }

  private mapAssembly(assembly: BackendAssembly): OwnerAssembly {
    const date = new Date(assembly.meetingDate);
    const now = new Date();

    const status: 'upcoming' | 'past' = date > now ? 'upcoming' : 'past';
    const type: 'ordinary' | 'extraordinary' = assembly.assemblyType === 'Ordinary' ? 'ordinary' : 'extraordinary';

    const unitExample = this.findAnyUnitForCoproperty(assembly.copropertyId);
    const copropertyName = unitExample ? `Copropriété ${unitExample.copropertyId.substring(0, 8)}` : 'Copropriété';

    return {
      id: assembly.id,
      title: assembly.title,
      type,
      date,
      status,
      location: assembly.location || 'Lieu à définir',
      resolutions: 0,
      documentsAvailable: !!assembly.minutes,
      minutesAvailable: !!assembly.minutes,
      copropertyName
    };
  }

  private findAnyUnitForCoproperty(copropertyId: string): Unit | undefined {
    for (const unit of this.unitsById.values()) {
      if (unit.copropertyId === copropertyId) {
        return unit;
      }
    }
    return undefined;
  }

  viewDocuments(id: string): void {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    this.fileService.downloadPDF(
      `Documents_AG_${assembly.date.toISOString().split('T')[0]}.pdf`,
      `Documents AG ${assembly.title}`
    );
    
    this.toastService.show(
      'Documents de l\'assemblée générale téléchargés',
      { classname: 'toast-success' }
    );
  }

  viewMinutes(id: string): void {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    if (!assembly.minutesAvailable) {
      this.toastService.show(
        'Le procès-verbal n\'est pas encore disponible',
        { classname: 'toast-warning' }
      );
      return;
    }

    this.fileService.downloadPDF(
      `PV_AG_${assembly.date.toISOString().split('T')[0]}.pdf`,
      `PV ${assembly.title}`
    );
    
    this.toastService.show(
      'Procès-verbal de l\'AG téléchargé',
      { classname: 'toast-success' }
    );
  }

  addToCalendar(id: string): void {
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    const endDate = new Date(assembly.date);
    endDate.setHours(endDate.getHours() + 2); // 2 hour meeting

    this.fileService.downloadICS({
      title: assembly.title,
      start: assembly.date,
      end: endDate,
      location: assembly.location,
      description: `Assemblée Générale - ${assembly.resolutions} résolutions à l'ordre du jour`
    });
    
    this.toastService.show(
      'L\'AG a été ajoutée à votre calendrier',
      { classname: 'toast-success' }
    );
  }
}
