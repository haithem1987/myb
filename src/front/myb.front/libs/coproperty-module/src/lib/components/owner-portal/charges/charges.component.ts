import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { OwnerService, FundCallService, FundCallExtended, CurrencyService, FundCallPayment } from '../../../index';
import { KeycloakService } from '@myb-front/auth';
import { ToastService, ModalService } from '@myb-front/shared-ui';
import { firstValueFrom, catchError, of } from 'rxjs';

export interface PaymentReceipt {
  fundCallDescription: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference: string;
  receiptNumber: string;
}

export type PaymentMethodType = 'Espèces' | 'Chèque' | 'Virement' | 'Mandat postal';

export interface PaymentJustificationForm {
  amount: number;
  paymentMethod: PaymentMethodType;
  justificatif: string;
  paymentDate: string; // yyyy-MM-dd for input[type=date]
  // Virement-specific fields
  bankName: string;
  rib: string;
  senderName: string;
}

@Component({
  selector: 'app-owner-charges',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './charges.component.html',
  styleUrls: ['./charges.component.scss']
})
export class OwnerChargesComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private fundCallService = inject(FundCallService);
  private keycloakService = inject(KeycloakService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);
  private currencyService = inject(CurrencyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  fundCalls = signal<FundCallExtended[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  ownerId = signal<string | null>(null);
  ownerEmail = signal<string | null>(null);

  // Payment justification modal state
  showPaymentModal = signal(false);
  selectedFundCall = signal<FundCallExtended | null>(null);
  submittingPayment = signal(false);
  // Receipt shown after successful payment
  paymentReceipt = signal<PaymentReceipt | null>(null);
  justificatifFile: File | null = null;
  justificatifFileName = signal<string | null>(null);
  paymentForm: PaymentJustificationForm = {
    amount: 0,
    paymentMethod: 'Virement',
    justificatif: '',
    paymentDate: new Date().toISOString().split('T')[0],
    bankName: '',
    rib: '',
    senderName: '',
  };

  paymentMethods: PaymentMethodType[] = ['Espèces', 'Chèque', 'Virement', 'Mandat postal'];

  // Computed stats
  get totalCharges(): number {
    return this.fundCalls().reduce((sum, fc) => sum + fc.amount, 0);
  }

  get totalPaid(): number {
    return this.fundCalls().reduce((sum, fc) => {
      const paid = (fc.payments || [])
        .filter((p) => !this.isPaymentRejected(p.validationStatus))
        .reduce((s, p) => s + p.amount, 0);
      return sum + paid;
    }, 0);
  }

  get totalDue(): number {
    return this.totalCharges - this.totalPaid;
  }

  get unpaidFundCalls(): FundCallExtended[] {
    if (this.filterStatus() === 'paid') return [];
    return this.fundCalls().filter(
      fc => (fc.status === 'TO_PAY' || fc.status === 'PENDING_VALIDATION') && this.matchesFilters(fc)
    );
  }

  get paidFundCalls(): FundCallExtended[] {
    if (this.filterStatus() === 'unpaid') return [];
    if (this.filterStatus() === 'cancelled') return [];
    return this.fundCalls().filter(fc => (fc.status === 'PAID' || fc.status === 'VALIDATED') && this.matchesFilters(fc));
  }

  get cancelledFundCalls(): FundCallExtended[] {
    if (this.filterStatus() === 'unpaid' || this.filterStatus() === 'paid') return [];
    return this.fundCalls().filter(fc => fc.status === 'CANCELLED' && this.matchesFilters(fc));
  }

  // ── Search & filter state ─────────────────────────────────────────────────
  searchTerm = signal<string>('');
  filterStatus = signal<string>('');
  filterYear = signal<string>('');

  get availableYears(): number[] {
    const years = new Set<number>();
    this.fundCalls().forEach(fc => years.add(new Date(fc.dueDate).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }

  private matchesFilters(fc: FundCallExtended): boolean {
    if (this.filterYear() && new Date(fc.dueDate).getFullYear().toString() !== this.filterYear()) {
      return false;
    }
    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      const haystack = `${fc.description || ''} ${fc.copropertyName || ''}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(event: Event): void {
    this.filterStatus.set((event.target as HTMLSelectElement).value);
  }

  onYearFilterChange(event: Event): void {
    this.filterYear.set((event.target as HTMLSelectElement).value);
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm() || !!this.filterStatus() || !!this.filterYear();
  }

  /** True once every non-cancelled fund call has been paid/validated. */
  get allFundCallsPaid(): boolean {
    const nonCancelled = this.fundCalls().filter(fc => fc.status !== 'CANCELLED');
    return nonCancelled.length > 0 && nonCancelled.every(fc => fc.status === 'PAID' || fc.status === 'VALIDATED');
  }

  get hasCancelledFundCalls(): boolean {
    return this.fundCalls().some(fc => fc.status === 'CANCELLED');
  }

  ngOnInit(): void {
    const statusParam = this.route.snapshot.queryParamMap.get('status');
    if (statusParam) {
      this.filterStatus.set(statusParam);
    }
    this.loadOwnerData();
  }

  private getCurrentUserId(): string | null {
    const token = this.keycloakService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  async loadOwnerData(): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      this.error.set('Impossible de récupérer votre identifiant utilisateur. Veuillez vous reconnecter.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      // Step 1: Resolve the owner record from Keycloak user ID
      const owner = await firstValueFrom(
        this.ownerService.getOwnerByUserId(userId)
      );

      if (!owner || !owner.id) {
        this.error.set('Votre compte propriétaire n\'a pas été trouvé. Contactez votre syndic.');
        this.loading.set(false);
        return;
      }

      this.ownerId.set(owner.id);
      this.ownerEmail.set(owner.email || null);

      // Step 2: Load fund calls for this owner
      const fundCalls = await firstValueFrom(
        this.fundCallService.getFundCallsByOwner(owner.id)
      );

      this.fundCalls.set(fundCalls || []);
    } catch (err: any) {
      console.error('[OwnerCharges] Error loading data:', err);
      this.error.set('Erreur lors du chargement de vos appels de fonds. Veuillez rafraîchir la page.');
    } finally {
      this.loading.set(false);
    }
  }

  getFundCallPaidAmount(fc: FundCallExtended): number {
    return (fc.payments || [])
      .filter((p) => !this.isPaymentRejected(p.validationStatus))
      .reduce((sum, p) => sum + p.amount, 0);
  }

  private normalizePaymentValidationStatus(status: string | null | undefined): string {
    return String(status ?? '').replace(/[_\s-]/g, '').toUpperCase();
  }

  isPaymentRejected(status: string | null | undefined): boolean {
    return this.normalizePaymentValidationStatus(status) === 'REJECTED';
  }

  isPaymentApproved(status: string | null | undefined): boolean {
    return this.normalizePaymentValidationStatus(status) === 'APPROVED';
  }

  isPaymentPending(status: string | null | undefined): boolean {
    return this.normalizePaymentValidationStatus(status) === 'PENDING';
  }

  getFundCallRemainingAmount(fc: FundCallExtended): number {
    return fc.amount - this.getFundCallPaidAmount(fc);
  }

  /** Calculate suggested monthly installment based on remaining amount and months until due date */
  getSuggestedMonthlyAmount(fc: FundCallExtended): number {
    const remaining = this.getFundCallRemainingAmount(fc);
    if (remaining <= 0) return 0;
    const now = new Date();
    const due = new Date(fc.dueDate);
    const monthsDiff = Math.max(1, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return Math.ceil(remaining / monthsDiff * 1000) / 1000; // Round up to 3 decimal places (TND)
  }

  /** Get number of months remaining until due date */
  getMonthsUntilDue(fc: FundCallExtended): number {
    const now = new Date();
    const due = new Date(fc.dueDate);
    return Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  }

  /** Set the payment amount to the suggested monthly installment */
  setMonthlyAmount(): void {
    const fc = this.selectedFundCall();
    if (fc) {
      this.paymentForm.amount = this.getSuggestedMonthlyAmount(fc);
    }
  }

  // Read-only detail modal (for cancelled fund calls)
  showDetailModal = signal(false);
  selectedDetailFundCall = signal<FundCallExtended | null>(null);

  viewFundCallDetails(fc: FundCallExtended): void {
    this.selectedDetailFundCall.set(fc);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedDetailFundCall.set(null);
  }

  /** Extracts the filename from a justificatif string like "[Fichier: name.pdf]" */
  getJustificatifFileName(justificatif: string): string | null {
    const match = justificatif?.match(/\[Fichier:\s*([^\]]+)\]/);
    return match ? match[1].trim() : null;
  }

  // Payment justification modal
  openPaymentModal(fc: FundCallExtended): void {
    this.selectedFundCall.set(fc);
    const remaining = this.getFundCallRemainingAmount(fc);
    this.paymentForm = {
      amount: remaining,
      paymentMethod: 'Virement',
      justificatif: '',
      paymentDate: new Date().toISOString().split('T')[0],
      bankName: '',
      rib: '',
      senderName: '',
    };
    this.justificatifFile = null;
    this.justificatifFileName.set(null);
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.selectedFundCall.set(null);
    this.paymentReceipt.set(null);
  }

  async submitPaymentJustification(): Promise<void> {
    const fc = this.selectedFundCall();
    if (!fc) return;

    const remaining = this.getFundCallRemainingAmount(fc);

    // Validation
    if (this.paymentForm.amount <= 0) {
      this.toastService.show('Le montant doit être supérieur à 0', { classname: 'toast-danger' });
      return;
    }
    if (this.paymentForm.amount > remaining) {
      this.toastService.show(`Le montant ne peut pas dépasser ${this.formatAmount(remaining)}`, { classname: 'toast-danger' });
      return;
    }
    if (!this.justificatifFile) {
      this.toastService.show('Veuillez joindre un justificatif (fichier obligatoire)', { classname: 'toast-danger' });
      return;
    }
    if (!this.paymentForm.paymentDate) {
      this.toastService.show('Veuillez sélectionner la date de paiement', { classname: 'toast-danger' });
      return;
    }
    // Virement-specific validation
    if (this.paymentForm.paymentMethod === 'Virement') {
      if (!this.paymentForm.bankName.trim()) {
        this.toastService.show('Veuillez saisir le nom de la banque', { classname: 'toast-danger' });
        return;
      }
      if (!this.paymentForm.rib.trim()) {
        this.toastService.show('Veuillez saisir le RIB', { classname: 'toast-danger' });
        return;
      }
      if (!this.paymentForm.senderName.trim()) {
        this.toastService.show('Veuillez saisir le nom de l\'émetteur', { classname: 'toast-danger' });
        return;
      }
    }

    this.submittingPayment.set(true);

    try {
      const justificatifFileBase64 = await this.readFileAsBase64(this.justificatifFile);

      // Build justificatif text with bank info for Virement
      let justificatifText = this.paymentForm.justificatif.trim();
      if (this.paymentForm.paymentMethod === 'Virement') {
        justificatifText = `[Virement] Banque: ${this.paymentForm.bankName.trim()}, RIB: ${this.paymentForm.rib.trim()}, Émetteur: ${this.paymentForm.senderName.trim()} — ${justificatifText}`;
      }
      if (this.justificatifFile) {
        justificatifText += ` [Fichier: ${this.justificatifFile.name}]`;
      }

      await firstValueFrom(
        this.fundCallService.addFundCallPayment(fc.id, {
          amount: this.paymentForm.amount,
          paymentDate: new Date(this.paymentForm.paymentDate),
          justificatif: justificatifText,
          paymentMethod: this.paymentForm.paymentMethod,
          justificatifFileName: this.justificatifFile.name,
          justificatifContentType: this.justificatifFile.type,
          justificatifFileBase64
        })
      );

      this.toastService.show('Justificatif de paiement envoyé avec succès!', { classname: 'toast-success' });

      // Build and display receipt inside the modal
      const receiptNumber = 'REC-' + Date.now().toString(36).toUpperCase();
      this.paymentReceipt.set({
        fundCallDescription: fc.description || 'Appel de fonds',
        amount: this.paymentForm.amount,
        paymentMethod: this.paymentForm.paymentMethod,
        paymentDate: this.paymentForm.paymentDate,
        reference: this.paymentForm.justificatif.trim().substring(0, 80),
        receiptNumber,
      });

      this.loadOwnerData();
    } catch (err) {
      console.error('[OwnerCharges] Payment justification failed:', err);
      this.toastService.show('L\'envoi du justificatif a échoué. Veuillez réessayer.', { classname: 'toast-danger' });
    } finally {
      this.submittingPayment.set(false);
    }
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Impossible de lire le justificatif.'));
      reader.onload = () => {
        const dataUrl = String(reader.result ?? '');
        const commaIndex = dataUrl.indexOf(',');
        if (commaIndex < 0) {
          reject(new Error('Format de justificatif invalide.'));
          return;
        }
        resolve(dataUrl.substring(commaIndex + 1));
      };
      reader.readAsDataURL(file);
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
      case 'VALIDATED':
        return 'badge-paid';
      case 'TO_PAY':
        return 'badge-unpaid';
      case 'CANCELLED':
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PAID':
        return 'Réglé';
      case 'VALIDATED':
        return 'Validé';
      case 'TO_PAY':
        return 'À payer';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return status;
    }
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'Espèces': return 'bi-cash-coin';
      case 'Chèque': return 'bi-file-earmark-text';
      case 'Virement': return 'bi-bank';
      case 'Mandat postal': return 'bi-envelope';
      default: return 'bi-credit-card';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const maxSize = 5 * 1024 * 1024; // 5 MB
      const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        this.toastService.show('Format non supporté. Utilisez PDF, JPG, PNG ou WebP.', { classname: 'toast-danger' });
        input.value = '';
        return;
      }
      if (file.size > maxSize) {
        this.toastService.show('Le fichier ne doit pas dépasser 5 Mo.', { classname: 'toast-danger' });
        input.value = '';
        return;
      }
      this.justificatifFile = file;
      this.justificatifFileName.set(file.name);
    }
  }

  removeFile(): void {
    this.justificatifFile = null;
    this.justificatifFileName.set(null);
  }

  isOverdue(fc: FundCallExtended): boolean {
    return fc.status === 'TO_PAY' && new Date(fc.dueDate) < new Date();
  }

  formatAmount(amount: number, currency?: string): string {
    return this.currencyService.formatAmount(amount, currency);
  }

  get currencySymbol(): string {
    return this.currencyService.getSymbol(
      this.selectedFundCall()?.currency ?? this.fundCalls()[0]?.currency
    );
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
