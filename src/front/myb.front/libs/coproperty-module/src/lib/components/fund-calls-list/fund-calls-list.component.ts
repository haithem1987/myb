import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FundCallService, FundCallExtended } from '../../services/fund-call.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { OwnerService } from '../../services/owner.service';
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
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { InvoiceService } from 'libs/invoice-module/src/lib/services/invoice.service';
import { Invoice } from 'libs/invoice-module/src/lib/models/invoice.model';
import { InvoiceDetails } from 'libs/invoice-module/src/lib/models/invoiceDetails.model';

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
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  fundCalls = signal<FundCallExtended[]>([]);
  coproperties = signal<Coproperty[]>([]);
  owners = signal<OwnerWithUnits[]>([]);
  selectedCopropertyId = signal<string | null>(null);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  filterStatus = signal<string>('');
  filterOwnerId = signal<string>('');
  filterYear = signal<number | null>(null);

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
  showRejectModal = signal<boolean>(false);
  rejectReason = '';
  private _pendingRejectPaymentId: string | null = null;

  readonly statusOptions: { value: FundCallStatus; label: string }[] = [
    { value: 'TO_PAY', label: FUND_CALL_STATUS_LABELS['TO_PAY'] },
    { value: 'PENDING_VALIDATION', label: FUND_CALL_STATUS_LABELS['PENDING_VALIDATION'] },
    { value: 'PAID',   label: FUND_CALL_STATUS_LABELS['PAID'] },
    { value: 'VALIDATED', label: FUND_CALL_STATUS_LABELS['VALIDATED'] },
  ];

  /** Expose labels/badges to the template */
  readonly statusLabels = FUND_CALL_STATUS_LABELS;
  readonly statusBadge = FUND_CALL_STATUS_BADGE;

  /** Available years (last 5 years + current) for dropdown */
  readonly availableYears: number[] = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

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
    this.copropertyService.getCoproperties().subscribe({
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
    this.copropertyService.getCoproperties().subscribe({
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
          // Enrich each fund call with the coproperty name from already-loaded coproperties
          const enriched = fundCalls.map((fc) => {
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

  onOwnerFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterOwnerId.set(select.value);
    // Filtered locally via filteredFundCalls getter
  }

  onYearFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterYear.set(select.value ? +select.value : null);
    // Filtered locally via filteredFundCalls getter
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterStatus.set(select.value);
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
      filtered = filtered.filter((fc) => fc.ownerId === this.filterOwnerId());
    }

    // Year filter (local)
    if (this.filterYear()) {
      filtered = filtered.filter(
        (fc) => fc.dueDate && new Date(fc.dueDate as any).getFullYear() === this.filterYear()
      );
    }

    // Status filter (local)
    if (this.filterStatus()) {
      filtered = filtered.filter((fc) => fc.status === this.filterStatus());
    }

    // Search filter (local)
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(
        (fc) =>
          fc.description?.toLowerCase().includes(term) ||
          (fc as any).copropertyName?.toLowerCase().includes(term) ||
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
      const paid = payments.reduce((s, p) => {
        const n = typeof (p as any).amount === 'string' ? parseFloat((p as any).amount) : ((p as any).amount || 0);
        return s + (isNaN(n) ? 0 : n);
      }, 0);
      return sum + paid;
    }, 0);
  }

  getTotalRemainingAmount(): number {
    return Math.max(0, this.getTotalAmount() - this.getTotalPaidAmount());
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
      if (fc.owner?.id && !seen.has(fc.owner.id)) {
        seen.add(fc.owner.id);
        result.push({
          id: fc.owner.id,
          firstName: (fc.owner as any).firstName ?? '',
          lastName: (fc.owner as any).lastName ?? '',
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
    this.editForm.patchValue({
      copropertyId: fundCall.copropertyId,
      ownerId: fundCall.ownerId ?? '',
      amount: fundCall.amount,
      dueDate: isoDate,
      description: fundCall.description ?? '',
      status: fundCall.status ?? 'TO_PAY',
    });
    // Load owners for the fund call's coproperty
    this.editOwners.set([]);
    if (fundCall.copropertyId) {
      this.ownerService.getAllOwners(fundCall.copropertyId).subscribe({
        next: (o) => this.editOwners.set(o),
        error: () => this.editOwners.set([]),
      });
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
      next: () => {
        this.savingEdit.set(false);
        this.toastService.show('Appel de fonds mis à jour avec succès', { classname: 'bg-success text-white', delay: 3000 });
        this.closeEditPanel();
        this.loadAllFundCalls();
      },
      error: (err) => {
        this.savingEdit.set(false);
        const msg = err?.graphQLErrors?.[0]?.message || "Erreur lors de la mise à jour.";
        this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  deleteFundCall(fundCall: FundCallExtended): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet appel de fonds ?')) {
      if (!fundCall.id) {
        this.toastService.show("Impossible de supprimer : identifiant manquant", { classname: 'bg-danger text-white', delay: 4000 });
        return;
      }
      // Optimistically remove the item immediately
      this.fundCalls.update((list) => list.filter((fc) => fc.id !== fundCall.id));

      this.fundCallService.deleteFundCall(fundCall.id, fundCall.copropertyId).subscribe({
        next: () => {
          this.toastService.show("Appel de fonds supprimé avec succès", { classname: 'bg-success text-white', delay: 4000 });
        },
        error: (err) => {
          console.error('Error deleting fund call:', err);
          // Restore the removed item on error
          this.loadAllFundCalls();
          const msg = err?.graphQLErrors?.[0]?.message || "Erreur lors de la suppression de l'appel de fonds";
          this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 5000 });
        },
      });
    }
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
        error: (err) => {
          console.error('Error generating invoice:', err);
          const graphqlMsg = err?.graphQLErrors?.[0]?.message;
          const networkMsg = err?.networkError?.error?.errors?.[0]?.message
            ?? err?.networkError?.message;
          const msg = graphqlMsg || networkMsg || 'Erreur lors de la génération de la facture';
          this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 7000 });
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
      fc?.owner ? { label: 'Copropriétaire', value: this.getOwnerName(fc) } : null,
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
    if (!fundCall.owner) return '-';
    return `${fundCall.owner.firstName} ${fundCall.owner.lastName}`;
  }

  // ── Payment helpers ─────────────────────────────────────────────────────

  togglePaymentForm(): void {
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
    this.selectedJustificatifFile.set(file);
    // Store the file name as the justificatif reference string
    this.paymentForm.patchValue({ justificatif: file ? file.name : '' });
  }

  addPayment(): void {
    const fc = this.editingFundCall();
    if (!fc || this.paymentForm.invalid) return;

    this.addingPayment.set(true);
    const raw = this.paymentForm.value;
    const input: AddFundCallPaymentInput = {
      amount: parseFloat(raw.amount),
      paymentDate: new Date(raw.paymentDate) as any,
      justificatif: raw.justificatif || undefined,
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
      error: (err) => {
        this.addingPayment.set(false);
        const msg = err?.graphQLErrors?.[0]?.message || "Erreur lors de l'ajout du versement";
        this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 5000 });
      },
    });
  }

  getTotalPayments(fc: FundCallExtended): number {
    return (fc.payments ?? []).reduce((sum, p) => {
      const n = typeof p.amount === 'string' ? parseFloat(p.amount as any) : (p.amount ?? 0);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  }

  getRemainingAmount(fc: FundCallExtended): number {
    const total = typeof fc.amount === 'string' ? parseFloat(fc.amount as any) : (fc.amount ?? 0);
    return Math.max(0, total - this.getTotalPayments(fc));
  }

  formatAmount(amount: number | string | undefined | null): string {
    return this.currencyService.formatAmount(amount);
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
    if (!confirm(`Changer le statut de ${ids.length} appel(s) en "${label}" ?`)) return;
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
          }
        },
        error: () => { hadError = true; remaining--; },
      });
    });
  }

  bulkDelete(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    if (!confirm(`Supprimer ${ids.length} appel(s) de fonds ? Cette action est irréversible.`)) return;
    ids.forEach((id) => {
      const fc = this.fundCalls().find((f) => f.id === id);
      if (!fc) return;
      this.fundCalls.update((list) => list.filter((item) => item.id !== id));
      this.fundCallService.deleteFundCall(id, fc.copropertyId).subscribe({
        error: () => this.loadAllFundCalls(),
      });
    });
    this.selectedIds.set(new Set());
    this.toastService.show(`${ids.length} appel(s) supprimé(s)`, { classname: 'bg-success text-white', delay: 3000 });
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
}
