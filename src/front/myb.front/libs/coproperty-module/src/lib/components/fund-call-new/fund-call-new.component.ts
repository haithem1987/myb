import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FundCallService, FundCallExtended } from '../../services/fund-call.service';
import { CopropertyService } from '../../services/coproperty.service';
import { Coproperty } from '../../models/coproperty.models';
import { CreateFundCallInput } from '../../models/fund-call.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  fundCallForm!: FormGroup;
  coproperties = signal<Coproperty[]>([]);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);
  fundCallId: string | null = null;
  isEditMode = signal<boolean>(false);

  ngOnInit(): void {
    this.initializeForm();
    this.loadCoproperties();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.fundCallForm = this.formBuilder.group({
      copropertyId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      dueDate: ['', Validators.required],
      description: ['']
    });
  }

  private loadCoproperties(): void {
    this.copropertyService.getCoproperties()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.coproperties.set(data);
        },
        error: (err) => {
          console.error('Error loading coproperties:', err);
        }
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
          const dueDate = new Date(fundCall.dueDate);
          const isoDate = dueDate.toISOString().split('T')[0];
          
          this.fundCallForm.patchValue({
            copropertyId: fundCall.copropertyId,
            amount: fundCall.amount,
            dueDate: isoDate,
            description: fundCall.description
          });
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading fund call:', err);
          this.loading.set(false);
        }
      });
  }

  saveFundCall(): void {
    if (this.fundCallForm.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.saving.set(true);

    const input: CreateFundCallInput = {
      copropertyId: this.fundCallForm.value.copropertyId,
      amount: parseFloat(this.fundCallForm.value.amount),
      dueDate: new Date(this.fundCallForm.value.dueDate) as any,
      description: this.fundCallForm.value.description
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

          setTimeout(() => {
            this.router.navigate(['/coproperty/syndic/fund-calls']);
          }, 1500);
        },
        error: (err) => {
          console.error('Error saving fund call:', err);
          alert('Erreur lors de la sauvegarde de l\'appel de fonds');
          this.saving.set(false);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/coproperty/syndic/fund-calls']);
  }
}
