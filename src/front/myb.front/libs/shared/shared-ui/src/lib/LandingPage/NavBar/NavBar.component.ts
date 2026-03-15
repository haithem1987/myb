import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { KeycloakService } from '../../../../../../auth/src/lib/keycloak.service';
import { CounterService } from '../FeaturesSection/CounterService';
import { Subscription, filter } from 'rxjs';
import { UserDropdownComponent } from '../../components/user-dropdown/user-dropdown.component';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-nav-bar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UserDropdownComponent,
    LanguageSwitcherComponent,
    TranslateModule,
  ],
  templateUrl: './NavBar.component.html',
  styleUrl: './NavBar.component.css',
})
export class NavBarComponent {
  limitedCount$ = this.counterService.counter$.pipe(
    filter((value) => value.count < 3)
  );

  constructor(
    public keycloakService: KeycloakService,
    public counterService: CounterService,
    private router: Router,
  ) {}

  incrementCount() {
    this.counterService.increment();
  }

  onLogin(): void {
    this.keycloakService.login();
  }

  /** Navigate to the Angular registration page (Email / Google choice) */
  onRegister(): void {
    this.router.navigate(['/register']);
  }

  onLogout(): void {
    this.keycloakService.logout();
  }
}
