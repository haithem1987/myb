import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-access-denied-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './access-denied-page.component.html',
  styleUrl: './access-denied-page.component.css',
})
export class AccessDeniedPageComponent {
  constructor(
    private router: Router,
    private keycloakService: KeycloakService
  ) {}

  goToHome() {
    this.router.navigate(['']);
  }
  goToLogin() {
    this.keycloakService.login();
  }
}
