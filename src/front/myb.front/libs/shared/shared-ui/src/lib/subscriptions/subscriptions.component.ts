import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { SubscriptionService } from 'libs/shared/infra/services/subscription.service';
import { Observable } from 'rxjs';
import { Subscription } from 'libs/shared/infra/models/subscription.model';
import { RouterOutlet } from '@angular/router';
import { BreadcrumbComponent } from '../components/breadcrumb/breadcrumb.component';
import { NavBarComponent } from '../LandingPage/NavBar/NavBar.component';

@Component({
  selector: 'myb-front-subscriptions',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    BreadcrumbComponent,
    RouterOutlet,
    NavBarComponent,
  ],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.css',
})
export class SubscriptionsComponent implements OnInit {
  subscriptions$: Observable<Subscription[]> =
    this.subscriptionService.subscriptions$;

  constructor(
    private subscriptionService: SubscriptionService,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
    this.subscriptions$.subscribe((subscriptions) => {
      console.log('subscriptions', subscriptions);
    });
  }

  // Load subscriptions and provide them as an observable
  loadSubscriptions(): void {
    const { id: userId }: any = this.keycloakService.getProfile();
    this.subscriptions$ = this.subscriptionService.loadSubscriptions(userId);
  }

  // Unsubscribe from a service and reload subscriptions
  unsubscribe(serviceId: number): void {
    const confirmed = confirm('Are you sure you want to unsubscribe?');
    if (confirmed) {
      const { id: userId }: any = this.keycloakService.getProfile();

      this.subscriptionService.unsubscribe(userId, serviceId).subscribe({

        next: () => {
          console.log(`Unsubscribed from service ${serviceId}`);
          this.loadSubscriptions(); // Reload subscriptions after unsubscribe
        },
        error: (err) => {
          console.error('Failed to unsubscribe:', err);
        },
      });
    }
  }
}
