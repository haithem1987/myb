import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OwnerService, ChargeDistribution, ChargePaymentStatus, PaymentApiService, CurrencyService } from '@myb-front/coproperty-module';
import { KeycloakService } from '@myb-front/auth';
import { ToastService, ModalService } from '@myb-front/shared-ui';
import { firstValueFrom, take, catchError, of } from 'rxjs';

@Component({
  selector: 'app-owner-charges',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './charges.component.html',
  styleUrls: ['./charges.component.scss']
})
export class OwnerChargesComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private paymentApiService = inject(PaymentApiService);
  private keycloakService = inject(KeycloakService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);
  private currencyService = inject(CurrencyService);

  distributions = signal<ChargeDistribution[]>([]);
  loading = signal(true);
  paying = signal<string | null>(null); // distributionId currently being paid
  ownerId = signal<string | null>(null);
  ownerEmail = signal<string | null>(null);
  // Computed stats
  get totalCharges(): number {
    return this.distributions().reduce((sum, d) => sum + d.amount, 0);
  }

  get totalPaid(): number {
    return this.distributions().reduce((sum, d) => sum + (d.paidAmount || 0), 0);
  }

  get totalDue(): number {
    return this.totalCharges - this.totalPaid;
  }

  get unpaidDistributions(): ChargeDistribution[] {
    return this.distributions().filter(d =>
      d.paymentStatus !== 'PAID' && d.paymentStatus !== ChargePaymentStatus.Paid
    );
  }

  get paidDistributions(): ChargeDistribution[] {
    return this.distributions().filter(d =>
      d.paymentStatus === 'PAID' || d.paymentStatus === ChargePaymentStatus.Paid
    );
  }

  ngOnInit(): void {
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

  private loadOwnerData(): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.error('[OwnerCharges] User ID not available');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    // First get the owner record by user ID to get the owner ID
    this.ownerService.getOwnerByUserId(userId).pipe(
      take(1),
      catchError(() => of(null))
    ).subscribe({
      next: (owner) => {
        if (!owner) {
          console.warn('[OwnerCharges] No owner record found for user');
          this.loading.set(false);
          return;
        }

        this.ownerId.set(owner.id);
        this.ownerEmail.set(owner.email || null);

        // Now load charge distributions for this owner
        this.ownerService.getOwnerChargeDistributions(owner.id).pipe(
          take(1),
          catchError(() => of([]))
        ).subscribe({
          next: (distributions) => {
            this.distributions.set(distributions);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  async payCharge(distribution: ChargeDistribution): Promise<void> {
    if (this.paying()) return; // Prevent double-clicking

    const amountToPay = distribution.amount - (distribution.paidAmount || 0);
    if (amountToPay <= 0) {
      this.toastService.show('Cette charge est déjà payée', { classname: 'toast-info' });
      return;
    }

    const confirmed = await this.modalService.confirm({
      title: 'Confirmation de paiement',
      message: `Voulez-vous payer ${this.formatAmount(amountToPay)} pour "${distribution.chargeName || 'Charge de copropriété'}" (Lot ${distribution.unitNumber || 'N/A'}) ?`,
      confirmButtonText: 'Payer',
      confirmButtonClass: 'btn-success'
    });

    if (!confirmed) return;

    this.paying.set(distribution.id);

    try {
      // Step 1: Process payment via myb-payment service (Stripe + record + email)
      const paymentResult = await firstValueFrom(
        this.paymentApiService.payCharge({
          userId: this.getCurrentUserId() || '',
          chargeDistributionId: distribution.id,
          chargeName: distribution.chargeName || 'Charge de copropriété',
          unitNumber: distribution.unitNumber || '',
          amount: amountToPay,
          currency: 'eur',
          receiptEmail: this.ownerEmail() || '',
          paymentMethod: 'Card'
        })
      );

      // Step 2: Mark distribution as paid in coproperty backend with payment reference
      await firstValueFrom(
        this.ownerService.markChargeDistributionPaid(
          distribution.id,
          `PAY-${paymentResult.paymentId}`,
          'Card',
          amountToPay
        )
      );

      this.toastService.show('Paiement effectué avec succès!', { classname: 'toast-success' });

      // Reload distributions to refresh the state
      this.loadOwnerData();
    } catch (err) {
      console.error('[OwnerCharges] Payment failed:', err);
      this.toastService.show('Le paiement a échoué. Veuillez réessayer.', { classname: 'toast-danger' });
    } finally {
      this.paying.set(null);
    }
  }

  async payAllCharges(): Promise<void> {
    const unpaid = this.unpaidDistributions;
    if (unpaid.length === 0) return;

    const totalAmount = unpaid.reduce((sum, d) => sum + d.amount - (d.paidAmount || 0), 0);
    const confirmed = await this.modalService.confirm({
      title: 'Payer toutes les charges',
      message: `Voulez-vous payer toutes les charges en attente pour un total de ${this.formatAmount(totalAmount)} ?`,
      confirmButtonText: 'Tout payer',
      confirmButtonClass: 'btn-success'
    });

    if (!confirmed) return;

    let failCount = 0;
    for (const dist of unpaid) {
      this.paying.set(dist.id);
      try {
        const amountToPay = dist.amount - (dist.paidAmount || 0);

        // Step 1: Payment service
        const paymentResult = await firstValueFrom(
          this.paymentApiService.payCharge({
            userId: this.getCurrentUserId() || '',
            chargeDistributionId: dist.id,
            chargeName: dist.chargeName || 'Charge de copropriété',
            unitNumber: dist.unitNumber || '',
            amount: amountToPay,
            currency: 'eur',
            receiptEmail: this.ownerEmail() || '',
            paymentMethod: 'Card'
          })
        );

        // Step 2: Mark paid in coproperty backend
        await firstValueFrom(
          this.ownerService.markChargeDistributionPaid(
            dist.id,
            `PAY-${paymentResult.paymentId}`,
            'Card',
            amountToPay
          )
        );
      } catch (err) {
        failCount++;
        console.error('[OwnerCharges] Payment failed for distribution:', dist.id, err);
        this.toastService.show(`Échec du paiement pour "${dist.chargeName}"`, { classname: 'toast-danger' });
        this.paying.set(null);
        break;
      }
    }

    this.paying.set(null);
    if (failCount === 0) {
      this.toastService.show('Toutes les charges ont été payées!', { classname: 'toast-success' });
    }
    this.loadOwnerData();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PAID':
      case ChargePaymentStatus.Paid:
        return 'badge-paid';
      case 'PARTIALLY_PAID':
      case ChargePaymentStatus.PartiallyPaid:
        return 'badge-partial';
      case 'PENDING':
      case ChargePaymentStatus.Pending:
        return 'badge-pending';
      case 'FAILED':
      case ChargePaymentStatus.Failed:
        return 'badge-failed';
      default:
        return 'badge-unpaid';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PAID':
      case ChargePaymentStatus.Paid:
        return 'Payé';
      case 'PARTIALLY_PAID':
      case ChargePaymentStatus.PartiallyPaid:
        return 'Partiellement payé';
      case 'PENDING':
      case ChargePaymentStatus.Pending:
        return 'En attente';
      case 'FAILED':
      case ChargePaymentStatus.Failed:
        return 'Échoué';
      default:
        return 'Non payé';
    }
  }

  getChargeTypeIcon(type: string): string {
    switch (type?.toUpperCase()) {
      case 'CLEANING': return 'bi-brush';
      case 'SECURITY': return 'bi-shield-check';
      case 'MAINTENANCE': return 'bi-tools';
      case 'ELECTRICITY': return 'bi-lightning';
      case 'WATER': return 'bi-droplet';
      case 'INSURANCE': return 'bi-shield';
      case 'ELEVATOR': return 'bi-arrow-up-square';
      case 'HEATING': return 'bi-thermometer-half';
      case 'GARDENING': return 'bi-tree';
      default: return 'bi-receipt';
    }
  }

  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount);
  }
}
