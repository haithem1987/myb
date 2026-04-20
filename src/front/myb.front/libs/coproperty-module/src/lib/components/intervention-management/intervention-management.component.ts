import { Component, Input, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InterventionService } from '../../services/intervention.service';
import { CurrencyService } from '../../services/currency.service';
import { Intervention, CreateInterventionInput, UpdateInterventionInput } from '../../models/intervention.model';

@Component({
  selector: 'myb-intervention-management',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="intervention-management">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">
          <i class="bi bi-wrench-adjustable me-2"></i>
          Interventions
        </h5>
        <button class="btn btn-sm btn-primary btn-violet" (click)="toggleForm()">
          <i class="bi bi-plus-circle me-1"></i>
          {{ showForm() ? 'Annuler' : 'Nouvelle Intervention' }}
        </button>
      </div>

      <!-- Filters -->
      <div class="row g-2 mb-3">
        <div class="col-md-3">
          <select class="form-select form-select-sm" [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
            <option value="">Tous les statuts</option>
            <option value="Draft">Brouillon</option>
            <option value="Planned">Planifié</option>
            <option value="InProgress">En cours</option>
            <option value="Completed">Terminé</option>
            <option value="Cancelled">Annulé</option>
            <option value="Invoiced">Facturé</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select form-select-sm" [(ngModel)]="filterPriority" (ngModelChange)="applyFilters()">
            <option value="">Toutes les priorités</option>
            <option value="Low">Basse</option>
            <option value="Normal">Normale</option>
            <option value="High">Haute</option>
            <option value="Emergency">Urgence</option>
          </select>
        </div>
      </div>

      <!-- Form -->
      <div *ngIf="showForm()" class="card mb-3">
        <div class="card-body">
          <form [formGroup]="form">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">Titre *</label>
                <input type="text" class="form-control" formControlName="title" placeholder="Ex: Réparation fuite">
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold">Type *</label>
                <select class="form-select" formControlName="interventionType">
                  <option value="Plumbing">Plomberie</option>
                  <option value="Electricity">Électricité</option>
                  <option value="Elevator">Ascenseur</option>
                  <option value="Cleaning">Nettoyage</option>
                  <option value="Painting">Peinture</option>
                  <option value="Locksmith">Serrurerie</option>
                  <option value="GardenMaintenance">Jardinage</option>
                  <option value="PestControl">Dératisation</option>
                  <option value="FireSafety">Sécurité incendie</option>
                  <option value="RoofRepair">Toiture</option>
                  <option value="CommonAreaRepair">Parties communes</option>
                  <option value="HeatingCooling">Chauffage/Clim</option>
                  <option value="SecuritySystem">Sécurité</option>
                  <option value="WasteManagement">Gestion déchets</option>
                  <option value="Other">Autre</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label fw-semibold">Priorité *</label>
                <select class="form-select" formControlName="priority">
                  <option value="Low">Basse</option>
                  <option value="Normal">Normale</option>
                  <option value="High">Haute</option>
                  <option value="Emergency">Urgence</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Description *</label>
                <textarea class="form-control" formControlName="description" rows="2"></textarea>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Intervenant</label>
                <input type="text" class="form-control" formControlName="providerName">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Date prévue</label>
                <input type="date" class="form-control" formControlName="plannedDate">
              </div>
              <div class="col-md-4">
                <label class="form-label fw-semibold">Coût estimé</label>
                <div class="input-group">
                  <span class="input-group-text">{{ currencySymbol }}</span>
                  <input type="number" class="form-control" formControlName="estimatedCost" step="0.01" min="0">
                </div>
              </div>
              <div class="col-12">
                <label class="form-label fw-semibold">Notes</label>
                <textarea class="form-control" formControlName="notes" rows="2"></textarea>
              </div>
              <div class="col-12 text-end">
                <button type="button" class="btn btn-secondary me-2" (click)="cancelForm()">Annuler</button>
                <button type="button" class="btn btn-primary btn-violet" (click)="save()"
                        [disabled]="form.invalid || saving()">
                  <span *ngIf="saving()" class="spinner-border spinner-border-sm me-1"></span>
                  {{ editingId ? 'Mettre à jour' : 'Créer' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading()" class="text-center py-3">
        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
      </div>

      <!-- List -->
      <div *ngIf="!isLoading()">
        <div *ngFor="let item of filteredItems()" class="card mb-2 intervention-card">
          <div class="card-body py-2 px-3">
            <div class="d-flex justify-content-between align-items-center">
              <div class="flex-grow-1">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <span class="fw-semibold">{{ item.title }}</span>
                  <span class="badge" [ngClass]="getStatusClass(item.status)">{{ getStatusLabel(item.status) }}</span>
                  <span class="badge" [ngClass]="getPriorityClass(item.priority)">{{ getPriorityLabel(item.priority) }}</span>
                </div>
                <small class="text-muted">
                  {{ getTypeLabel(item.interventionType) }}
                  <span *ngIf="item.providerName"> · {{ item.providerName }}</span>
                  <span *ngIf="item.plannedDate"> · {{ item.plannedDate | date:'dd/MM/yyyy' }}</span>
                  <span *ngIf="item.estimatedCost != null"> · {{ formatAmount(item.estimatedCost!) }}</span>
                </small>
              </div>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary" (click)="edit(item)" title="Modifier">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger" (click)="delete(item)" title="Supprimer">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="filteredItems().length === 0" class="text-center text-muted py-4">
          <i class="bi bi-inbox fs-3 d-block mb-1"></i>
          Aucune intervention
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-violet {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
    }
    .btn-violet:hover {
      background: linear-gradient(135deg, #5a6fd6 0%, #6a4390 100%);
      color: white;
    }
    .intervention-card:hover {
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.12);
    }
  `],
})
export class InterventionManagementComponent implements OnInit, OnDestroy {
  @Input() copropertyId: string | null = null;

  private fb = inject(FormBuilder);

  readonly items = signal<Intervention[]>([]);
  readonly filteredItems = signal<Intervention[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly showForm = signal<boolean>(false);

  filterStatus = '';
  filterPriority = '';
  editingId: string | null = null;
  form!: FormGroup;

  private readonly destroy$ = new Subject<void>();

  get currencySymbol(): string {
    return this.currencyService.symbol;
  }

  constructor(
    private interventionService: InterventionService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.copropertyId) {
      this.loadInterventions();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      interventionType: ['Other', Validators.required],
      priority: ['Normal', Validators.required],
      providerName: [''],
      plannedDate: [''],
      estimatedCost: [null],
      notes: [''],
    });
  }

  private loadInterventions(): void {
    if (!this.copropertyId) return;
    this.isLoading.set(true);

    this.interventionService.getInterventionsByCoproperty(this.copropertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.applyFilters();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading interventions:', err);
          this.isLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    let filtered = [...this.items()];
    if (this.filterStatus) filtered = filtered.filter((i) => i.status === this.filterStatus);
    if (this.filterPriority) filtered = filtered.filter((i) => i.priority === this.filterPriority);
    this.filteredItems.set(filtered);
  }

  toggleForm(): void {
    if (this.showForm()) {
      this.cancelForm();
    } else {
      this.editingId = null;
      this.form.reset({ interventionType: 'Other', priority: 'Normal' });
      this.showForm.set(true);
    }
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId = null;
    this.form.reset({ interventionType: 'Other', priority: 'Normal' });
  }

  edit(item: Intervention): void {
    this.editingId = item.id;
    this.form.patchValue({
      title: item.title,
      description: item.description,
      interventionType: item.interventionType,
      priority: item.priority,
      providerName: item.providerName || '',
      plannedDate: item.plannedDate ? new Date(item.plannedDate).toISOString().split('T')[0] : '',
      estimatedCost: item.estimatedCost,
      notes: item.notes || '',
    });
    this.showForm.set(true);
  }

  save(): void {
    if (this.form.invalid || !this.copropertyId) return;
    this.saving.set(true);
    const val = this.form.value;

    if (this.editingId) {
      const input: UpdateInterventionInput = {
        id: this.editingId,
        copropertyId: this.copropertyId,
        title: val.title,
        description: val.description,
        interventionType: val.interventionType,
        priority: val.priority,
        providerName: val.providerName || undefined,
        plannedDate: val.plannedDate || undefined,
        estimatedCost: val.estimatedCost ?? undefined,
        notes: val.notes || undefined,
      };
      this.interventionService.updateIntervention(input)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { this.saving.set(false); this.cancelForm(); this.loadInterventions(); },
          error: () => this.saving.set(false),
        });
    } else {
      const input: CreateInterventionInput = {
        copropertyId: this.copropertyId,
        title: val.title,
        description: val.description,
        interventionType: val.interventionType,
        priority: val.priority,
        providerName: val.providerName || undefined,
        plannedDate: val.plannedDate || undefined,
        estimatedCost: val.estimatedCost ?? undefined,
        notes: val.notes || undefined,
      };
      this.interventionService.createIntervention(input)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { this.saving.set(false); this.cancelForm(); this.loadInterventions(); },
          error: () => this.saving.set(false),
        });
    }
  }

  delete(item: Intervention): void {
    if (!confirm(`Supprimer l'intervention "${item.title}" ?`)) return;
    this.interventionService.deleteIntervention(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => this.loadInterventions() });
  }

  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount);
  }

  getStatusClass(status: string): string {
    const m: Record<string, string> = { Draft: 'bg-secondary', Planned: 'bg-info', InProgress: 'bg-warning text-dark', Completed: 'bg-success', Cancelled: 'bg-dark', Invoiced: 'bg-primary' };
    return m[status] || 'bg-secondary';
  }
  getStatusLabel(status: string): string {
    const m: Record<string, string> = { Draft: 'Brouillon', Planned: 'Planifié', InProgress: 'En cours', Completed: 'Terminé', Cancelled: 'Annulé', Invoiced: 'Facturé' };
    return m[status] || status;
  }
  getPriorityClass(priority: string): string {
    const m: Record<string, string> = { Low: 'bg-secondary', Normal: 'bg-primary', High: 'bg-warning text-dark', Emergency: 'bg-danger' };
    return m[priority] || 'bg-secondary';
  }
  getPriorityLabel(priority: string): string {
    const m: Record<string, string> = { Low: 'Basse', Normal: 'Normale', High: 'Haute', Emergency: 'Urgence' };
    return m[priority] || priority;
  }
  getTypeLabel(type: string): string {
    const m: Record<string, string> = { Plumbing: 'Plomberie', Electricity: 'Électricité', Elevator: 'Ascenseur', Cleaning: 'Nettoyage', Painting: 'Peinture', Locksmith: 'Serrurerie', GardenMaintenance: 'Jardinage', PestControl: 'Dératisation', FireSafety: 'Sécurité incendie', RoofRepair: 'Toiture', CommonAreaRepair: 'Parties communes', HeatingCooling: 'Chauffage/Clim', SecuritySystem: 'Sécurité', WasteManagement: 'Gestion déchets', Other: 'Autre' };
    return m[type] || type;
  }
}
