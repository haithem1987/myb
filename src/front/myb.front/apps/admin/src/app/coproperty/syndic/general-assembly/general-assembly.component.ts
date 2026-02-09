import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalService, FileDownloadService, ToastService } from '@myb-front/shared-ui';
import { AssemblyService, CopropertyService } from '@myb-front/coproperty-module';
import { Assembly, AssemblyType, AssemblyStatus, CreateAssemblyInput, Coproperty } from '@myb-front/coproperty-module';

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
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
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
          <button 
            class="btn btn-primary" 
            (click)="createAssembly()"
            [disabled]="!copropertyId">
            <i class="bi bi-plus-lg me-2"></i>
            Nouvelle AG
          </button>
          <small class="d-block text-danger mt-1" *ngIf="!copropertyId">
            Veuillez sélectionner une copropriété
          </small>
        </div>
      </div>

      <!-- Coproperty Selector -->
      <div class="row mb-4" *ngIf="!copropertyId || availableCoproperties().length > 1">
        <div class="col-12">
          <div class="alert alert-info">
            <i class="bi bi-building me-2"></i>
            <strong>Sélectionnez une copropriété :</strong>
            <select 
              class="form-select form-select-sm d-inline-block w-auto ms-3"
              [(ngModel)]="selectedCopropertyId"
              (change)="onCopropertyChange()">
              <option value="">-- Sélectionner --</option>
              <option *ngFor="let copro of availableCoproperties()" [value]="copro.id">
                {{ copro.name }} - {{ copro.city }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Create/Edit Form -->
      <div class="row mb-4" *ngIf="showForm()">
        <div class="col-12">
          <!-- Warning si pas de coproperty -->
          <div class="alert alert-danger mb-3" *ngIf="!copropertyId">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Erreur:</strong> Aucune copropriété sélectionnée. Veuillez sélectionner une copropriété d'abord.
          </div>

          <div class="card shadow-sm">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi me-2" [ngClass]="isEditing() ? 'bi-pencil' : 'bi-plus-circle'"></i>
                {{ isEditing() ? 'Modifier l\'Assemblée Générale' : 'Nouvelle Assemblée Générale' }}
              </h5>
            </div>
            <div class="card-body">
              <form [formGroup]="assemblyForm" (ngSubmit)="saveAssembly()">
                <div class="row">
                  <!-- Title -->
                  <div class="col-md-8 mb-3">
                    <label for="title" class="form-label">
                      Titre de l'AG <span class="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      class="form-control"
                      id="title"
                      formControlName="title"
                      placeholder="Ex: Assemblée Générale Ordinaire 2026"
                      [class.is-invalid]="assemblyForm.get('title')?.invalid && assemblyForm.get('title')?.touched"
                    />
                    <div class="invalid-feedback">
                      Le titre est requis (minimum 3 caractères)
                    </div>
                  </div>

                  <!-- Type -->
                  <div class="col-md-4 mb-3">
                    <label for="assemblyType" class="form-label">
                      Type <span class="text-danger">*</span>
                    </label>
                    <select class="form-select" id="assemblyType" formControlName="assemblyType">
                      <option value="Ordinary">AG Ordinaire</option>
                      <option value="Extraordinary">AG Extraordinaire</option>
                    </select>
                  </div>

                  <!-- Date -->
                  <div class="col-md-4 mb-3">
                    <label for="meetingDate" class="form-label">
                      Date <span class="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      class="form-control"
                      id="meetingDate"
                      formControlName="meetingDate"
                      [class.is-invalid]="assemblyForm.get('meetingDate')?.invalid && assemblyForm.get('meetingDate')?.touched"
                    />
                    <div class="invalid-feedback">
                      La date est requise
                    </div>
                  </div>

                  <!-- Time -->
                  <div class="col-md-4 mb-3">
                    <label for="meetingTime" class="form-label">
                      Heure <span class="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      class="form-control"
                      id="meetingTime"
                      formControlName="meetingTime"
                      [class.is-invalid]="assemblyForm.get('meetingTime')?.invalid && assemblyForm.get('meetingTime')?.touched"
                    />
                    <div class="invalid-feedback">
                      L'heure est requise
                    </div>
                  </div>

                  <!-- Location -->
                  <div class="col-md-4 mb-3">
                    <label for="location" class="form-label">
                      Lieu <span class="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      class="form-control"
                      id="location"
                      formControlName="location"
                      placeholder="Ex: Salle polyvalente"
                      [class.is-invalid]="assemblyForm.get('location')?.invalid && assemblyForm.get('location')?.touched"
                    />
                    <div class="invalid-feedback">
                      Le lieu est requis
                    </div>
                  </div>

                  <!-- Agenda -->
                  <div class="col-12 mb-3">
                    <label for="agenda" class="form-label">
                      Ordre du jour
                    </label>
                    <textarea
                      class="form-control"
                      id="agenda"
                      formControlName="agenda"
                      rows="4"
                      placeholder="Détails de l'ordre du jour..."
                    ></textarea>
                  </div>
                </div>

                <!-- Validation Errors -->
                <div *ngIf="assemblyForm.invalid && assemblyForm.dirty" class="alert alert-warning mb-3">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  <strong>Veuillez remplir tous les champs requis :</strong>
                  <ul class="mb-0 mt-2 ms-3">
                    <li *ngIf="assemblyForm.get('title')?.invalid && assemblyForm.get('title')?.touched">
                      Titre requis (minimum 3 caractères)
                    </li>
                    <li *ngIf="assemblyForm.get('meetingDate')?.invalid && assemblyForm.get('meetingDate')?.touched">
                      Date requise
                    </li>
                    <li *ngIf="assemblyForm.get('meetingTime')?.invalid && assemblyForm.get('meetingTime')?.touched">
                      Heure requise
                    </li>
                    <li *ngIf="assemblyForm.get('location')?.invalid && assemblyForm.get('location')?.touched">
                      Lieu requis
                    </li>
                    <li *ngIf="assemblyForm.get('assemblyType')?.invalid">
                      Type d'assemblée requis
                    </li>
                  </ul>
                </div>

                <!-- Actions -->
                <div class="d-flex gap-2">
                  <button 
                    type="submit" 
                    class="btn btn-success" 
                    [disabled]="assemblyForm.invalid || loading() || !copropertyId">
                    <i class="bi bi-{{ loading() ? 'hourglass-split' : 'save' }} me-1"></i>
                    {{ isEditing() ? 'Modifier' : 'Créer' }}
                  </button>
                  <button type="button" class="btn btn-secondary" (click)="cancelForm()" [disabled]="loading()">
                    <i class="bi bi-x me-1"></i>
                    Annuler
                  </button>
                  <button type="button" class="btn btn-info btn-sm" (click)="debugForm()">
                    <i class="bi bi-bug me-1"></i>
                    Debug
                  </button>
                </div>
              </form>
            </div>
          </div>
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
        <!-- Empty State -->
        <div class="col-12" *ngIf="filteredAssemblies().length === 0 && !loading()">
          <div class="empty-state">
            <i class="bi bi-calendar-x"></i>
            <h4>Aucune assemblée générale</h4>
            <p *ngIf="!copropertyId">Veuillez sélectionner une copropriété</p>
            <p *ngIf="copropertyId">Créez votre première assemblée générale pour commencer</p>
            <button class="btn btn-primary" *ngIf="copropertyId" (click)="createAssembly()">
              <i class="bi bi-plus-lg me-2"></i>
              Créer une AG
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div class="col-12 text-center py-5" *ngIf="loading()">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
          </div>
          <p class="mt-3 text-muted">Chargement des assemblées...</p>
        </div>

        <!-- Assemblies Cards -->
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
export class GeneralAssemblyComponent implements OnInit {
  private modalService = inject(ModalService);
  private fileService = inject(FileDownloadService);
  private toastService = inject(ToastService);
  private assemblyService = inject(AssemblyService);
  private copropertyService = inject(CopropertyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  selectedStatus = 'all';
  selectedType = 'all';
  selectedYear = '2026';
  searchTerm = '';
  copropertyId: string | null = null;
  selectedCopropertyId: string = '';
  showForm = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentAssemblyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  availableCoproperties = signal<Coproperty[]>([]);

  assemblyForm: FormGroup;

  stats = signal({
    upcoming: 0,
    held: 0,
    resolutions: 0,
    avgAttendance: 0
  });

  assemblies = signal<GeneralAssembly[]>([]);

  filteredAssemblies = signal<GeneralAssembly[]>([]);

  constructor() {
    this.assemblyForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      assemblyType: ['Ordinary', Validators.required],
      meetingDate: ['', Validators.required],
      meetingTime: ['18:30', Validators.required],
      location: ['', Validators.required],
      agenda: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.copropertyId = params['copropertyId'] || null;
      if (this.copropertyId) {
        this.loadAssemblies();
      }
    });

    this.loadCoproperties();
  }

  loadCoproperties(): void {
    this.copropertyService.getCoproperties().subscribe({
      next: (coproperties) => {
        this.availableCoproperties.set(coproperties);
        // Auto-select if only one exists and none selected yet
        if (coproperties.length === 1 && !this.copropertyId) {
          this.selectedCopropertyId = coproperties[0].id;
          this.onCopropertyChange();
        } else if (this.copropertyId) {
          this.selectedCopropertyId = this.copropertyId;
        }
      },
      error: (error) => {
        console.error('Error loading coproperties:', error);
        this.toastService.show('Erreur lors du chargement des copropriétés', { classname: 'toast-danger' });
      }
    });
  }

  onCopropertyChange(): void {
    if (this.selectedCopropertyId) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { copropertyId: this.selectedCopropertyId },
        queryParamsHandling: 'merge'
      });
    }
  }

  loadAssemblies(): void {
    if (!this.copropertyId) return;
    
    this.loading.set(true);
    this.assemblyService.getAssemblies(this.copropertyId).subscribe({
      next: (assemblies) => {
        // Transform real data to match the UI format
        const transformedAssemblies = assemblies.map(a => this.transformAssembly(a));
        this.assemblies.set(transformedAssemblies);
        this.filteredAssemblies.set(transformedAssemblies);
        this.calculateStats(transformedAssemblies);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading assemblies:', error);
        this.toastService.show('Erreur lors du chargement des assemblées', { classname: 'toast-danger' });
        this.loading.set(false);
      }
    });
  }

  transformAssembly(assembly: Assembly): GeneralAssembly {
    return {
      id: assembly.id,
      title: assembly.title,
      type: assembly.assemblyType === AssemblyType.ORDINARY ? 'ordinary' : 'extraordinary',
      date: new Date(assembly.meetingDate),
      status: this.mapStatus(assembly.status),
      copropertyId: assembly.copropertyId,
      copropertyName: '', // Will be populated from coproperty data
      location: assembly.location || 'Non défini',
      attendees: assembly.attendances?.filter(a => a.isPresent).length || 0,
      totalUnits: assembly.attendances?.length || 0,
      resolutions: 0, // Will be added later
      votesRequired: 0,
      documentsCount: 0
    };
  }

  mapStatus(status: AssemblyStatus): 'planned' | 'convened' | 'held' | 'cancelled' {
    switch (status) {
      case AssemblyStatus.SCHEDULED: return 'planned';
      case AssemblyStatus.IN_PROGRESS: return 'convened';
      case AssemblyStatus.COMPLETED: return 'held';
      case AssemblyStatus.CANCELLED: return 'cancelled';
      default: return 'planned';
    }
  }

  calculateStats(assemblies: GeneralAssembly[]): void {
    const now = new Date();
    const upcoming = assemblies.filter(a => a.date > now && a.status !== 'cancelled').length;
    const held = assemblies.filter(a => a.status === 'held').length;
    const totalResolutions = assemblies.reduce((sum, a) => sum + a.resolutions, 0);
    const avgAttendance = assemblies.length > 0
      ? Math.round(assemblies.reduce((sum, a) => sum + (a.attendees / (a.totalUnits || 1) * 100), 0) / assemblies.length)
      : 0;

    this.stats.set({
      upcoming,
      held,
      resolutions: totalResolutions,
      avgAttendance
    });
  }

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

  showAddForm(): void {
    this.isEditing.set(false);
    this.currentAssemblyId.set(null);
    this.assemblyForm.reset({
      title: '',
      assemblyType: 'Ordinary',
      meetingDate: '',
      meetingTime: '18:30',
      location: '',
      agenda: ''
    });
    this.showForm.set(true);
  }

  createAssembly(): void {
    this.showAddForm();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.assemblyForm.reset();
  }

  saveAssembly(): void {
    // Debug: log form status
    console.log('=== FORM DEBUG ===');
    console.log('Form valid:', this.assemblyForm.valid);
    console.log('Form value:', this.assemblyForm.value);
    console.log('CopropertyId:', this.copropertyId);
    console.log('Form errors:', this.getFormValidationErrors());
    console.log('=================');
    
    if (this.assemblyForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.assemblyForm.controls).forEach(key => {
        this.assemblyForm.get(key)?.markAsTouched();
      });
      this.toastService.show('Formulaire invalide - vérifiez les champs', { classname: 'toast-warning' });
      return;
    }
    
    if (!this.copropertyId) {
      this.toastService.show('Copropriété non sélectionnée', { classname: 'toast-danger' });
      return;
    }

    const formValue = this.assemblyForm.value;
    const meetingDateTime = this.combineDateAndTime(formValue.meetingDate, formValue.meetingTime);

    const input: CreateAssemblyInput = {
      copropertyId: this.copropertyId,
      title: formValue.title,
      meetingDate: meetingDateTime,
      location: formValue.location,
      agenda: formValue.agenda,
      assemblyType: formValue.assemblyType === 'Ordinary' ? AssemblyType.ORDINARY : AssemblyType.EXTRAORDINARY
    };

    this.loading.set(true);

    if (this.isEditing() && this.currentAssemblyId()) {
      this.assemblyService.updateAssembly(this.currentAssemblyId()!, input).subscribe({
        next: () => {
          this.toastService.show('Assemblée générale modifiée avec succès', { classname: 'toast-success' });
          this.loadAssemblies();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error updating assembly:', error);
          this.toastService.show('Erreur lors de la modification', { classname: 'toast-danger' });
          this.loading.set(false);
        }
      });
    } else {
      this.assemblyService.createAssembly(input).subscribe({
        next: () => {
          this.toastService.show('Assemblée générale créée avec succès', { classname: 'toast-success' });
          this.loadAssemblies();
          this.cancelForm();
        },
        error: (error) => {
          console.error('Error creating assembly:', error);
          this.toastService.show('Erreur lors de la création', { classname: 'toast-danger' });
          this.loading.set(false);
        }
      });
    }
  }

  combineDateAndTime(dateStr: string, timeStr: string): Date {
    const date = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  }

  getFormValidationErrors(): any {
    const errors: any = {};
    Object.keys(this.assemblyForm.controls).forEach(key => {
      const control = this.assemblyForm.get(key);
      if (control && control.errors) {
        errors[key] = {
          errors: control.errors,
          value: control.value,
          valid: control.valid,
          touched: control.touched,
          dirty: control.dirty
        };
      }
    });
    return errors;
  }

  debugForm(): void {
    console.log('=== FORM DEBUG (Manual) ===');
    console.log('Form valid:', this.assemblyForm.valid);
    console.log('Form invalid:', this.assemblyForm.invalid);
    console.log('Form value:', this.assemblyForm.value);
    console.log('CopropertyId:', this.copropertyId);
    console.log('All controls status:');
    Object.keys(this.assemblyForm.controls).forEach(key => {
      const control = this.assemblyForm.get(key);
      console.log(`  ${key}:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
        touched: control?.touched,
        dirty: control?.dirty
      });
    });
    console.log('Form errors:', this.getFormValidationErrors());
    console.log('==========================');
    
    alert('Check console for debug info');
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
    const assembly = this.assemblies().find(a => a.id === id);
    if (!assembly) return;

    this.isEditing.set(true);
    this.currentAssemblyId.set(id);

    // Extract time from date
    const date = new Date(assembly.date);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);

    this.assemblyForm.patchValue({
      title: assembly.title,
      assemblyType: assembly.type === 'ordinary' ? 'Ordinary' : 'Extraordinary',
      meetingDate: dateStr,
      meetingTime: timeStr,
      location: assembly.location,
      agenda: '' // Will need to fetch from backend
    });

    this.showForm.set(true);
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
      this.loading.set(true);
      this.assemblyService.deleteAssembly(id).subscribe({
        next: () => {
          this.toastService.show('L\'assemblée a été supprimée', { classname: 'toast-success' });
          this.loadAssemblies();
        },
        error: (error) => {
          console.error('Error deleting assembly:', error);
          this.toastService.show('Erreur lors de la suppression', { classname: 'toast-danger' });
          this.loading.set(false);
        }
      });
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
