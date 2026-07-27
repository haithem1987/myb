import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FundCallExtended, FundCallService } from '../../../services/fund-call.service';
import { ToastService } from '@myb-front/shared-ui';
import { FUND_CALL_STATUS_LABELS, FUND_CALL_STATUS_BADGE, FundCallStatus } from '../../../models/fund-call.model';

/**
 * Result returned by the cancellation modal to the caller.
 * FRS-FCF-LCM-2026-001 §2.4 / §4.2.2.
 */
export interface CancellationReason {
  preset: 'ErreurDeSaisie' | 'Doublon' | 'CopropriétaireIntrouvable' | 'Autre';
  detail: string;
}

export const CANCELLATION_PRESETS: { value: CancellationReason['preset']; label: string }[] = [
  { value: 'ErreurDeSaisie', label: 'Erreur de saisie' },
  { value: 'Doublon', label: 'Doublon' },
  { value: 'CopropriétaireIntrouvable', label: 'Copropriétaire introuvable' },
  { value: 'Autre', label: 'Autre (à préciser)' },
];

/**
 * Modal opened when a Syndic wants to cancel one or more fund calls
 * (FRS-FCF-LCM-2026-001 §4.2.2 / §4.2.3). Two display modes:
 *   - 'single': shows a small summary of the affected fund call (uses @Input fundCall)
 *   - 'bulk':   shows the count, total amount and the first 5 affected items (uses @Input bulk)
 *
 * The user MUST pick a preset reason AND fill the detail textarea with at
 * least 10 characters before the "Confirmer l'annulation" button is enabled.
 * The result is a CancellationReason object; the caller forwards it to the
 * FundCallService.cancelFundCall(id, detail) method.
 */
@Component({
  selector: 'myb-cancel-fund-call-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancel-fund-call-modal.component.html',
  styleUrls: ['./cancel-fund-call-modal.component.scss'],
})
export class CancelFundCallModalComponent implements OnInit {
  /** Single fund call being cancelled. */
  @Input() fundCall?: FundCallExtended;
  /** Bulk-mode payload: list of fund calls + pre-formatted total. */
  @Input() bulk?: { items: FundCallExtended[]; totalAmount: string };

  /** Display mode, derived from inputs. */
  mode: 'single' | 'bulk' = 'single';

  presets = CANCELLATION_PRESETS;
  selectedPreset: CancellationReason['preset'] | null = null;
  detail = signal<string>('');

  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  private activeModal = inject(NgbActiveModal);

  readonly statusLabels = FUND_CALL_STATUS_LABELS;
  readonly statusBadge = FUND_CALL_STATUS_BADGE;

  ngOnInit(): void {
    if (this.bulk && this.bulk.items.length > 0) {
      this.mode = 'bulk';
    } else if (this.fundCall) {
      this.mode = 'single';
    }
    // Default preset: 'ErreurDeSaisie' is the most common case in practice.
    this.selectedPreset = 'ErreurDeSaisie';
  }

  get summaryItems(): { id: string; description: string; amount: string }[] {
    if (this.mode === 'single' && this.fundCall) {
      return [{
        id: this.fundCall.id,
        description: (this.fundCall.description || `Appel de fonds ${this.fundCall.id.substring(0, 8)}`).slice(0, 80),
        amount: this.formatAmount(this.fundCall.amount)
      }];
    }
    if (this.mode === 'bulk' && this.bulk) {
      return this.bulk.items.map((fc) => ({
        id: fc.id,
        description: (fc.description || `Appel de fonds ${fc.id.substring(0, 8)}`).slice(0, 80),
        amount: this.formatAmount(fc.amount)
      }));
    }
    return [];
  }

  get totalAmountLabel(): string | null {
    return this.mode === 'bulk' ? (this.bulk?.totalAmount ?? null) : null;
  }

  canConfirm(): boolean {
    return !!this.selectedPreset && this.detail().trim().length >= 10;
  }

  selectPreset(preset: CancellationReason['preset']): void {
    this.selectedPreset = preset;
    this.errorMessage.set('');
  }

  onDetailChange(value: string): void {
    this.detail.set(value);
    this.errorMessage.set('');
  }

  get charCount(): number {
    return this.detail().length;
  }

  getStatusLabel(status: string): string {
    return this.statusLabels[status as FundCallStatus] ?? status;
  }

  statusBadgeClass(status: string): string {
    return this.statusBadge[status as FundCallStatus] || 'bg-secondary';
  }

  confirm(): void {
    if (!this.canConfirm() || !this.selectedPreset) {
      this.errorMessage.set('Veuillez sélectionner un motif et préciser le détail (10 caractères minimum).');
      return;
    }
    if (this.detail().trim().length > 500) {
      this.errorMessage.set('Le détail ne peut pas dépasser 500 caractères.');
      return;
    }
    this.submitting.set(true);
    const result: CancellationReason = {
      preset: this.selectedPreset,
      detail: this.detail().trim(),
    };
    this.activeModal.close(result);
  }

  dismiss(): void {
    this.activeModal.dismiss('cancel');
  }

  formatAmount(value: any): string {
    if (typeof value === 'string') value = parseFloat(value);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.fundCall?.currency || 'EUR',
    }).format(value || 0);
  }
}
