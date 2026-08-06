import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FundCallService, FundCallExtended } from '../../services/fund-call.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { OwnerService } from '../../services/owner.service';
import { KeycloakService } from '@myb-front/auth';
import { Coproperty } from '../../models/coproperty.models';
import { OwnerWithUnits } from '../../models/owner.model';
import {
  FundCallStatus,
  FundCallPayment,
  FUND_CALL_STATUS_LABELS,
  FUND_CALL_STATUS_BADGE,
  CreateFundCallInput,
  AddFundCallPaymentInput,
} from '../../models/fund-call.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, finalize } from 'rxjs/operators';
import { ToastService, ModalService, ErrorMessageService } from '@myb-front/shared-ui';
import { InvoiceService } from 'libs/invoice-module/src/lib/services/invoice.service';
import { Invoice } from 'libs/invoice-module/src/lib/models/invoice.model';
import { InvoiceDetails } from 'libs/invoice-module/src/lib/models/invoiceDetails.model';
import { FundCallModalService } from '../../components/fund-call-modals/fund-call-modal.service';
import { CancellationReason } from '../../components/fund-call-modals/cancel-fund-call-modal/cancel-fund-call-modal.component';

@Component({
  selector: 'myb-fund-calls-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, NgbDropdownModule],
  templateUrl: './fund-calls-list.component.html',
  styleUrls: ['./fund-calls-list.component.scss'],
})
export class FundCallsListComponent implements OnInit {
  private fundCallService = inject(FundCallService);
  private copropertyService = inject(CopropertyService);
  private currencyService = inject(CurrencyService);
  private ownerService = inject(OwnerService);
  private keycloakService = inject(KeycloakService);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);
  private fb = inject(FormBuilder);
  private errorMessageService = inject(ErrorMessageService);
  private fundCallModalService = inject(FundCallModalService);
  private translate = inject(TranslateService);

  fundCalls = signal<FundCallExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  owners = signal<OwnerWithUnits[]>([]);
  selectedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filterStatus = signal<string>('');
  filterOwnerId = signal<string>('');
  filterYear = signal<number | null>(new Date().getFullYear());

  // ── Inline edit panel state ──────────────────────────────────────────────
  showEditPanel = signal<boolean>(false);
  editingFundCall = signal<FundCallExtended | null>(null);
  editOwners = signal<OwnerWithUnits[]>([]);
  savingEdit = signal<boolean>(false);
  editForm!: FormGroup;

  // ── Payment sub-form state ──────────────────────────────────────────────
  paymentForm!: FormGroup;
  addingPayment = signal<boolean>(false);
  showPaymentForm = signal<boolean>(false);
  selectedJustificatifFile = signal<File | null>(null);

  // ── Invoice preview modal state ─────────────────────────────────────────
  showInvoiceModal = signal<boolean>(false);
  pendingInvoice = signal<Invoice | null>(null);
  pendingFundCall = signal<FundCallExtended | null>(null);
  createdInvoice = signal<Invoice | null>(null);
  generatingInvoice = signal<boolean>(false);

  // ── Bulk selection state ──────────────────────────────────────────────────
  selectedIds = signal<Set<string>>(new Set());

  // ── Payment review state ──────────────────────────────────────────────────
  reviewingPaymentId = signal<string | null>(null);
  justificatifActionPaymentId = signal<string | null>(null);
  showRejectModal = signal<boolean>(false);
  rejectReason = '';
  private _pendingRejectPaymentId: string | null = null;

  // Status options exposed in the edit-panel dropdown. "VALIDATED" is intentionally
  // omitted: it is a derived state set by the backend once a payment is approved
  // and is not a user-selectable status from the UI.
  readonly statusOptions: { value: FundCallStatus; label: string }[] = [
    { value: 'TO_PAY', label: FUND_CALL_STATUS_LABELS['TO_PAY'] },
    { value: 'PENDING_VALIDATION', label: FUND_CALL_STATUS_LABELS['PENDING_VALIDATION'] },
    { value: 'PAID',   label: FUND_CALL_STATUS_LABELS['PAID'] },
    { value: 'CANCELLED', label: FUND_CALL_STATUS_LABELS['CANCELLED'] },
  ];

  /** Expose labels/badges to the template */
  readonly statusLabels = FUND_CALL_STATUS_LABELS;
  readonly statusBadge = FUND_CALL_STATUS_BADGE;

  /** Current/recent years plus any years present in loaded data, newest first. */
  get availableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>(
      Array.from({ length: 11 }, (_, index) => currentYear - index)
    );

    for (const fundCall of this.fundCalls()) {
      const year = fundCall.dueDate
        ? new Date(fundCall.dueDate as any).getFullYear()
        : Number.NaN;
      if (Number.isInteger(year)) years.add(year);
    }

    return [...years].sort((a, b) => b - a);
  }

  /**
   * Get today's date formatted as yyyy-MM-dd for HTML5 date input
   */
  private getTodayDateString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  ngOnInit(): void {
    this.editForm = this.fb.group({
      copropertyId: ['', Validators.required],
      ownerId: [''],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      dueDate: ['', Validators.required],
      description: [''],
      status: ['TO_PAY'],
    });
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      paymentDate: [this.getTodayDateString(), Validators.required],
      justificatif: [''],
    });
    this.loadCopropertiesAndFundCalls();
  }

  /** Load coproperties first, then load all fund calls in one coordinated flow */
  loadCopropertiesAndFundCalls(): void {
    this.loading.set(true);
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId).subscribe({
      next: (data) => {
        this.coproperties.set(data);
        this.loadAllFundCalls();
      },
      error: (err) => {
        console.error('Error loading coproperties:', err);
        this.loading.set(false);
      },
    });
  }

  loadCoproperties(): void {
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId).subscribe({
      next: (data) => {
        this.coproperties.set(data);
        if (data.length > 0) {
          this.loadOwnersByCoproperty(data[0].id);
        }
      },
      error: (err) => console.error('Error loading coproperties:', err),
    });
  }

  private loadOwnersByCoproperty(copropertyId: string): void {
    this.ownerService.getAllOwners(copropertyId).subscribe({
      next: (owners) => this.owners.set(owners),
      error: () => this.owners.set([]),
    });
  }

  loadAllFundCalls(): void {
    this.loading.set(true);
    this.fundCallService
      .getAllFundCalls()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (fundCalls) => {
          // The server already resolves copropertyName (falling back to the historical
          // snapshot if the coproperty was deleted). Only fall back to a local lookup
          // if the server didn't return a value for some reason.
          const enriched = fundCalls.map((fc) => {
            if (fc.copropertyName) return fc as FundCallExtended;
            const coproperty = this.coproperties().find((c) => c.id === fc.copropertyId);
            return { ...fc, copropertyName: coproperty?.name ?? '' } as FundCallExtended;
          });
          this.fundCalls.set(enriched);
        },
        error: (err) => {
          console.error('Error loading fund calls:', err);
          const msg = err?.graphQLErrors?.[0]?.message || 'Erreur lors du chargement des appels de fonds';
          this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 5000 });
        },
      });
  }

  onCopropertyChange(copropertyId: string): void {
    this.selectedCopropertyId.set(copropertyId);
    this.filterOwnerId.set('');
    this.owners.set([]);
    if (copropertyId && copropertyId !== 'all') {
      this.loadOwnersByCoproperty(copropertyId);
    }
    // Filtering happens locally via filteredFundCalls getter — no re-fetch needed
  }

  onOwnerFilterChange(ownerId: string): void {
    this.filterOwnerId.set(ownerId);
    // Filtered locally via filteredFundCalls getter
  }

  onYearFilterChange(year: string | number | null): void {
    this.filterYear.set(year !== null && year !== '' ? +year : null);
    // Filtered locally via filteredFundCalls getter
  }

  onStatusFilterChange(status: string): void {
    this.filterStatus.set(status);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  /** Re-fetch from the server when server-side filters (owner, year) change */
  private applyServerFilters(): void {
    // Filters are now applied locally — kept for backward compatibility
  }

  get filteredFundCalls(): FundCallExtended[] {
    let filtered = this.fundCalls();

    // Coproperty filter (local)
    const copropertyId = this.selectedCopropertyId();
    if (copropertyId && copropertyId !== 'all') {
      filtered = filtered.filter((fc) => fc.copropertyId === copropertyId);
    }

    // Owner filter (local)
    if (this.filterOwnerId()) {
      const selectedOwnerId = this.filterOwnerId().toLowerCase();
      filtered = filtered.filter((fc) =>
        (fc.ownerId ?? fc.owner?.id ?? '').toLowerCase() === selectedOwnerId
      );
    }

    // Year filter (local)
    if (this.filterYear()) {
      filtered = filtered.filter(
        (fc) => fc.dueDate && new Date(fc.dueDate as any).getFullYear() === this.filterYear()
      );
    }

    // Status filter (local). "UNPAID" is a synthetic value that matches every
    // fund call which has not yet been fully paid/validated, so syndics can
    // quickly surface owners with outstanding balances.
    const statusFilter = this.filterStatus();
    if (statusFilter === 'UNPAID') {
      filtered = filtered.filter(
        (fc) => fc.status === 'TO_PAY' || fc.status === 'PENDING_VALIDATION'
      );
    } else if (statusFilter) {
      filtered = filtered.filter((fc) => fc.status === statusFilter);
    }

    // Search filter (local)
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(
        (fc) =>
          fc.description?.toLowerCase().includes(term) ||
          (fc as any).copropertyName?.toLowerCase().includes(term) ||
          fc.ownerName?.toLowerCase().includes(term) ||
          fc.owner?.firstName?.toLowerCase().includes(term) ||
          fc.owner?.lastName?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  getStatusLabel(status: FundCallStatus | string): string {
    return FUND_CALL_STATUS_LABELS[status as FundCallStatus] ?? status;
  }

  getStatusBadge(status: FundCallStatus | string): string {
    return FUND_CALL_STATUS_BADGE[status as FundCallStatus] ?? 'bg-secondary';
  }

  /**
   * True when the fund call is currently cancelled. The edit panel remains
   * available so a syndic can correct the status, while payment actions stay
   * disabled until the record has been reactivated and saved.
   */
  isCancelled(fc: FundCallExtended): boolean {
    return fc?.status === 'CANCELLED';
  }

  getActiveFundCallsCount(): number {
    return this.filteredFundCalls.filter((fc) => fc.isActive).length;
  }

  getTotalAmount(): number {
    return this.filteredFundCalls.reduce((sum, fc) => {
      const n = typeof fc.amount === 'string' ? parseFloat(fc.amount as any) : (fc.amount || 0);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  }

  getTotalPaidAmount(): number {
    return this.filteredFundCalls.reduce((sum, fc) => {
      const payments = fc.payments ?? [];
      const paid = payments
        .filter((payment) => !this.isPaymentRejected(payment.validationStatus))
        .reduce((s, p) => {
        const n = typeof (p as any).amount === 'string' ? parseFloat((p as any).amount) : ((p as any).amount || 0);
        return s + (isNaN(n) ? 0 : n);
      }, 0);
      return sum + paid;
    }, 0);
  }

  getTotalRemainingAmount(): number {
    return Math.max(0, this.getTotalAmount() - this.getTotalPaidAmount());
  }

  private getTotalAmountDisplay(
    amountSelector: (fundCall: FundCallExtended) => number,
    fundCalls: FundCallExtended[] = this.filteredFundCalls
  ): string {
    const totals = new Map<string, number>();
    for (const fundCall of fundCalls) {
      const currency = fundCall.currency
        ?? this.coproperties().find(c => c.id === fundCall.copropertyId)?.currency
        ?? this.currencyService.current;
      totals.set(currency, (totals.get(currency) ?? 0) + amountSelector(fundCall));
    }

    if (totals.size === 0) {
      const currency = this.coproperties()
        .find(c => c.id === this.selectedCopropertyId())?.currency;
      return this.currencyService.formatAmount(0, currency);
    }

    return [...totals.entries()]
      .map(([currency, amount]) => this.currencyService.formatAmount(amount, currency))
      .join(' · ');
  }

  getCalledAmountDisplay(): string {
    return this.getTotalAmountDisplay(fundCall => {
      const amount = typeof fundCall.amount === 'string'
        ? parseFloat(fundCall.amount as any)
        : fundCall.amount || 0;
      return Number.isNaN(amount) ? 0 : amount;
    });
  }

  getPaidAmountDisplay(): string {
    return this.getTotalAmountDisplay(fundCall =>
      this.getFundCallPaidAmount(fundCall)
    );
  }

  getRemainingAmountDisplay(): string {
    return this.getTotalAmountDisplay(fundCall => {
      const amount = typeof fundCall.amount === 'string'
        ? parseFloat(fundCall.amount as any)
        : fundCall.amount || 0;
      return Math.max(
        0,
        (Number.isNaN(amount) ? 0 : amount) - this.getFundCallPaidAmount(fundCall)
      );
    });
  }

  getOverdueAmountDisplay(): string {
    return this.getTotalAmountDisplay(
      fundCall => this.getRemainingAmount(fundCall),
      this.overdueFundCalls
    );
  }

  getFundCallPaidAmount(fundCall: FundCallExtended): number {
    return (fundCall.payments ?? [])
      .filter((payment) => !this.isPaymentRejected(payment.validationStatus))
      .reduce((sum, payment) => {
      const rawAmount = payment.amount as number | string;
      const amount = typeof rawAmount === 'string'
        ? parseFloat(rawAmount)
        : rawAmount || 0;
      return sum + (Number.isNaN(amount) ? 0 : amount);
    }, 0);
  }

  getToPayCount(): number {
    return this.filteredFundCalls.filter((fc) => fc.status === 'TO_PAY').length;
  }

  getPaidCount(): number {
    return this.filteredFundCalls.filter((fc) => fc.status === 'PAID' || fc.status === 'VALIDATED').length;
  }

  /** Unique owners derived from loaded fund calls (respects coproperty filter). */
  get uniqueOwnersForFilter(): { id: string; firstName: string; lastName: string }[] {
    let source = this.fundCalls();
    const copropertyId = this.selectedCopropertyId();
    if (copropertyId && copropertyId !== 'all') {
      source = source.filter((fc) => fc.copropertyId === copropertyId);
    }
    const seen = new Set<string>();
    const result: { id: string; firstName: string; lastName: string }[] = [];
    for (const fc of source) {
      const ownerId = fc.ownerId ?? fc.owner?.id;
      if (ownerId && !seen.has(ownerId.toLowerCase())) {
        seen.add(ownerId.toLowerCase());
        const snapshotParts = (fc.ownerName ?? '').trim().split(/\s+/);
        result.push({
          id: ownerId,
          firstName: fc.owner?.firstName ?? snapshotParts[0] ?? '',
          lastName: fc.owner?.lastName ?? snapshotParts.slice(1).join(' '),
        });
      }
    }
    return result;
  }

  viewFundCall(fundCall: FundCallExtended): void {
    this.router.navigate(['/coproperty/syndic/fund-calls', fundCall.id]);
  }

  createFundCall(): void {
    this.router.navigate(['/coproperty/syndic/fund-calls', 'new']);
  }

  editFundCall(fundCall: FundCallExtended): void {
    this.editingFundCall.set(fundCall);
    const isoDate = fundCall.dueDate
      ? new Date(fundCall.dueDate as any).toISOString().split('T')[0]
      : '';
    // Patch non-owner fields immediately
    this.editForm.patchValue({
      copropertyId: fundCall.copropertyId,
      amount: fundCall.amount,
      dueDate: isoDate,
      description: fundCall.description ?? '',
      status: fundCall.status ?? 'TO_PAY',
    });
    // Load owners first, then patch ownerId so the select renders the correct option
    this.editOwners.set([]);
    if (fundCall.copropertyId) {
      this.ownerService.getAllOwners(fundCall.copropertyId).subscribe({
        next: (o) => {
          this.editOwners.set(o);
          this.editForm.patchValue({ ownerId: fundCall.ownerId ?? '' });
        },
        error: () => {
          this.editOwners.set([]);
          this.editForm.patchValue({ ownerId: fundCall.ownerId ?? '' });
        },
      });
    } else {
      this.editForm.patchValue({ ownerId: fundCall.ownerId ?? '' });
    }
    this.showEditPanel.set(true);
  }

  closeEditPanel(): void {
    this.showEditPanel.set(false);
    this.editingFundCall.set(null);
    this.editForm.reset({ status: 'TO_PAY' });
    this.paymentForm.reset();
    this.selectedJustificatifFile.set(null);
    this.showPaymentForm.set(false);
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.editingFundCall()) return;
    this.savingEdit.set(true);
    const raw = this.editForm.value;
    const input: CreateFundCallInput = {
      copropertyId: raw.copropertyId,
      ownerId: raw.ownerId || undefined,
      amount: parseFloat(raw.amount),
      dueDate: new Date(raw.dueDate) as any,
      description: raw.description,
      status: raw.status as FundCallStatus,
    };
    this.fundCallService.updateFundCall(this.editingFundCall()!.id, input).subscribe({
      next: (updatedFundCall) => {
        this.savingEdit.set(false);
        // Keep the list stable after an edit. Re-querying immediately used to
        // race with Apollo's mutation refetches and could replace the visible
        // rows with an empty response until the browser was refreshed.
        this.applyFundCallUpdate(updatedFundCall);
        this.toastService.show('Appel de fonds mis à jour avec succès', { classname: 'bg-success text-white', delay: 3000 });
        this.closeEditPanel();
      },
      error: (err) => {
        this.savingEdit.set(false);
        const msg = err?.graphQLErrors?.[0]?.message || "Erreur lors de la mise à jour.";
        this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  /** Merge a partial mutation response into the fully enriched list row. */
  private applyFundCallUpdate(updatedFundCall: FundCallExtended): void {
    const lifecycleState = {
      isActive: updatedFundCall.status !== 'CANCELLED',
      cancellable: updatedFundCall.status !== 'CANCELLED',
    };
    this.fundCalls.update((fundCalls) =>
      fundCalls.map((fundCall) =>
        fundCall.id === updatedFundCall.id
          ? { ...fundCall, ...updatedFundCall, ...lifecycleState }
          : fundCall
      )
    );

    const editing = this.editingFundCall();
    if (editing?.id === updatedFundCall.id) {
      this.editingFundCall.set({ ...editing, ...updatedFundCall, ...lifecycleState });
    }
  }

  viewPaymentJustificatif(payment: FundCallPayment): void {
    const previewWindow = window.open('', '_blank');
    this.loadPaymentJustificatif(payment, false, previewWindow);
  }

  downloadPaymentJustificatif(payment: FundCallPayment): void {
    this.loadPaymentJustificatif(payment, true, null);
  }

  private loadPaymentJustificatif(
    payment: FundCallPayment,
    download: boolean,
    previewWindow: Window | null
  ): void {
    if (!payment.justificatifFileName || this.justificatifActionPaymentId()) {
      previewWindow?.close();
      return;
    }

    this.justificatifActionPaymentId.set(payment.id);
    this.fundCallService.getPaymentJustificatif(payment.id).subscribe({
      next: payload => {
        const binary = atob(payload.base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index++) {
          bytes[index] = binary.charCodeAt(index);
        }
        const objectUrl = URL.createObjectURL(new Blob([bytes], { type: payload.contentType }));

        if (download) {
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = payload.fileName;
          anchor.click();
        } else if (previewWindow) {
          previewWindow.location.href = objectUrl;
        }

        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        this.justificatifActionPaymentId.set(null);
      },
      error: err => {
        previewWindow?.close();
        this.justificatifActionPaymentId.set(null);
        const message = err?.graphQLErrors?.[0]?.message
          || this.translate.instant('coproperty.fundCalls.payments.justificatifLoadError');
        this.toastService.show(message, { classname: 'bg-danger text-white', delay: 5000 });
      }
    });
  }

  /**
   * A fund call is considered "published" / processed when it is no longer
   * in its initial ToPay state, has already been cancelled, or has any
   * associated payment. Such records cannot be deleted, only cancelled.
   */
  isPublished(fc: FundCallExtended): boolean {
    if (!fc) return false;
    if (fc.status === 'CANCELLED') return true;
    if (fc.status !== 'TO_PAY') return true;
    const payments = (fc as any).payments as FundCallPayment[] | undefined;
    return !!payments && payments.length > 0;
  }

  /**
   * True only for true drafts (FRS-FCF-LCM-2026-001 §2.1).
   * The server is the single source of truth: the GraphQL `deletable` field
   * is computed from the same EvaluateDeleteBlocker logic in the backend,
   * so the UI can never accidentally expose a Supprimer option for a record
   * that has reached a non-deletable state.
   */
  canDelete(fc: FundCallExtended): boolean {
    // Deletion is intentionally disabled in favor of cancellation for every state.
    return false;
  }

  /** True when the user can trigger the cancellation workflow on this row. */
  canCancel(fc: FundCallExtended): boolean {
    if (typeof fc.cancellable === 'boolean') return fc.cancellable;
    return !!fc && fc.status !== 'CANCELLED';
  }

  /**
   * French reason why a delete is blocked (FRS-FCF-LCM-2026-001 §4.4).
   * Surfaced in the toast when a delete is attempted via any path.
   */
  deleteBlockerReason(fc: FundCallExtended): string | null {
    if (fc.deleteBlockerReason) return fc.deleteBlockerReason;
    return this.canDelete(fc) ? null : this.publishReasonLabel(fc);
  }

  /**
   * Opens the appropriate modal (Delete or Cancel) based on fund call state.
   * Routes to DeleteFundCallModalComponent for unpublished drafts.
   * Routes to CancelFundCallModalComponent for published/processed fund calls.
   */
  openActionModal(fundCall: FundCallExtended): void {
    const modalRef = this.fundCallModalService.openActionModal(fundCall);
    if (!modalRef) {
      return;
    }

    // Subscribe to modal result when closed
    modalRef.result.then(
      () => {
        // Modal closed with success — refresh the fund calls list
        this.loadAllFundCalls();
      },
      (reason) => {
        // Modal dismissed — no action needed
      }
    );
  }

  /**
   * Hard-delete a fund call. Only allowed for true drafts (the server returns
   * the `deletable` flag on every row). For any other record we transparently
   * route to the cancellation workflow and surface the server-provided
   * French reason (FRS-FCF-LCM-2026-001 §2.1 / §4.4 / AC-25).
   */
  deleteFundCall(fundCall: FundCallExtended): void {
    this.toastService.show(
      "La suppression n'est plus autorisée. Utilisez l'annulation.",
      { classname: 'bg-warning text-dark', delay: 5000 }
    );
    this.promptCancelFundCall(fundCall);
  }

  /**
   * Opens the cancellation modal (FRS-FCF-LCM-2026-001 §4.2.2) for a single
   * fund call. Collects a preset reason + a free-text detail (≥10 chars).
   */
  promptCancelFundCall(fundCall: FundCallExtended): void {
    if (!fundCall.id) return;
    if (!this.canCancel(fundCall)) {
      this.toastService.show("Cet appel de fonds est déjà annulé.", { classname: 'bg-info text-white', delay: 4000 });
      return;
    }

    this.fundCallModalService
      .openCancelForSingle(fundCall)
      .then((reason) => {
        if (!reason) return;
        this.cancelFundCall(fundCall, reason);
      });
  }

  /**
   * Bulk cancellation (FRS-FCF-LCM-2026-001 §4.2.3 / AC-20 / AC-21).
   * Calls the service for each fund call sequentially; on partial failure,
   * an error toast names the IDs that failed.
   */
  promptBulkCancelFundCall(fundCalls: FundCallExtended[]): void {
    if (!fundCalls.length) return;

    this.fundCallModalService
      .openCancelForBulk(
        fundCalls,
        this.getTotalAmountDisplay(
          fundCall => {
            const amount = typeof fundCall.amount === 'string'
              ? parseFloat(fundCall.amount as any)
              : fundCall.amount ?? 0;
            return Number.isNaN(amount) ? 0 : amount;
          },
          fundCalls
        )
      )
      .then((reason) => {
        if (!reason) return;
        this.bulkCancelWithReason(fundCalls, reason);
      });
  }

  private bulkCancelWithReason(fundCalls: FundCallExtended[], reason: CancellationReason): void {
    let remaining = fundCalls.length;
    let failed: string[] = [];

    fundCalls.forEach((fc) => {
      this.fundCallService.cancelFundCall(fc.id, reason.detail).subscribe({
        next: (updatedFundCall) => {
          this.applyFundCallUpdate(updatedFundCall);
          remaining--;
          if (remaining === 0 && failed.length === 0) {
            this.toastService.show(
              `${fundCalls.length} appel(s) annulé(s) avec succès. Les copropriétaires ont été notifiés.`,
              { classname: 'bg-success text-white', delay: 4000 }
            );
            this.selectedIds.set(new Set());
          } else if (remaining === 0 && failed.length > 0) {
            this.toastService.show(
              `${failed.length} appel(s) n'ont pas pu être annulés. Voir le détail dans la console.`,
              { classname: 'bg-danger text-white', delay: 6000 }
            );
            console.error('[bulkCancel] Failed IDs:', failed);
          }
        },
        error: (err: any) => {
          failed.push(fc.id);
          remaining--;
          console.error(`[bulkCancel] Failed to cancel ${fc.id}:`, err);
        }
      });
    });
  }

  /** Human-readable explanation of why the fund call cannot be deleted. */
  private publishReasonLabel(fc: FundCallExtended): string {
    const reasons: string[] = [];
    if (fc.status === 'CANCELLED') reasons.push('il a déjà été annulé');
    else if (fc.status === 'PAID') reasons.push('le paiement a déjà été encaissé');
    else if (fc.status === 'VALIDATED') reasons.push('l\'appel de fonds a été validé');
    else if (fc.status === 'PENDING_VALIDATION') reasons.push('un versement est en attente de validation');
    if ((fc as any).payments?.length) reasons.push('des versements sont associés');
    if (reasons.length === 0) return 'L\'appel de fonds a été publié.';
    return 'Cet appel de fonds ne peut pas être supprimé car ' + reasons.join(' et ') + '.';
  }

  /**
   * Cancel a single fund call (FRS-FCF-LCM-2026-001 §3.3.1). The reason is
   * collected by the cancellation modal and forwarded to the backend where
   * it is persisted in the FundCallAuditLog.
   */
  cancelFundCall(fundCall: FundCallExtended, reason: CancellationReason): void {
    if (!fundCall.id) return;
    this.fundCallService.cancelFundCall(fundCall.id, reason.detail).subscribe({
      next: (updatedFundCall) => {
        this.applyFundCallUpdate(updatedFundCall);
        this.toastService.show('Appel de fonds annulé avec succès. Les copropriétaires ont été notifiés.', { classname: 'bg-success text-white', delay: 4000 });
      },
      error: (err: any) => {
        const userError = this.errorMessageService.translateError(err);
        this.toastService.show(userError.message, { classname: `bg-${userError.severity === 'danger' ? 'danger' : 'warning'} text-white`, delay: 5000 });
      },
    });
  }

  private escapeHtml(value: string | undefined | null): string {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Step 1: build the invoice locally and show the preview modal. */
  previewInvoice(fundCall: FundCallExtended): void {
    if (!fundCall.id) return;

    const totalAmount = typeof fundCall.amount === 'string'
      ? parseFloat(fundCall.amount as any)
      : (fundCall.amount ?? 0);

    const detail = new InvoiceDetails();
    detail.description = fundCall.description
      || `Appel de fonds – ${this.getCopropertyName(fundCall)}`;
    detail.quantity = 1;
    detail.unitPrice = totalAmount;
    detail.unitPriceHT = totalAmount;
    detail.unit = 'unité';

    const invoice = new Invoice();
    invoice.invoiceNum = `FC-${fundCall.id.substring(0, 8).toUpperCase()}`;
    invoice.invoiceDate = new Date();
    invoice.dueDate = fundCall.dueDate ? new Date(fundCall.dueDate as any) : null;
    invoice.totalAmount = totalAmount;
    invoice.subTotal = totalAmount;
    invoice.status = 'Pending';
    invoice.isArchived = false;
    invoice.invoiceDetails = [detail];

    this.pendingInvoice.set(invoice);
    this.pendingFundCall.set(fundCall);
    this.createdInvoice.set(null);
    this.showInvoiceModal.set(true);
  }

  /** Step 2: called from the modal – persist the invoice via the microservice. */
  confirmAndCreateInvoice(): void {
    const invoice = this.pendingInvoice();
    if (!invoice) return;

    // Guard against a user double-clicking "Confirmer & Générer" while a request
    // is already in flight, which would otherwise produce a confusing second error.
    if (this.generatingInvoice()) return;

    this.generatingInvoice.set(true);
    this.invoiceService.create(invoice)
      .pipe(finalize(() => this.generatingInvoice.set(false)))
      .subscribe({
        next: (created) => {
          this.createdInvoice.set(created);
          this.toastService.show(
            `Facture ${created.invoiceNum ?? ''} générée avec succès`,
            { classname: 'bg-success text-white', delay: 5000 }
          );
          this.loadAllFundCalls();
        },
        error: (err: any) => {
          // Translate the technical error into a clear, user-friendly French message.
          // translateInvoiceError guarantees no raw HTTP/GraphQL text ever reaches
          // the end user — the technical details are only logged to the console.
          const userError = this.errorMessageService.translateInvoiceError(err);
          this.toastService.show(
            `${userError.message} ${userError.suggestion}`.trim(),
            { classname: `bg-${userError.severity === 'danger' ? 'danger' : 'warning'} text-white`, delay: 7000 }
          );
          // Close the modal so the user can retry with corrected data.
          this.closeInvoiceModal();
        },
      });
  }

  /** Step 3: open an isolated print window containing only the invoice document. */
  downloadInvoice(): void {
    const inv = this.pendingInvoice();
    const fc  = this.pendingFundCall();
    if (!inv) return;

    const fmt  = (v: number | string | undefined | null) => this.formatAmount(v);
    const fmtD = (d: Date | null | undefined) => d ? this.formatDate(d) : '-';

    const rows = (inv.invoiceDetails ?? []).map(line => `
      <tr>
        <td>${line.description ?? ''}</td>
        <td class="center">${line.quantity ?? 1}</td>
        <td class="right">${fmt(line.unitPriceHT)}</td>
        <td class="right"><strong>${fmt((line.quantity ?? 1) * (line.unitPriceHT ?? 0))}</strong></td>
      </tr>`).join('');

    const statusBadge = this.createdInvoice()
      ? `<span class="badge badge-success">Générée</span>`
      : `<span class="badge badge-draft">Brouillon</span>`;

    const metaRows = [
      { label: 'Date de facture',  value: fmtD(inv.invoiceDate) },
      inv.dueDate ? { label: 'Date d\'échéance', value: fmtD(inv.dueDate) } : null,
      fc ? { label: 'Copropriété',   value: this.getCopropertyName(fc) } : null,
      fc && this.getOwnerName(fc) !== '-'
        ? { label: 'Copropriétaire', value: this.getOwnerName(fc) }
        : null,
    ].filter(Boolean).map(m => `
      <div class="meta-item">
        <span class="meta-label">${m!.label}</span>
        <span class="meta-value">${m!.value}</span>
      </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${inv.invoiceNum ?? ''}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1f2937; background: #fff; padding: 40px 48px; }
    /* Header */
    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .inv-brand  { display: flex; align-items: center; gap: 14px; }
    .inv-logo   { width: 52px; height: 52px; background: linear-gradient(135deg,#3b82f6,#1d4ed8); border-radius: 10px;
                  display: flex; align-items: center; justify-content: center; }
    .inv-logo svg { width: 28px; height: 28px; fill: #fff; }
    .inv-company { font-size: 16px; font-weight: 700; color: #1e3a8a; }
    .inv-tagline { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .inv-meta   { text-align: right; }
    .inv-title  { font-size: 28px; font-weight: 800; letter-spacing: .05em; color: #1e3a8a; line-height: 1; }
    .inv-num    { font-size: 13px; color: #6b7280; font-weight: 600; margin: 6px 0; }
    .badge      { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-draft   { background: #fef9c3; color: #854d0e; }
    /* Divider */
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
    /* Meta grid */
    .meta-grid { display: flex; flex-wrap: wrap; gap: 20px 32px; margin-bottom: 8px; }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; font-weight: 600; }
    .meta-value { font-size: 13px; font-weight: 600; color: #111827; }
    /* Table */
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    thead tr th { font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280;
                  border-bottom: 2px solid #e5e7eb; padding: 8px 10px; font-weight: 600; }
    tbody tr td { padding: 10px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tfoot .subtotal td { border-top: 2px solid #e5e7eb; color: #6b7280; padding: 10px 10px; }
    tfoot .total   td { border-top: 2px solid #1e3a8a; color: #1e3a8a; font-size: 15px; padding: 10px 10px; }
    .right  { text-align: right; }
    .center { text-align: center; }
    /* Footer note */
    .inv-note { margin-top: 28px; padding: 10px 14px; background: #eff6ff;
                border-left: 3px solid #3b82f6; border-radius: 0 6px 6px 0; font-size: 11.5px; color: #4b5563; }
    @page { margin: 10mm 12mm; }
  </style>
</head>
<body>
  <div class="inv-header">
    <div class="inv-brand">
      <div class="inv-logo">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <div>
        <div class="inv-company">MYB Syndic</div>
        <div class="inv-tagline">Gestion de copropriété</div>
      </div>
    </div>
    <div class="inv-meta">
      <div class="inv-title">FACTURE</div>
      <div class="inv-num"># ${inv.invoiceNum ?? ''}</div>
      ${statusBadge}
    </div>
  </div>

  <hr>

  <div class="meta-grid">${metaRows}</div>

  <hr>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="center">Qté</th>
        <th class="right">Prix unit.</th>
        <th class="right">Total HT</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="subtotal">
        <td colspan="3" class="right">Sous-total HT</td>
        <td class="right">${fmt(inv.subTotal)}</td>
      </tr>
      <tr class="total">
        <td colspan="3" class="right"><strong>TOTAL TTC</strong></td>
        <td class="right"><strong>${fmt(inv.totalAmount)}</strong></td>
      </tr>
    </tfoot>
  </table>

  <div class="inv-note">ⓘ Appel de fonds généré par MYB Syndic • Payable à réception</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    // Small delay to let the browser render before triggering print
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  closeInvoiceModal(): void {
    this.showInvoiceModal.set(false);
    this.pendingInvoice.set(null);
    this.pendingFundCall.set(null);
    this.createdInvoice.set(null);
  }

  getCopropertyName(fundCall: FundCallExtended): string {
    return (fundCall as any).copropertyName || '';
  }

  getOwnerName(fundCall: FundCallExtended): string {
    if (fundCall.owner) return `${fundCall.owner.firstName} ${fundCall.owner.lastName}`;
    // Fall back to the historical snapshot preserved by the backend when the
    // Owner record has since been deleted.
    return fundCall.ownerName || '-';
  }

  getEditingOwnerDisplayName(): string {
    const fc = this.editingFundCall();
    if (!fc) return '-';
    if (!fc.ownerId) return 'Tous les copropriétaires';
    return this.getOwnerName(fc);
  }

  /**
   * The Amount field on the inline edit panel is only editable while the fund
   * call is awaiting validation ("En attente de validation"). Once published
   * with any other status, the amount is locked to prevent unauthorized
   * changes to the called amount.
   */
  isAmountLocked(): boolean {
    return this.editForm?.get('status')?.value !== 'PENDING_VALIDATION';
  }

  // ── Payment helpers ─────────────────────────────────────────────────────

  togglePaymentForm(): void {
    if (this.editingFundCall() && this.isCancelled(this.editingFundCall()!)) {
      return;
    }
    this.showPaymentForm.update((v) => !v);
    if (!this.showPaymentForm()) {
      this.paymentForm.reset({ paymentDate: this.getTodayDateString() });
      this.selectedJustificatifFile.set(null);
    } else {
      // When showing the form, ensure date is set to today
      this.paymentForm.patchValue({ paymentDate: this.getTodayDateString() });
    }
  }

  onJustificatifFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      input.value = '';
      this.selectedJustificatifFile.set(null);
      this.paymentForm.patchValue({ justificatif: '' });
      this.toastService.show(
        this.translate.instant('coproperty.fundCalls.payments.unsupportedFileType'),
        { classname: 'bg-danger text-white', delay: 5000 }
      );
      return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
      input.value = '';
      this.selectedJustificatifFile.set(null);
      this.paymentForm.patchValue({ justificatif: '' });
      this.toastService.show(
        this.translate.instant('coproperty.fundCalls.payments.fileTooLarge'),
        { classname: 'bg-danger text-white', delay: 5000 }
      );
      return;
    }

    this.selectedJustificatifFile.set(file);
    // Store the file name as the justificatif reference string
    this.paymentForm.patchValue({ justificatif: file ? file.name : '' });
  }

  async addPayment(): Promise<void> {
    const fc = this.editingFundCall();
    if (!fc || this.isCancelled(fc) || this.paymentForm.invalid) return;

    this.addingPayment.set(true);
    const raw = this.paymentForm.value;
    const file = this.selectedJustificatifFile();
    let justificatifFileBase64: string | undefined;

    try {
      justificatifFileBase64 = file ? await this.readFileAsBase64(file) : undefined;
    } catch {
      this.addingPayment.set(false);
      this.toastService.show(
        this.translate.instant('coproperty.fundCalls.payments.justificatifReadError'),
        { classname: 'bg-danger text-white', delay: 5000 }
      );
      return;
    }

    const input: AddFundCallPaymentInput = {
      amount: parseFloat(raw.amount),
      paymentDate: new Date(raw.paymentDate) as any,
      justificatif: raw.justificatif || undefined,
      justificatifFileName: file?.name,
      justificatifContentType: file?.type,
      justificatifFileBase64,
    };

    this.fundCallService.addFundCallPayment(fc.id, input).subscribe({
      next: (payment) => {
        this.addingPayment.set(false);
        this.toastService.show('Versement ajouté avec succès', { classname: 'bg-success text-white', delay: 3000 });
        // Append the new payment to the local fund call so the panel updates instantly
        const updated = { ...fc, payments: [...(fc.payments ?? []), payment] } as FundCallExtended;
        this.editingFundCall.set(updated);
        // Also refresh the main list
        this.fundCalls.update((list) =>
          list.map((item) => (item.id === fc.id ? updated : item))
        );
        this.paymentForm.reset();
        this.selectedJustificatifFile.set(null);
        this.showPaymentForm.set(false);
      },
      error: (err: any) => {
        this.addingPayment.set(false);
        const userError = this.errorMessageService.translateError(err);
        this.toastService.show(userError.message, { classname: `bg-${userError.severity === 'danger' ? 'danger' : 'warning'} text-white`, delay: 5000 });
      },
    });
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        const separatorIndex = dataUrl.indexOf(',');
        if (separatorIndex < 0) {
          reject(new Error('Invalid file data URL'));
          return;
        }
        resolve(dataUrl.slice(separatorIndex + 1));
      };
      reader.readAsDataURL(file);
    });
  }

  getTotalPayments(fc: FundCallExtended): number {
    return (fc.payments ?? []).reduce((sum, p) => {
      if (this.isPaymentRejected(p.validationStatus)) {
        return sum;
      }
      const n = typeof p.amount === 'string' ? parseFloat(p.amount as any) : (p.amount ?? 0);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  }

  getRemainingAmount(fc: FundCallExtended): number {
    const total = typeof fc.amount === 'string' ? parseFloat(fc.amount as any) : (fc.amount ?? 0);
    return Math.max(0, total - this.getTotalPayments(fc));
  }

  formatAmount(amount: number | string | undefined | null, currency?: string): string {
    const selectedCurrency = this.coproperties()
      .find(c => c.id === this.selectedCopropertyId())?.currency;
    return this.currencyService.formatAmount(amount, currency ?? selectedCurrency);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // ── Bulk selection helpers ────────────────────────────────────────────────

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  get hasSelection(): boolean {
    return this.selectedIds().size > 0;
  }

  get isAllSelected(): boolean {
    const filtered = this.filteredFundCalls;
    return filtered.length > 0 && filtered.every((fc) => this.selectedIds().has(fc.id));
  }

  get selectedCount(): number {
    return this.selectedIds().size;
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.filteredFundCalls.map((fc) => fc.id)));
    }
  }

  bulkChangeStatus(status: FundCallStatus): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    const label = FUND_CALL_STATUS_LABELS[status] ?? status;

    // Build a quick summary of the selected items so the user can review before confirming.
    const selectedFundCalls = ids
      .map((id) => this.fundCalls().find((f) => f.id === id))
      .filter((fc): fc is FundCallExtended => !!fc);

    const statusBadgeHtml = (s: string) =>
      `<span class="badge ${this.getStatusBadge(s)}">${this.escapeHtml(this.getStatusLabel(s))}</span>`;

    // Show up to 5 items in the modal; collapse the rest behind a "+N autres" hint.
    const previewItems = selectedFundCalls.slice(0, 5).map((fc) => `
      <li class="d-flex align-items-center justify-content-between gap-2 py-1 border-bottom small">
        <span class="text-truncate" style="max-width:55%">
          <i class="bi bi-receipt me-1 text-muted"></i>${this.escapeHtml(fc.description || '—')}
        </span>
        <span>${statusBadgeHtml(fc.status || '')}</span>
        <i class="bi bi-arrow-right text-muted"></i>
        <span><span class="badge ${this.getStatusBadge(status)}">${this.escapeHtml(label)}</span></span>
      </li>`).join('');

    const overflowHint = selectedFundCalls.length > 5
      ? `<li class="text-muted small text-center pt-2">+ ${selectedFundCalls.length - 5} autre(s) appel(s)…</li>`
      : '';

    const impactNote = status === 'CANCELLED'
      ? `<div class="alert alert-warning py-2 px-3 mb-3 small d-flex align-items-start gap-2">
           <i class="bi bi-exclamation-triangle-fill mt-1"></i>
           <div>L'annulation empêchera tout nouveau versement tout en conservant la trace comptable.</div>
         </div>`
      : status === 'PAID'
        ? `<div class="alert alert-info py-2 px-3 mb-3 small d-flex align-items-start gap-2">
             <i class="bi bi-info-circle-fill mt-1"></i>
             <div>Le statut <strong>Réglé</strong> est généralement attribué après validation d'un versement par le syndic.</div>
           </div>`
        : '';

    this.modalService.confirm({
      title: `<i class="bi bi-arrow-repeat me-2 text-primary"></i>Confirmer le changement de statut`,
      message: `
        <div class="text-start">
          <p class="mb-2">
            Vous allez modifier le statut de
            <strong>${selectedFundCalls.length}</strong> appel(s) de fonds
            pour un montant total de
            <strong>${this.getTotalAmountDisplay(
              fundCall => {
                const amount = typeof fundCall.amount === 'string'
                  ? parseFloat(fundCall.amount as any)
                  : fundCall.amount ?? 0;
                return Number.isNaN(amount) ? 0 : amount;
              },
              selectedFundCalls
            )}</strong>.
          </p>
          ${impactNote}
          <ul class="list-unstyled mb-3 px-2 py-2 bg-light rounded">
            ${previewItems}${overflowHint}
          </ul>
          <div class="d-flex align-items-center gap-2 small text-muted">
            <i class="bi bi-clock-history"></i>
            <span>Cette action est immédiate et sera visible par les copropriétaires.</span>
          </div>
        </div>`,
      confirmButtonText: '<i class="bi bi-check2-circle me-1"></i>Appliquer le changement',
      cancelButtonText: 'Annuler',
      confirmButtonClass: status === 'CANCELLED' ? 'btn-warning' : 'btn-primary',
    }).then((ok) => {
      if (!ok) return;
      let remaining = ids.length;
      let hadError = false;
      ids.forEach((id) => {
        const fc = this.fundCalls().find((f) => f.id === id);
        if (!fc) { remaining--; return; }
        const input: CreateFundCallInput = {
          copropertyId: fc.copropertyId,
          ownerId: fc.ownerId ?? undefined,
          amount: typeof fc.amount === 'string' ? parseFloat(fc.amount as any) : (fc.amount ?? 0),
          dueDate: fc.dueDate as any,
          description: fc.description,
          status,
        };
        this.fundCallService.updateFundCall(id, input).subscribe({
          next: () => {
            this.fundCalls.update((list) =>
              list.map((item) => (item.id === id ? { ...item, status } : item))
            );
            remaining--;
            if (remaining === 0 && !hadError) {
              this.selectedIds.set(new Set());
              this.toastService.show(`${ids.length} appel(s) mis à jour en "${label}"`, { classname: 'bg-success text-white', delay: 3000 });
              // Reload from server so the local state stays in sync with backend
              // (especially the PaidAmount / RemainingAmount aggregates that this
              // optimistic update does not recompute).
              this.loadAllFundCalls();
            }
          },
          error: (err: any) => {
            hadError = true;
            remaining--;
            const userError = this.errorMessageService.translateError(err);
            this.toastService.show(userError.message, { classname: `bg-${userError.severity === 'danger' ? 'danger' : 'warning'} text-white`, delay: 5000 });
          },
        });
      });
    });
  }

  /**
   * Bulk delete is no longer offered in the action bar (FRS-FCF-LCM-2026-001
   * §2.3). The bulk action is "Annuler la sélection" only. This method is
   * kept as a no-op + toast so any caller wiring from a saved tab does not
   * silently break; the real workflow is the cancellation modal below.
   */
  bulkDelete(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    this.toastService.show(
      "La suppression en masse n'est plus disponible. Utilisez l'annulation à la place.",
      { classname: 'bg-warning text-dark', delay: 5000 }
    );
    // Forward to the cancellation flow so the user is never blocked.
    const selected = ids
      .map((id) => this.fundCalls().find((f) => f.id === id))
      .filter((fc): fc is FundCallExtended => !!fc && this.canCancel(fc));
    if (selected.length) {
      this.cancelSelectedPublished();
    } else {
      this.selectedIds.set(new Set());
    }
  }

  /**
   * Helper used by the bulk-action bar: collect the selected fund calls that
   * are published/processed (and therefore can only be cancelled) and open
   * the bulk-cancel confirmation modal.
   */
  cancelSelectedPublished(): void {
    const blocked = this.filteredFundCalls.filter(
      (fc) => this.isSelected(fc.id) && this.canCancel(fc)
    );
    if (!blocked.length) {
      this.toastService.show(
        'Aucun appel de fonds annulable n\'est sélectionné.',
        { classname: 'bg-info text-white', delay: 4000 }
      );
      return;
    }
    this.bulkCancel(blocked);
  }

  /**
   * Bulk-cancel a list of fund calls using the new modal
   * (FRS-FCF-LCM-2026-001 §4.2.3 / AC-20 / AC-21).
   * Delegates to promptBulkCancelFundCall so the UX is the same as the
   * per-row cancel flow.
   */
  bulkCancel(fundCalls: FundCallExtended[]): void {
    this.promptBulkCancelFundCall(fundCalls);
  }

  getPaymentProgress(fc: FundCallExtended): { paid: number; total: number; percent: number } {
    const total = typeof fc.amount === 'string' ? parseFloat(fc.amount as any) : (fc.amount ?? 0);
    const paid = this.getTotalPayments(fc);
    const percent = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
    return { paid, total, percent };
  }

  // ── Overdue / Late payment helpers ────────────────────────────────────────

  /** Returns true if the fund call is overdue (past due date & not fully paid) */
  isOverdue(fc: FundCallExtended): boolean {
    if (fc.status === 'PAID' || fc.status === 'VALIDATED') return false;
    if (!fc.dueDate) return false;
    const dueDate = new Date(fc.dueDate as any);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  /** Number of days overdue */
  getDaysOverdue(fc: FundCallExtended): number {
    if (!fc.dueDate) return 0;
    const dueDate = new Date(fc.dueDate as any);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diff = today.getTime() - dueDate.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  /** Returns urgency level: 'warning' (1-30 days), 'danger' (31-90 days), 'critical' (90+ days) */
  getOverdueLevel(fc: FundCallExtended): 'warning' | 'danger' | 'critical' {
    const days = this.getDaysOverdue(fc);
    if (days > 90) return 'critical';
    if (days > 30) return 'danger';
    return 'warning';
  }

  /** All overdue fund calls from the current filtered list */
  get overdueFundCalls(): FundCallExtended[] {
    return this.filteredFundCalls.filter((fc) => this.isOverdue(fc));
  }

  /** Total overdue amount (amount - paid) */
  getTotalOverdueAmount(): number {
    return this.overdueFundCalls.reduce((sum, fc) => {
      return sum + this.getRemainingAmount(fc);
    }, 0);
  }

  /** Count of overdue fund calls */
  getOverdueCount(): number {
    return this.overdueFundCalls.length;
  }

  /** Get overdue badge class */
  getOverdueBadgeClass(fc: FundCallExtended): string {
    const level = this.getOverdueLevel(fc);
    if (level === 'critical') return 'bg-danger';
    if (level === 'danger') return 'bg-danger bg-opacity-75';
    return 'bg-warning text-dark';
  }

  /** Get overdue label with days */
  getOverdueLabel(fc: FundCallExtended): string {
    const days = this.getDaysOverdue(fc);
    if (days > 90) return `${days}j - Critique`;
    if (days > 30) return `${days}j - En retard`;
    return `${days}j`;
  }

  // ── Payment Review ────────────────────────────────────────────────────────

  approvePayment(paymentId: string): void {
    this.reviewingPaymentId.set(paymentId);
    // Optimistic update: immediately reflect the approval in the UI
    const previousFc = this.editingFundCall();
    if (previousFc?.payments) {
      this.editingFundCall.set({
        ...previousFc,
        payments: previousFc.payments.map((p) =>
          p.id === paymentId ? { ...p, validationStatus: 'Approved' } : p
        ),
      } as any);
    }
    this.fundCallService.reviewFundCallPayment(paymentId, true).subscribe({
      next: () => {
        this.toastService.show('Paiement validé avec succès.', { classname: 'bg-success text-white', delay: 4000 });
        this.reviewingPaymentId.set(null);
        this.reloadEditingFundCall();
      },
      error: (err) => {
        // Revert optimistic update on failure
        if (previousFc) this.editingFundCall.set(previousFc);
        const msg = err?.graphQLErrors?.[0]?.message || 'Erreur lors de la validation du paiement';
        this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 5000 });
        this.reviewingPaymentId.set(null);
      },
    });
  }

  openRejectDialog(paymentId: string): void {
    this._pendingRejectPaymentId = paymentId;
    this.rejectReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectDialog(): void {
    this.showRejectModal.set(false);
    this._pendingRejectPaymentId = null;
    this.rejectReason = '';
  }

  confirmReject(): void {
    if (!this._pendingRejectPaymentId || !this.rejectReason.trim()) return;
    const paymentId = this._pendingRejectPaymentId;
    const reason = this.rejectReason.trim();
    this.reviewingPaymentId.set(paymentId);
    // Optimistic update: immediately reflect the rejection in the UI
    const previousFc = this.editingFundCall();
    if (previousFc?.payments) {
      this.editingFundCall.set({
        ...previousFc,
        payments: previousFc.payments.map((p) =>
          p.id === paymentId ? { ...p, validationStatus: 'Rejected', rejectionReason: reason } : p
        ),
      } as any);
    }
    this.fundCallService.reviewFundCallPayment(paymentId, false, reason).subscribe({
      next: () => {
        this.toastService.show('Paiement refusé. Le propriétaire a été notifié.', { classname: 'bg-warning text-dark', delay: 4000 });
        this.reviewingPaymentId.set(null);
        this.closeRejectDialog();
        this.reloadEditingFundCall();
      },
      error: (err) => {
        // Revert optimistic update on failure
        if (previousFc) this.editingFundCall.set(previousFc);
        const msg = err?.graphQLErrors?.[0]?.message || 'Erreur lors du refus du paiement';
        this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 5000 });
        this.reviewingPaymentId.set(null);
      },
    });
  }

  private reloadEditingFundCall(): void {
    const current = this.editingFundCall();
    if (!current) return;
    this.fundCallService.getFundCallById(current.id).subscribe({
      next: (updated) => {
        if (!updated) return;
        const coproperty = this.coproperties().find((c) => c.id === updated.copropertyId);
        const enriched = { ...updated, copropertyName: coproperty?.name ?? current.copropertyName } as FundCallExtended;
        this.editingFundCall.set(enriched);
        // Sync the edit form status to reflect the new server state
        this.editForm.patchValue({ status: enriched.status ?? 'TO_PAY' });
        // Refresh the main list as well
        this.fundCalls.update((list) =>
          list.map((fc) => (fc.id === enriched.id ? enriched : fc))
        );
      },
      error: () => { /* non-critical */ },
    });
  }

  private normalizePaymentValidationStatus(status: string | null | undefined): string {
    return String(status ?? '').replace(/[_\s-]/g, '').toUpperCase();
  }

  private isPaymentRejected(status: string | null | undefined): boolean {
    return this.normalizePaymentValidationStatus(status) === 'REJECTED';
  }
}
