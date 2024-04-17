import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../../../../../../auth/src/lib/keycloak.service';

@Component({
  selector: 'myb-front-nav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './NavBar.component.html',
  styleUrl: './NavBar.component.css',
})
export class NavBarComponent {
  constructor(public keycloakService: KeycloakService) {}

  onLogin(): void {
    this.keycloakService.login();
  }

  onLogout(): void {
    this.keycloakService.logout();
  }
}
