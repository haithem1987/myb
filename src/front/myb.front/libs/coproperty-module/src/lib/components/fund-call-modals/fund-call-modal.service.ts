import { Injectable, inject } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DeleteFundCallModalComponent } from './delete-fund-call-modal/delete-fund-call-modal.component';
import { CancelFundCallModalComponent, CancellationReason } from './cancel-fund-call-modal/cancel-fund-call-modal.component';
import { FundCallExtended } from '../../services/fund-call.service';
import { ToastService } from '@myb-front/shared-ui';

/**
 * Service to open the appropriate modal (Delete or Cancel) based on fund call state.
 * Routes to DeleteFundCallModalComponent for true drafts (FRS-FCF-LCM-2026-001 §2.1).
 * Routes to CancelFundCallModalComponent for everything else.
 */
@Injectable({
  providedIn: 'root',
})
export class FundCallModalService {
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);

  /**
   * Opens the appropriate action modal (Delete or Cancel) based on fund call state.
   * Automatically decides between destructive deletion and non-destructive cancellation.
   */
  openActionModal(fundCall: FundCallExtended): NgbModalRef | null {
    if (!fundCall?.id) {
      this.toastService.show(
        'Impossible d\'ouvrir la modale : appel de fonds invalide',
        { classname: 'bg-warning text-dark', delay: 4000 }
      );
      return null;
    }

    // Prefer the server-provided `deletable` flag (single source of truth).
    const isDeletable = typeof fundCall.deletable === 'boolean'
      ? fundCall.deletable
      : this.canDeletePermanentlyClient(fundCall);

    if (isDeletable) {
      return this.openDeleteModal(fundCall);
    } else if (this.canCancel(fundCall)) {
      return this.openCancelModal(fundCall);
    } else {
      this.toastService.show(
        'Cet appel de fonds ne peut pas être modifié',
        { classname: 'bg-warning text-dark', delay: 4000 }
      );
      return null;
    }
  }

  /**
   * Opens the cancel modal in single mode and resolves with the reason.
   * Returns null if the user dismisses the modal.
   */
  openCancelForSingle(fundCall: FundCallExtended): Promise<CancellationReason | null> {
    const ref = this.openCancelModal(fundCall);
    if (!ref) return Promise.resolve(null);
    return ref.result
      .then((reason) => (reason as CancellationReason) ?? null)
      .catch(() => null);
  }

  /**
   * Opens the cancel modal in bulk mode and resolves with the reason.
   * Returns null if the user dismisses the modal.
   */
  openCancelForBulk(fundCalls: FundCallExtended[], totalAmount: string): Promise<CancellationReason | null> {
    const ref = this.modalService.open(CancelFundCallModalComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    ref.componentInstance.bulk = { items: fundCalls, totalAmount };
    return ref.result
      .then((reason) => (reason as CancellationReason) ?? null)
      .catch(() => null);
  }

  /**
   * Client-side fallback only. The server `deletable` flag is the source of truth.
   */
  private canDeletePermanentlyClient(fundCall: FundCallExtended): boolean {
    return (
      fundCall.status === 'TO_PAY' &&
      (fundCall.payments?.length ?? 0) === 0
    );
  }

  /**
   * Determines if a fund call can be cancelled (published or with activity).
   * Returns true for all statuses except CANCELLED.
   */
  private canCancel(fundCall: FundCallExtended): boolean {
    if (typeof fundCall.cancellable === 'boolean') return fundCall.cancellable;
    return fundCall.status !== 'CANCELLED';
  }

  /**
   * Opens the Delete modal for permanent deletion of unpublished drafts.
   * Includes the friction check (typed confirmation) per FRS-FCF-LCM-2026-001 §4.2.1.
   */
  private openDeleteModal(fundCall: FundCallExtended): NgbModalRef {
    const modalRef = this.modalService.open(DeleteFundCallModalComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.fundCall = fundCall;
    return modalRef;
  }

  /**
   * Opens the Cancel modal for status change of published fund calls.
   * Returns a NgbModalRef whose `.result` resolves with a CancellationReason.
   */
  private openCancelModal(fundCall: FundCallExtended): NgbModalRef {
    const modalRef = this.modalService.open(CancelFundCallModalComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.fundCall = fundCall;
    return modalRef;
  }
}
