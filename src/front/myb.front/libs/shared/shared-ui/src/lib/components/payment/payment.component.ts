import {
  Component,
  Input,
  ViewChild,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { StripeService, StripeCardComponent } from 'ngx-stripe';
import {
  StripeCardElementOptions,
  StripeElementsOptions,
} from '@stripe/stripe-js';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { TranslateModule } from '@ngx-translate/core';

interface Service {
  serviceId: number;
  serviceName: string;
}

@Component({
  selector: 'myb-front-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StripeCardComponent,
    TranslateModule,
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnDestroy {
  @Input() service!: Service;
  @Input() price!: number;
  @Input() currency: string = 'usd';

  @Output() paymentSuccess = new EventEmitter<void>(); // Emit event on success

  @ViewChild(StripeCardComponent) card: StripeCardComponent | undefined;
  private activeModal: NgbModalRef | undefined;

  cardForm: FormGroup;
  isLoading = false;
  isPaymentSuccessful = false;
  isPaymentFailed = false;

  cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        iconColor: '#666EE8',
        color: '#31325F',
        fontWeight: '300',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '18px',
        '::placeholder': {
          color: '#CFD7E0',
        },
      },
    },
  };

  elementsOptions: StripeElementsOptions = {
    locale: 'en',
  };

  constructor(
    private fb: FormBuilder,
    private stripeService: StripeService,
    private http: HttpClient,
    private keycloakService: KeycloakService,
    private modalService: NgbModal
  ) {
    this.cardForm = this.fb.group({
      name: [''],
    });
  }

  open(content: any) {
    this.activeModal = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  closeModal() {
    if (this.activeModal) {
      this.activeModal.close();
      this.activeModal = undefined;
    }
  }

  ngOnDestroy() {
    this.closeModal();
  }

  createToken() {
    this.isLoading = true;
    const name = this.cardForm.get('name')?.value;
    const { id: userId, email }: any = this.keycloakService.getProfile();

    if (this.card) {
      this.stripeService.createToken(this.card.element, { name }).subscribe(
        (result) => {
          if (result.token) {
            const paymentData = {
              amount: this.price * 100,
              currency: this.currency,
              receiptEmail: email,
              userId: userId,
              serviceId: this.service.serviceId,
              serviceName: this.service.serviceName,
              paymentMethod: 'Card',
              isRecurring: false,
            };

            this.http
              .post(
                'http://localhost:5000/api/payment/create-payment-intent',
                paymentData
              )
              .subscribe(
                () => {
                  this.isLoading = false;
                  this.isPaymentSuccessful = true;
                  this.paymentSuccess.emit(); // Emit success event
                },
                () => {
                  this.isLoading = false;
                  this.isPaymentFailed = true;
                }
              );
          } else if (result.error) {
            this.isLoading = false;
            this.isPaymentFailed = true;
          }
        },
        () => {
          this.isLoading = false;
          this.isPaymentFailed = true;
        }
      );
    } else {
      console.error('Card component not found');
    }
  }
}
