import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../components/card/card.component';
import { AuthConfirmationModalComponent } from '../../components/auth-confirmation-modal/auth-confirmation-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { PaymentComponent } from '../../components/payment/payment.component';
import { SubscriptionService } from 'libs/shared/infra/services/subscription.service';
import { BehaviorSubject, map, Observable } from 'rxjs';

interface App {
  id: number;
  name: string;
  icon: string;
  description: string;
  route: string;
  price: number;
  currency: string;
}

@Component({
  selector: 'myb-front-apps-section',
  standalone: true,
  imports: [CommonModule, CardComponent, TranslateModule],
  templateUrl: './apps-section.component.html',
  styleUrls: ['./apps-section.component.css'],
})
export class AppsSectionComponent implements OnInit {
  list: App[] = [
    {
      id: 2,
      name: 'DOCUMENT_MANAGEMENT',
      icon: 'evaluation.png',
      description: 'DOCUMENT_MANAGEMENT_DESC',
      route: '/documents',
      price: 20,
      currency: 'USD',
    },
    {
      id: 1,
      name: 'TIMESHEET_MANAGEMENT',
      icon: 'calendar.png',
      description: 'TIMESHEET_DESC',
      route: '/timesheet',
      price: 15,
      currency: 'USD',
    },
    {
      id: 3,
      name: 'INVOICE_MANAGEMENT',
      icon: 'finance.png',
      description: 'INVOICE_MANAGEMENT_DESC',
      route: '/invoice',
      price: 30,
      currency: 'USD',
    },
  ];

  subscribedServices$ = new BehaviorSubject<number[]>([]);

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private keycloakService: KeycloakService,
    private subscriptionService: SubscriptionService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    const { id: userId }: any = this.keycloakService.getProfile();
    this.subscriptionService.loadSubscriptions(userId).subscribe({
      next: (subscriptions) => {
        console.log('subscriptions', subscriptions);
        const serviceIds = subscriptions.map((sub) => sub.ServiceId);
        this.subscribedServices$.next(serviceIds);
        this.cd.detectChanges(); // Trigger change detection
      },
      error: (err) => console.error('Failed to load subscriptions:', err),
    });
  }

  isSubscribed(serviceId: number): Observable<boolean> {
    return this.subscribedServices$
      .asObservable()
      .pipe(map((services) => services.includes(serviceId)));
  }

  unsubscribe(serviceId: number): void {
    const confirmed = confirm('Are you sure you want to unsubscribe?');
    if (confirmed) {
      const { id: userId }: any = this.keycloakService.getProfile();
      this.subscriptionService.unsubscribe(userId, serviceId).subscribe({
        next: () => {
          console.log(`Successfully unsubscribed from service ${serviceId}`);
          const updatedServices = this.subscribedServices$
            .getValue()
            .filter((id) => id !== serviceId);
          this.subscribedServices$.next(updatedServices);
          this.cd.detectChanges(); // Trigger change detection
        },
        error: (err) => console.error('Failed to unsubscribe:', err),
      });
    }
  }

  openPaymentModal(service: App): void {
    const modalRef = this.modalService.open(PaymentComponent, {
      size: 'lg',
      centered: true,
    });
    modalRef.componentInstance.service = {
      serviceId: service.id,
      serviceName: service.name,
    };
    modalRef.componentInstance.price = service.price;
    modalRef.componentInstance.currency = service.currency;
    modalRef.componentInstance.paymentSuccess.subscribe(() => {
      console.log(`Payment successful for service ${service.name}`);
      this.loadSubscriptions(); // Reload subscriptions after successful payment
    });
  }

  navigateToApp(app: App): void {
    this.isSubscribed(app.id).subscribe((subscribed) => {
      if (!subscribed) {
        confirm(
          'You are not subscribed to this service. Do you want to subscribe?'
        );
      } else {
        this.router.navigate([app.route]);
      }
    });
  }
}
