import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    public counterService: CounterService
  ) {}

  incrementCount() {
    this.counterService.increment();
  }
  onLogin(): void {
    this.keycloakService.login();
  }
  onRegister(): void {
    this.keycloakService.register();
  }

  onLogout(): void {
    this.keycloakService.logout();
  }
}
