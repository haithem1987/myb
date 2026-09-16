import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SignalementService } from '../../../../services/signalement.service';
import { CopropertyService } from '../../../../services/coproperty.service';
import { OwnerService } from '../../../../services/owner.service';
import { Coproperty } from '../../../../models/coproperty.models';
import { KeycloakService } from '@myb-front/auth';
import { ToastService } from '@myb-front/shared-ui';
import {
  SIGNALEMENT_TYPE_LABELS,
  SIGNALEMENT_ZONE_LABELS,
  SIGNALEMENT_TYPE_ICONS,
  SIGNALEMENT_ZONE_ICONS,
} from '../../../../models/signalement.model';
import { take, catchError, map, switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

interface DropdownOption { value: string; label: string; icon: string; }

@Component({
  selector: 'app-nouveau-signalement',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="container py-4" style="max-width: 600px;">
      <!-- Header -->
      <div class="d-flex align-items-center mb-4">
        <button class="btn btn-link text-dark p-0 me-3" (click)="cancel()">
          <i class="bi bi-arrow-left fs-5"></i>
        </button>
        <h2 class="mb-0 fw-bold">{{ 'ownerFixes.newReport' | translate }}</h2>
      </div>

      <!-- Photo -->
      <div class="photo-upload mb-4" (click)="fileInput.click()">
        <div *ngIf="!photoPreview()" class="photo-placeholder">
          <i class="bi bi-camera fs-2 text-muted"></i>
          <span class="d-block mt-1 text-muted small">{{ 'ownerFixes.addAPhoto' | translate }}</span>
        </div>
        <img *ngIf="photoPreview()" [src]="photoPreview() ?? ''" class="photo-preview" alt="Photo signalement">
        <input #fileInput type="file" accept="image/*" hidden (change)="onFileChange($event)">
      </div>

      <!-- Type -->
      <div class="mb-3" *ngIf="assignedCoproperties().length > 0">
        <label class="form-label fw-semibold">{{ 'ownerFixes.coproperty' | translate }}</label>
        <select
          class="form-select"
          [ngModel]="selectedCopropertyId()"
          (ngModelChange)="selectedCopropertyId.set($event)">
          <option *ngFor="let coproperty of assignedCoproperties()" [value]="coproperty.id">
            {{ coproperty.name }}
          </option>
        </select>
      </div>

      <div class="alert alert-warning" *ngIf="!contextLoading() && assignedCoproperties().length === 0">
        {{ 'ownerFixes.noActiveUnitIsAssignedToYouContactYour' | translate }}
      </div>

      <div class="mb-3">
        <label class="form-label fw-semibold">{{ 'ownerFixes.type' | translate }}</label>
        <div class="custom-select-wrapper" [class.open]="typeDropOpen()">
          <div class="custom-select-trigger" (click)="toggleTypeDropdown()">
            <span *ngIf="!selectedType()">{{ 'ownerFixes.selectAType' | translate }}</span>
            <span *ngIf="selectedType()" class="d-flex align-items-center gap-2">
              <i class="bi" [ngClass]="getTypeIcon(selectedType() ?? '')"></i>
              {{ ('managerReports.types.' + selectedType()) | translate }}
            </span>
            <i class="bi bi-chevron-down ms-auto"></i>
          </div>
          <div class="custom-dropdown" *ngIf="typeDropOpen()">
            <div class="dropdown-item-row" *ngFor="let opt of typeOptions"
                 (click)="selectType(opt.value)">
              <i class="bi me-2" [ngClass]="opt.icon" style="color: #e07a2f;"></i>
              {{ ('managerReports.types.' + opt.value) | translate }}
            </div>
          </div>
        </div>
      </div>

      <!-- Zone -->
      <div class="mb-3">
        <label class="form-label fw-semibold">{{ 'ownerFixes.area' | translate }}</label>
        <div class="custom-select-wrapper" [class.open]="zoneDropOpen()">
          <div class="custom-select-trigger" (click)="toggleZoneDropdown()">
            <span *ngIf="!selectedZone()">{{ 'ownerFixes.selectAnArea' | translate }}</span>
            <span *ngIf="selectedZone()" class="d-flex align-items-center gap-2">
              <i class="bi" [ngClass]="getZoneIcon(selectedZone() ?? '')"></i>
              {{ ('managerReports.zones.' + selectedZone()) | translate }}
            </span>
            <i class="bi bi-chevron-down ms-auto"></i>
          </div>
          <div class="custom-dropdown" *ngIf="zoneDropOpen()">
            <div class="dropdown-item-row" *ngFor="let opt of zoneOptions"
                 (click)="selectZone(opt.value)">
              <i class="bi me-2" [ngClass]="opt.icon"></i>
              {{ ('managerReports.zones.' + opt.value) | translate }}
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="mb-4">
        <label class="form-label fw-semibold">{{ 'ownerFixes.description' | translate }}</label>
        <p class="text-muted small mb-1">{{ 'ownerFixes.describeTheSituationToYourPropertyManagerAndInform' | translate }}</p>
        <textarea
          class="form-control"
          rows="4"
          [placeholder]="'ownerFixes.writeYourMessageHere' | translate"
          [(ngModel)]="description"
          maxlength="2000">
        </textarea>
        <small class="text-muted">{{ description.length }}/2000</small>
      </div>

      <!-- Actions -->
      <button
        class="btn btn-primary w-100 mb-3 py-3 fw-bold"
        [disabled]="sending() || contextLoading() || !isValid()"
        (click)="submit()">
        <span *ngIf="sending()" class="spinner-border spinner-border-sm me-2"></span>
        {{ (sending() ? 'ownerFixes.sending' : 'ownerFixes.send') | translate }}
      </button>

      <button class="btn btn-link w-100 text-primary fw-semibold" (click)="cancel()">
        {{ 'ownerFixes.cancel' | translate }}
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
  private ownerService = inject(OwnerService);
  private keycloakService = inject(KeycloakService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  selectedType = signal<string | null>(null);
  selectedZone = signal<string | null>(null);
  description = '';
  photoPreview = signal<string | null>(null);
  photoFile: File | null = null;

  typeDropOpen = signal(false);
  zoneDropOpen = signal(false);
  sending = signal(false);

  assignedCoproperties = signal<Coproperty[]>([]);
  selectedCopropertyId = signal('');
  contextLoading = signal(true);
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
    const profile = this.keycloakService.getProfile();
    const firstName = profile?.firstName ?? '';
    const lastName = profile?.lastName ?? '';
    this.reporterName = `${firstName} ${lastName}`.trim() || 'Résident';
    this.userId = this.keycloakService.getUserId() ?? profile?.id ?? '';

    if (!this.userId) {
      this.contextLoading.set(false);
      return;
    }

    this.ownerService.getMyUnits(this.userId).pipe(
      take(1),
      map(units => [...new Set(units.map(unit => unit.copropertyId))]),
      switchMap(copropertyIds => copropertyIds.length === 0
        ? of([] as Coproperty[])
        : forkJoin(copropertyIds.map(id =>
            this.copropertyService.getCoproperty(id).pipe(
              take(1),
              catchError(() => of(null))
            )
          )).pipe(
            map(coproperties => coproperties.filter(
              (coproperty): coproperty is Coproperty => coproperty !== null
            ))
          )),
      catchError(() => of([] as Coproperty[]))
    ).subscribe(coproperties => {
      this.assignedCoproperties.set(coproperties);
      this.selectedCopropertyId.set(coproperties[0]?.id ?? '');
      this.contextLoading.set(false);
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
    return !!this.selectedCopropertyId() &&
      !!this.selectedType() &&
      !!this.selectedZone() &&
      this.description.trim().length > 0;
  }

  submit(): void {
    if (!this.isValid() || this.sending()) return;
    this.sending.set(true);

    this.signalementService.createSignalement({
      copropertyId: this.selectedCopropertyId(),
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
        this.toastService.show(this.translate.instant('ownerFixes.reportError'), { classname: 'bg-danger text-light' });
        this.sending.set(false);
        return of(null);
      })
    ).subscribe(result => {
      this.sending.set(false);
      if (result) {
        this.toastService.show(this.translate.instant('ownerFixes.reportSent'), { classname: 'bg-success text-light' });
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
