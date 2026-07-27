import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FundCallExtended, FundCallService } from '../../../services/fund-call.service';
import { ToastService } from '@myb-front/shared-ui';

/**
 * Hard-delete confirmation modal for true drafts
 * (FRS-FCF-LCM-2026-001 §4.2.1). The user must TYPE the exact description of
 * the fund call to confirm. This friction check prevents accidental clicks on
 * a row that is in its narrow 30-day, no-children window (AC-09, AC-10).
 */
@Component({
  selector: 'myb-delete-fund-call-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delete-fund-call-modal.component.html',
  styleUrls: ['./delete-fund-call-modal.component.scss'],
})
export class DeleteFundCallModalComponent implements OnInit {
  @Input() fundCall!: FundCallExtended;

  typed = signal<string>('');
  isDeleting = signal<boolean>(false);

  /** Description the user must type to confirm. */
  requiredDescription: string = '';
  /** Human-readable precondition note (e.g. "Brouillon, créé il y a 3 jours, sans versement"). */
  preconditionNote: string = '';

  private fundCallService = inject(FundCallService);
  private toastService = inject(ToastService);
  private activeModal = inject(NgbActiveModal);

  ngOnInit(): void {
    this.requiredDescription = (this.fundCall?.description || `Appel de fonds ${this.fundCall?.id?.substring(0, 8) ?? ''}`).slice(0, 80);
    this.preconditionNote = this.computePreconditionNote();
  }

  private computePreconditionNote(): string {
    const fc = this.fundCall;
    if (!fc) return '';
    const parts: string[] = [];
    parts.push('Brouillon (À payer)');
    parts.push('aucun versement associé');
    if (fc.createdAt) {
      const days = Math.floor((Date.now() - new Date(fc.createdAt).getTime()) / 86_400_000);
      parts.push(days <= 1 ? 'créé aujourd\'hui' : `créé il y a ${days} jour(s)`);
    }
    return `Suppression autorisée : ${parts.join(', ')}.`;
  }

  canConfirm(): boolean {
    return this.typed().trim() === this.requiredDescription.trim();
  }

  onTypedChange(value: string): void {
    this.typed.set(value);
  }

  confirmDelete(): void {
    if (!this.canConfirm() || !this.fundCall?.id) return;

    this.isDeleting.set(true);
    this.fundCallService.deleteFundCall(this.fundCall.id, this.fundCall.copropertyId).subscribe({
      next: () => {
        this.toastService.show(
          'Appel de fonds supprimé avec succès',
          { classname: 'bg-success text-white', delay: 4000 }
        );
        this.activeModal.close(true);
      },
      error: (err: any) => {
        this.isDeleting.set(false);
        // Surface a clear, non-technical message — never expose the raw GraphQL error.
        const msg = err?.graphQLErrors?.[0]?.message
          || 'Suppression impossible. Utilisez l\'annulation à la place.';
        this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 6000 });
      },
    });
  }

  dismiss(): void {
    this.activeModal.dismiss();
  }

  formatAmount(value: any): string {
    if (typeof value === 'string') {
      value = parseFloat(value);
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.fundCall?.currency || 'EUR',
    }).format(value || 0);
  }
}
