import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CopropertyInvoice } from '../../models';
import { OwnerService } from '../../services/owner.service';
import { KeycloakService } from '@myb/auth';

@Component({
  selector: 'app-invoice-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>payment</mat-icon>
      Pay Invoice
    </h2>

    <mat-dialog-content>
      <div class="invoice-details">
        <h3>Invoice Details</h3>
        <div class="detail-row">
          <span class="label">Invoice Number:</span>
          <span class="value">{{ data.invoice.invoiceNumber }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total Amount:</span>
          <span class="value amount">{{ data.invoice.totalAmount | currency:'EUR' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Due Date:</span>
          <span class="value" [class.overdue]="isOverdue()">
            {{ data.invoice.dueDate | date:'dd/MM/yyyy' }}
          </span>
        </div>
        @if (data.invoice.status === 'PartiallyPaid') {
          <div class="detail-row">
            <span class="label">Amount Paid:</span>
            <span class="value">{{ getAmountPaid() | currency:'EUR' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Remaining:</span>
            <span class="value amount">{{ getRemainingAmount() | currency:'EUR' }}</span>
          </div>
        }
      </div>

      <form [formGroup]="paymentForm" class="payment-form">
        <h3>Payment Information</h3>

        <!-- Payment Method Selection -->
        <mat-radio-group formControlName="paymentMethod" class="payment-method-group">
          <mat-radio-button value="CreditCard">
            <mat-icon>credit_card</mat-icon>
            Credit Card
          </mat-radio-button>
          <mat-radio-button value="BankTransfer">
            <mat-icon>account_balance</mat-icon>
            Bank Transfer
          </mat-radio-button>
          <mat-radio-button value="Check">
            <mat-icon>receipt_long</mat-icon>
            Check
          </mat-radio-button>
        </mat-radio-group>

        <!-- Amount to Pay -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount to Pay</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="amount"
            step="0.01"
            min="0.01"
            [max]="data.invoice.totalAmount"
          >
          <span matPrefix>€&nbsp;</span>
          @if (paymentForm.get('amount')?.hasError('required')) {
            <mat-error>Amount is required</mat-error>
          }
          @if (paymentForm.get('amount')?.hasError('min')) {
            <mat-error>Amount must be greater than 0</mat-error>
          }
          @if (paymentForm.get('amount')?.hasError('max')) {
            <mat-error>Amount cannot exceed invoice total</mat-error>
          }
        </mat-form-field>

        <div class="quick-amounts">
          <button 
            mat-stroked-button 
            type="button"
            (click)="setFullAmount()"
          >
            Pay Full Amount
          </button>
          @if (data.invoice.totalAmount > 100) {
            <button 
              mat-stroked-button 
              type="button"
              (click)="setHalfAmount()"
            >
              Pay Half
            </button>
          }
        </div>

        <!-- Credit Card Details (shown only for credit card payment) -->
        @if (paymentForm.get('paymentMethod')?.value === 'CreditCard') {
          <div class="card-details">
            <h4>Card Details</h4>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Card Number</mat-label>
              <input 
                matInput 
                formControlName="cardNumber"
                placeholder="1234 5678 9012 3456"
                maxlength="19"
              >
              <mat-icon matPrefix>credit_card</mat-icon>
              @if (paymentForm.get('cardNumber')?.hasError('required')) {
                <mat-error>Card number is required</mat-error>
              }
            </mat-form-field>

            <div class="card-row">
              <mat-form-field appearance="outline">
                <mat-label>Expiry Date</mat-label>
                <input 
                  matInput 
                  formControlName="expiryDate"
                  placeholder="MM/YY"
                  maxlength="5"
                >
                @if (paymentForm.get('expiryDate')?.hasError('required')) {
                  <mat-error>Expiry date is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>CVV</mat-label>
                <input 
                  matInput 
                  formControlName="cvv"
                  type="password"
                  placeholder="123"
                  maxlength="4"
                >
                @if (paymentForm.get('cvv')?.hasError('required')) {
                  <mat-error>CVV is required</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Cardholder Name</mat-label>
              <input 
                matInput 
                formControlName="cardholderName"
                placeholder="John Doe"
              >
              @if (paymentForm.get('cardholderName')?.hasError('required')) {
                <mat-error>Cardholder name is required</mat-error>
              }
            </mat-form-field>
          </div>
        }

        <!-- Notes -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes (Optional)</mat-label>
          <textarea 
            matInput 
            formControlName="notes"
            rows="3"
            placeholder="Add any additional notes..."
          ></textarea>
        </mat-form-field>
      </form>

      @if (error()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          {{ error() }}
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="processing()">
        Cancel
      </button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSubmit()"
        [disabled]="!paymentForm.valid || processing()"
      >
        @if (processing()) {
          <mat-spinner diameter="20"></mat-spinner>
          Processing...
        } @else {
          <mat-icon>check</mat-icon>
          Confirm Payment
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }

    mat-dialog-content {
      min-width: 500px;
      padding: 24px;
    }

    .invoice-details {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;

      h3 {
        margin: 0 0 16px;
        font-size: 18px;
        font-weight: 500;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          color: rgba(0, 0, 0, 0.6);
        }

        .value {
          font-weight: 500;

          &.amount {
            color: #1976d2;
            font-size: 18px;
          }

          &.overdue {
            color: #f44336;
          }
        }
      }
    }

    .payment-form {
      h3 {
        margin: 0 0 16px;
        font-size: 18px;
        font-weight: 500;
      }

      h4 {
        margin: 16px 0 12px;
        font-size: 16px;
        font-weight: 500;
      }

      .payment-method-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;

        mat-radio-button {
          mat-icon {
            vertical-align: middle;
            margin-right: 8px;
          }
        }
      }

      .full-width {
        width: 100%;
      }

      .quick-amounts {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
      }

      .card-details {
        background: #f9f9f9;
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;

        .card-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #ffebee;
      color: #c62828;
      border-radius: 4px;
      margin-top: 16px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;

      button {
        mat-icon {
          margin-right: 4px;
        }

        mat-spinner {
          display: inline-block;
          margin-right: 8px;
        }
      }
    }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: 0;
        width: 100%;
      }

      .card-details .card-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InvoicePaymentDialogComponent implements OnInit {
  paymentForm!: FormGroup;
  processing = signal(false);
  error = signal<string | null>(null);
  private keycloakService = inject(KeycloakService);

  constructor(
    private fb: FormBuilder,
    private ownerService: OwnerService,
    @Inject(MatDialogRef) public dialogRef: MatDialogRef<InvoicePaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { invoice: CopropertyInvoice }
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private getUserId(): string {
    const token = this.keycloakService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || 'unknown-user';
      } catch (error) {
        console.error('Error parsing token:', error);
        return 'unknown-user';
      }
    }
    return 'unknown-user';
  }

  private initializeForm(): void {
    this.paymentForm = this.fb.group({
      paymentMethod: ['CreditCard', Validators.required],
      amount: [
        this.data.invoice.totalAmount,
        [
          Validators.required,
          Validators.min(0.01),
          Validators.max(this.data.invoice.totalAmount)
        ]
      ],
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      cardholderName: [''],
      notes: ['']
    });

    // Add validators for credit card fields when credit card is selected
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      const cardNumberControl = this.paymentForm.get('cardNumber');
      const expiryDateControl = this.paymentForm.get('expiryDate');
      const cvvControl = this.paymentForm.get('cvv');
      const cardholderNameControl = this.paymentForm.get('cardholderName');

      if (method === 'CreditCard') {
        cardNumberControl?.setValidators([Validators.required]);
        expiryDateControl?.setValidators([Validators.required]);
        cvvControl?.setValidators([Validators.required]);
        cardholderNameControl?.setValidators([Validators.required]);
      } else {
        cardNumberControl?.clearValidators();
        expiryDateControl?.clearValidators();
        cvvControl?.clearValidators();
        cardholderNameControl?.clearValidators();
      }

      cardNumberControl?.updateValueAndValidity();
      expiryDateControl?.updateValueAndValidity();
      cvvControl?.updateValueAndValidity();
      cardholderNameControl?.updateValueAndValidity();
    });
  }

  setFullAmount(): void {
    this.paymentForm.patchValue({ amount: this.data.invoice.totalAmount });
  }

  setHalfAmount(): void {
    this.paymentForm.patchValue({ 
      amount: Math.round(this.data.invoice.totalAmount / 2 * 100) / 100 
    });
  }

  isOverdue(): boolean {
    return new Date(this.data.invoice.dueDate) < new Date();
  }

  getAmountPaid(): number {
    // TODO: Get actual amount paid from backend
    return 0;
  }

  getRemainingAmount(): number {
    return this.data.invoice.totalAmount - this.getAmountPaid();
  }

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    const formValue = this.paymentForm.value;
    
    // TODO: In production, integrate with Stripe for credit card payments
    // For now, just record the payment directly
    const paymentInput = {
      invoiceId: this.data.invoice.id,
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      paymentDate: new Date(),
      notes: formValue.notes,
      createdBy: this.getUserId()
    };

    this.ownerService.recordPayment(paymentInput).subscribe({
      next: (payment) => {
        this.processing.set(false);
        this.dialogRef.close(payment);
      },
      error: (error) => {
        this.processing.set(false);
        this.error.set(error.message || 'Failed to process payment. Please try again.');
        console.error('Payment error:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
