import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SignalementService } from '../../../../services/signalement.service';
import { CopropertyService } from '../../../../services/coproperty.service';
import { KeycloakService } from '@myb-front/auth';
import { ToastService } from '@myb-front/shared-ui';
import {
  SIGNALEMENT_TYPE_LABELS,
  SIGNALEMENT_ZONE_LABELS,
  SIGNALEMENT_TYPE_ICONS,
  SIGNALEMENT_ZONE_ICONS,
} from '../../../../models/signalement.model';
import { take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface DropdownOption { value: string; label: string; icon: string; }

@Component({
  selector: 'app-nouveau-signalement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4" style="max-width: 600px;">
      <!-- Header -->
      <div class="d-flex align-items-center mb-4">
        <button class="btn btn-link text-dark p-0 me-3" (click)="cancel()">
          <i class="bi bi-arrow-left fs-5"></i>
        </button>
        <h2 class="mb-0 fw-bold">Nouveau signalement</h2>
      </div>

      <!-- Photo -->
      <div class="photo-upload mb-4" (click)="fileInput.click()">
        <div *ngIf="!photoPreview()" class="photo-placeholder">
          <i class="bi bi-camera fs-2 text-muted"></i>
          <span class="d-block mt-1 text-muted small">Ajouter une photo</span>
        </div>
        <img *ngIf="photoPreview()" [src]="photoPreview() ?? ''" class="photo-preview" alt="Photo signalement">
        <input #fileInput type="file" accept="image/*" hidden (change)="onFileChange($event)">
      </div>

      <!-- Type -->
      <div class="mb-3">
        <label class="form-label fw-semibold">Type</label>
        <div class="custom-select-wrapper" [class.open]="typeDropOpen()">
          <div class="custom-select-trigger" (click)="toggleTypeDropdown()">
            <span *ngIf="!selectedType()">Indiquez le type</span>
            <span *ngIf="selectedType()" class="d-flex align-items-center gap-2">
              <i class="bi" [ngClass]="getTypeIcon(selectedType() ?? '')"></i>
              {{ getTypeLabel(selectedType() ?? '') }}
            </span>
            <i class="bi bi-chevron-down ms-auto"></i>
          </div>
          <div class="custom-dropdown" *ngIf="typeDropOpen()">
            <div class="dropdown-item-row" *ngFor="let opt of typeOptions"
                 (click)="selectType(opt.value)">
              <i class="bi me-2" [ngClass]="opt.icon" style="color: #e07a2f;"></i>
              {{ opt.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Zone -->
      <div class="mb-3">
        <label class="form-label fw-semibold">Zone</label>
        <div class="custom-select-wrapper" [class.open]="zoneDropOpen()">
          <div class="custom-select-trigger" (click)="toggleZoneDropdown()">
            <span *ngIf="!selectedZone()">Indiquez la zone</span>
            <span *ngIf="selectedZone()" class="d-flex align-items-center gap-2">
              <i class="bi" [ngClass]="getZoneIcon(selectedZone() ?? '')"></i>
              {{ getZoneLabel(selectedZone() ?? '') }}
            </span>
            <i class="bi bi-chevron-down ms-auto"></i>
          </div>
          <div class="custom-dropdown" *ngIf="zoneDropOpen()">
            <div class="dropdown-item-row" *ngFor="let opt of zoneOptions"
                 (click)="selectZone(opt.value)">
              <i class="bi me-2" [ngClass]="opt.icon"></i>
              {{ opt.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="mb-4">
        <label class="form-label fw-semibold">Description</label>
        <p class="text-muted small mb-1">Décrivez la situation qui sera envoyé à Sergic et informez votre communauté</p>
        <textarea
          class="form-control"
          rows="4"
          placeholder="Écrivez votre message ici"
          [(ngModel)]="description"
          maxlength="2000">
        </textarea>
        <small class="text-muted">{{ description.length }}/2000</small>
      </div>

      <!-- Actions -->
      <button
        class="btn btn-primary w-100 mb-3 py-3 fw-bold"
        [disabled]="sending() || !isValid()"
        (click)="submit()">
        <span *ngIf="sending()" class="spinner-border spinner-border-sm me-2"></span>
        {{ sending() ? 'Envoi en cours…' : 'Envoyer' }}
      </button>

      <button class="btn btn-link w-100 text-primary fw-semibold" (click)="cancel()">
        Annuler
      </button>
    </div>
  `,
  styles: [`
    .photo-upload {
      border: 2px dashed #d0d5dd;
      border-radius: 12px;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      overflow: hidden;
      background: #fafafa;
    }
    .photo-placeholder { text-align: center; }
    .photo-preview { width: 100%; height: 100%; object-fit: cover; }
    .custom-select-wrapper { position: relative; }
    .custom-select-trigger {
      border: 1px solid #d0d5dd;
      border-radius: 10px;
      padding: 12px 16px;
      background: #f9fafb;
      cursor: pointer;
      display: flex;
      align-items: center;
      font-size: 15px;
      user-select: none;
    }
    .custom-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,.14);
      z-index: 100;
      overflow: hidden;
    }
    .dropdown-item-row {
      padding: 14px 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      font-size: 15px;
      border-bottom: 1px solid #f0f0f0;
    }
    .dropdown-item-row:last-child { border-bottom: none; }
    .dropdown-item-row:hover { background: #f5f7ff; }
    .form-control:focus { border-color: #1a56db; box-shadow: 0 0 0 3px rgba(26,86,219,.15); }
  `]
})
export class NouveauSignalementComponent implements OnInit {
  private signalementService = inject(SignalementService);
  private copropertyService = inject(CopropertyService);
  private keycloakService = inject(KeycloakService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  selectedType = signal<string | null>(null);
  selectedZone = signal<string | null>(null);
  description = '';
  photoPreview = signal<string | null>(null);
  photoFile: File | null = null;

  typeDropOpen = signal(false);
  zoneDropOpen = signal(false);
  sending = signal(false);

  private copropertyId = '';
  private userId = '';
  private reporterName = '';

  typeOptions: DropdownOption[] = Object.entries(SIGNALEMENT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
    icon: SIGNALEMENT_TYPE_ICONS[value] ?? 'bi-three-dots',
  }));

  zoneOptions: DropdownOption[] = Object.entries(SIGNALEMENT_ZONE_LABELS).map(([value, label]) => ({
    value,
    label,
    icon: SIGNALEMENT_ZONE_ICONS[value] ?? 'bi-three-dots',
  }));

  ngOnInit(): void {
    this.loadContext();
  }

  private loadContext(): void {
    try {
      const profile = this.keycloakService.getProfile();
      const firstName = profile?.firstName ?? '';
      const lastName = profile?.lastName ?? '';
      this.reporterName = `${firstName} ${lastName}`.trim() || 'Résident';

      const token = this.keycloakService.getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userId = payload.sub ?? '';
      }
    } catch { /* noop */ }

    this.copropertyService.getCoproperties().pipe(take(1), catchError(() => of([]))).subscribe(cops => {
      if (cops.length) this.copropertyId = cops[0].id;
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.photoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.photoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  selectType(value: string): void {
    this.selectedType.set(value);
    this.typeDropOpen.set(false);
  }

  selectZone(value: string): void {
    this.selectedZone.set(value);
    this.zoneDropOpen.set(false);
  }

  toggleTypeDropdown(): void { this.typeDropOpen.update(v => !v); }
  toggleZoneDropdown(): void { this.zoneDropOpen.update(v => !v); }

  isValid(): boolean {
    return !!this.selectedType() && !!this.selectedZone() && this.description.trim().length > 0;
  }

  submit(): void {
    if (!this.isValid() || this.sending()) return;
    this.sending.set(true);

    this.signalementService.createSignalement({
      copropertyId: this.copropertyId,
      reportedBy: this.userId,
      reporterName: this.reporterName,
      type: this.selectedType() ?? '',
      zone: this.selectedZone() ?? '',
      description: this.description.trim(),
      photoUrl: this.photoPreview() ?? undefined,
    }).pipe(
      take(1),
      catchError((err) => {
        console.error('Signalement error', err);
        this.toastService.show('Erreur lors de l\'envoi du signalement', { classname: 'bg-danger text-light' });
        this.sending.set(false);
        return of(null);
      })
    ).subscribe(result => {
      this.sending.set(false);
      if (result) {
        this.toastService.show('Signalement envoyé avec succès', { classname: 'bg-success text-light' });
        this.router.navigate(['../'], { relativeTo: undefined });
        this.router.navigate(['/coproperty/owner/signalements']);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/coproperty/owner/signalements']);
  }

  getTypeLabel(value: string): string { return SIGNALEMENT_TYPE_LABELS[value] ?? value; }
  getZoneLabel(value: string): string { return SIGNALEMENT_ZONE_LABELS[value] ?? value; }
  getTypeIcon(value: string): string { return SIGNALEMENT_TYPE_ICONS[value] ?? 'bi-three-dots'; }
  getZoneIcon(value: string): string { return SIGNALEMENT_ZONE_ICONS[value] ?? 'bi-three-dots'; }
}
