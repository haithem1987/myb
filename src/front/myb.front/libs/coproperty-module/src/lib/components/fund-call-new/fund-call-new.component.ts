import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FundCallService, FundCallExtended } from '../../services/fund-call.service';
import { CopropertyService } from '../../services/coproperty.service';
import { CurrencyService } from '../../services/currency.service';
import { OwnerService } from '../../services/owner.service';
import { KeycloakService } from '@myb-front/auth';
import { Coproperty } from '../../models/coproperty.models';
import { OwnerWithUnits } from '../../models/owner.model';
import {
  CreateFundCallInput,
  FundCallStatus,
  FUND_CALL_STATUS_LABELS,
  AddFundCallPaymentInput,
} from '../../models/fund-call.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-fund-call-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './fund-call-new.component.html',
  styleUrls: ['./fund-call-new.component.scss'],
})
export class FundCallNewComponent implements OnInit {
  private fundCallService = inject(FundCallService);
  private copropertyService = inject(CopropertyService);
  private currencyService = inject(CurrencyService);
  private ownerService = inject(OwnerService);
  private keycloakService = inject(KeycloakService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);

  fundCallForm!: FormGroup;
  paymentForm!: FormGroup;

  coproperties = signal<Coproperty[]>([]);
  owners = signal<OwnerWithUnits[]>([]);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  savingPayment = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);
  errorMessage = signal<string>('');
  fundCallId: string | null = null;
  isEditMode = signal<boolean>(false);
  currentFundCall = signal<FundCallExtended | null>(null);
  showPaymentForm = signal<boolean>(false);

  readonly statusOptions: { value: FundCallStatus; label: string }[] = [
    { value: 'TO_PAY', label: FUND_CALL_STATUS_LABELS['TO_PAY'] },
    { value: 'PAID', label: FUND_CALL_STATUS_LABELS['PAID'] },
    { value: 'VALIDATED', label: FUND_CALL_STATUS_LABELS['VALIDATED'] },
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.initializePaymentForm();
    this.loadCoproperties();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.fundCallForm = this.formBuilder.group({
      copropertyId: ['', Validators.required],
      ownerId: [''],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      dueDate: ['', Validators.required],
      description: [''],
      status: ['TO_PAY'],
    });

    // When coproperty changes, reload owners
    this.fundCallForm.get('copropertyId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((copropertyId: string) => {
        if (copropertyId) this.loadOwners(copropertyId);
        else this.owners.set([]);
      });
  }

  private initializePaymentForm(): void {
    this.paymentForm = this.formBuilder.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
      justificatif: [''],
    });
  }

  private loadCoproperties(): void {
    const managerId = this.keycloakService.getSyndicManagerId();
    this.copropertyService.getCoproperties(managerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.coproperties.set(data);
          if (data.length > 0 && !this.fundCallForm.get('copropertyId')?.value) {
            this.fundCallForm.patchValue({ copropertyId: data[0].id });
          }
        },
        error: (err) => console.error('Error loading coproperties:', err),
      });
  }

  private loadOwners(copropertyId: string): void {
    this.ownerService.getAllOwners(copropertyId).subscribe({
      next: (owners) => this.owners.set(owners),
      error: () => this.owners.set([]),
    });
  }

  private checkEditMode(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (id && id !== 'new') {
          this.fundCallId = id;
          this.isEditMode.set(true);
          this.loadFundCall(id);
        }
      });
  }

  private loadFundCall(id: string): void {
    this.loading.set(true);
    this.fundCallService.getFundCallById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fundCall) => {
          this.currentFundCall.set(fundCall);
          const isoDate = new Date(fundCall.dueDate).toISOString().split('T')[0];

          this.fundCallForm.patchValue({
            copropertyId: fundCall.copropertyId,
            ownerId: fundCall.ownerId ?? '',
            amount: fundCall.amount,
            dueDate: isoDate,
            description: fundCall.description,
            status: fundCall.status ?? 'TO_PAY',
          });

          if (fundCall.copropertyId) this.loadOwners(fundCall.copropertyId);

          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading fund call:', err);
          this.loading.set(false);
        },
      });
  }

  saveFundCall(): void {
    if (this.fundCallForm.invalid) {
      this.toastService.show('Veuillez remplir tous les champs obligatoires', { classname: 'bg-warning text-dark', delay: 4000 });
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const raw = this.fundCallForm.value;
    const input: CreateFundCallInput = {
      copropertyId: raw.copropertyId,
      ownerId: raw.ownerId || undefined,
      amount: parseFloat(raw.amount),
      dueDate: new Date(raw.dueDate) as any,
      description: raw.description,
      status: raw.status as FundCallStatus,
    };

    const request = this.isEditMode() && this.fundCallId
      ? this.fundCallService.updateFundCall(this.fundCallId, input)
      : this.fundCallService.createFundCall(input);

    request
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.saveSuccess.set(true);
          this.saving.set(false);
          const successMsg = this.isEditMode() ? 'Appel de fonds mis à jour avec succès' : 'Appel de fonds créé avec succès';
          this.toastService.show(successMsg, { classname: 'bg-success text-white', delay: 3000 });
          setTimeout(() => this.router.navigate(['/coproperty/syndic/fund-calls']), 1500);
        },
        error: (err) => {
          console.error('Error saving fund call:', err);
          // Detect duplicate from backend message (GraphQL or 409)
          const graphqlMsg: string = err?.graphQLErrors?.[0]?.message ?? '';
          const rawMsg: string = err?.message ?? '';
          const combined = (graphqlMsg + rawMsg).toLowerCase();
          let userMsg: string;
          if (combined.includes('already exists') || combined.includes('duplicate')) {
            userMsg = 'Un appel de fonds existe déjà pour cette date.';
          } else if (graphqlMsg) {
            userMsg = graphqlMsg;
          } else {
            userMsg = "Erreur lors de la sauvegarde de l'appel de fonds.";
          }
          this.errorMessage.set(userMsg);
          this.toastService.show(userMsg, { classname: 'bg-danger text-white', delay: 6000 });
          this.saving.set(false);
        },
      });
  }

  updateStatusOnly(): void {
    if (!this.fundCallId) return;
    this.saving.set(true);
    this.errorMessage.set('');

    this.fundCallService
      .updateFundCallStatus(this.fundCallId, { status: this.fundCallForm.value.status as FundCallStatus })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saveSuccess.set(true);
          this.saving.set(false);
          this.toastService.show('Statut mis à jour avec succès', { classname: 'bg-success text-white', delay: 3000 });
          setTimeout(() => this.saveSuccess.set(false), 2000);
        },
        error: (err) => {
          console.error('Error updating status:', err);
          const msg = err?.graphQLErrors?.[0]?.message || 'Erreur lors de la mise à jour du statut.';
          this.errorMessage.set(msg);
          this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 5000 });
          this.saving.set(false);
        },
      });
  }

  addPayment(): void {
    if (this.paymentForm.invalid || !this.fundCallId) return;

    this.savingPayment.set(true);
    this.errorMessage.set('');

    const raw = this.paymentForm.value;
    const input: AddFundCallPaymentInput = {
      amount: parseFloat(raw.amount),
      paymentDate: new Date(raw.paymentDate) as any,
      justificatif: raw.justificatif || undefined,
    };

    this.fundCallService
      .addFundCallPayment(this.fundCallId, input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingPayment.set(false);
          this.showPaymentForm.set(false);
          this.paymentForm.reset({ paymentDate: new Date().toISOString().split('T')[0] });
          this.toastService.show('Versement ajouté avec succès', { classname: 'bg-success text-white', delay: 3000 });
          // Reload fund call to see new payment
          this.loadFundCall(this.fundCallId!);
        },
        error: (err) => {
          console.error('Error adding payment:', err);
          const msg = err?.graphQLErrors?.[0]?.message || "Erreur lors de l'ajout du versement.";
          this.errorMessage.set(msg);
          this.toastService.show(msg, { classname: 'bg-danger text-white', delay: 5000 });
          this.savingPayment.set(false);
        },
      });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  get currencySymbol(): string {
    return this.currencyService.symbol;
  }

  formatAmount(amount: number | string | undefined | null): string {
    return this.currencyService.formatAmount(amount);
  }

  goBack(): void {
    this.router.navigate(['/coproperty/syndic/fund-calls']);
  }
}
