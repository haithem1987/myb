import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CommunicationService,
  CampaignDto,
  CreateCampaignDto,
} from 'libs/shared/infra/services/communication.service';

@Component({
  selector: 'app-communication-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="communication-campaigns">
      <div class="page-header d-flex align-items-center justify-content-between mb-4">
        <h4 class="mb-0"><i class="bi bi-megaphone me-2"></i>Campagnes</h4>
        <button class="btn btn-primary btn-sm" (click)="showForm.set(true)" *ngIf="!showForm()">
          <i class="bi bi-plus-lg me-1"></i>Nouvelle campagne
        </button>
      </div>

      <!-- New campaign form -->
      <div class="card mb-4" *ngIf="showForm()">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span><i class="bi bi-send me-2"></i>Nouvelle campagne</span>
          <button type="button" class="btn-close" (click)="cancelForm()"></button>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Nom <span class="text-danger">*</span></label>
              <input class="form-control" [(ngModel)]="draft.name" placeholder="Nom de la campagne">
            </div>
            <div class="col-md-6">
              <label class="form-label">Copropriété (ID)</label>
              <input class="form-control" [(ngModel)]="draft.copropertyId" placeholder="UUID">
            </div>
            <div class="col-12">
              <label class="form-label">Canaux <span class="text-danger">*</span></label>
              <div class="d-flex gap-3">
                <div class="form-check" *ngFor="let ch of availableChannels">
                  <input class="form-check-input" type="checkbox"
                         [id]="'ch-' + ch"
                         [checked]="draft.channels.includes(ch)"
                         (change)="toggleChannel(ch)">
                  <label class="form-check-label" [for]="'ch-' + ch">{{ ch }}</label>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Sujet (Email)</label>
              <input class="form-control" [(ngModel)]="draft.subject" placeholder="Sujet de l'email">
            </div>
            <div class="col-md-6">
              <label class="form-label">Cibles</label>
              <select class="form-select" [(ngModel)]="draft.targetCriteria.mode">
                <option value="all">Tous les résidents</option>
                <option value="managers_only">Gestionnaires uniquement</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label">Message <span class="text-danger">*</span></label>
              <textarea class="form-control" rows="3" [(ngModel)]="draft.message" placeholder="Contenu du message"></textarea>
            </div>
          </div>
          <div class="mt-3 d-flex gap-2">
            <button class="btn btn-primary" (click)="createCampaign()" [disabled]="saving()">
              <span *ngIf="saving()" class="spinner-border spinner-border-sm me-1"></span>
              Créer la campagne
            </button>
            <button class="btn btn-outline-secondary" (click)="cancelForm()">Annuler</button>
          </div>
          <div *ngIf="formError()" class="alert alert-danger mt-2 py-1 small">{{ formError() }}</div>
        </div>
      </div>

      <!-- Campaign list -->
      <div *ngIf="loading()" class="text-center py-4">
        <div class="spinner-border spinner-border-sm text-primary"></div>
      </div>

      <div *ngIf="!loading() && campaigns().length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-megaphone fs-2 d-block mb-2"></i>
        Aucune campagne
      </div>

      <div *ngFor="let c of campaigns()" class="card mb-3">
        <div class="card-body">
          <div class="d-flex align-items-start justify-content-between">
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="fw-semibold">{{ c.name }}</span>
                <span class="badge" [ngClass]="statusBadge(c.status)">{{ c.status }}</span>
                <span *ngFor="let ch of c.channels" class="badge" [ngClass]="channelBadge(ch)">{{ ch }}</span>
              </div>
              <div class="small text-muted mb-2">
                Créée le {{ c.createdAt | date:'dd/MM/yyyy' }}
                <span *ngIf="c.copropertyId"> · {{ c.copropertyId }}</span>
              </div>
              <!-- Progress bar -->
              <div *ngIf="c.totalRecipients > 0" class="mb-1">
                <div class="d-flex justify-content-between small mb-1">
                  <span>{{ c.sentCount }} / {{ c.totalRecipients }} envoyés</span>
                  <span class="text-danger" *ngIf="c.failedCount > 0">{{ c.failedCount }} échecs</span>
                </div>
                <div class="progress" style="height:6px">
                  <div class="progress-bar bg-success" [style.width.%]="(c.sentCount / c.totalRecipients) * 100"></div>
                  <div class="progress-bar bg-danger" [style.width.%]="(c.failedCount / c.totalRecipients) * 100"></div>
                </div>
              </div>
            </div>
            <div class="d-flex gap-2 ms-3">
              <button *ngIf="c.status === 'Draft'" class="btn btn-success btn-sm" (click)="start(c.id)">
                <i class="bi bi-play-fill me-1"></i>Lancer
              </button>
              <button *ngIf="c.status === 'Running' || c.status === 'Scheduled'" class="btn btn-outline-danger btn-sm" (click)="cancel(c.id)">
                <i class="bi bi-stop-fill me-1"></i>Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CommunicationCampaignsComponent implements OnInit {
  private svc = inject(CommunicationService);

  campaigns = signal<CampaignDto[]>([]);
  loading = signal(false);
  showForm = signal(false);
  saving = signal(false);
  formError = signal('');

  availableChannels = ['InApp', 'Push', 'Email'];
  draft: CreateCampaignDto & { copropertyId?: string } = this.emptyDraft();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getCampaigns({ size: 50 }).subscribe({
      next: res => { this.campaigns.set(res.items); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  emptyDraft(): CreateCampaignDto & { copropertyId?: string } {
    return { name: '', channels: [], targetCriteria: { mode: 'all' }, message: '', subject: '', copropertyId: '' };
  }

  cancelForm(): void { this.showForm.set(false); this.draft = this.emptyDraft(); this.formError.set(''); }

  toggleChannel(ch: string): void {
    const idx = this.draft.channels.indexOf(ch);
    if (idx >= 0) this.draft.channels.splice(idx, 1);
    else this.draft.channels.push(ch);
  }

  createCampaign(): void {
    if (!this.draft.name.trim()) { this.formError.set('Le nom est requis.'); return; }
    if (!this.draft.channels.length) { this.formError.set('Sélectionnez au moins un canal.'); return; }
    if (!this.draft.message.trim()) { this.formError.set('Le message est requis.'); return; }
    this.saving.set(true);
    this.formError.set('');
    const payload: CreateCampaignDto = {
      name: this.draft.name,
      description: this.draft.description,
      copropertyId: this.draft.copropertyId || undefined,
      channels: this.draft.channels,
      targetCriteria: this.draft.targetCriteria,
      message: this.draft.message,
      subject: this.draft.subject,
    };
    this.svc.createCampaign(payload).subscribe({
      next: () => { this.saving.set(false); this.cancelForm(); this.load(); },
      error: () => { this.saving.set(false); this.formError.set('Erreur lors de la création.'); },
    });
  }

  start(id: string): void {
    this.svc.startCampaign(id).subscribe({ next: () => this.load(), error: () => {} });
  }

  cancel(id: string): void {
    this.svc.cancelCampaign(id).subscribe({ next: () => this.load(), error: () => {} });
  }

  statusBadge(s: string): string {
    return {
      Draft: 'bg-secondary', Scheduled: 'bg-info text-dark',
      Running: 'bg-primary', Completed: 'bg-success', Cancelled: 'bg-danger',
    }[s] ?? 'bg-light text-dark';
  }

  channelBadge(ch: string): string {
    return { InApp: 'bg-primary bg-opacity-75', Push: 'bg-purple text-white', Email: 'bg-warning text-dark' }[ch] ?? 'bg-secondary';
  }
}
