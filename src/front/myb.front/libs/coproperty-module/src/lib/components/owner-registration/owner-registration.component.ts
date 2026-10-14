import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { AuthLayoutComponent } from 'libs/shared/shared-ui/src/lib/components/auth-layout/auth-layout.component';

@Component({
  selector: 'myb-owner-registration',
  standalone: true,
  imports: [CommonModule, TranslateModule, AuthLayoutComponent],
  templateUrl: './owner-registration.component.html',
  styleUrls: ['./owner-registration.component.scss'],
})
export class OwnerRegistrationComponent implements OnInit {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);

  ngOnInit(): void {
    // If already authenticated, skip registration page
    if (this.keycloakService.isAuthenticated()) {
      this.router.navigate(['/register/complete-profile']);
      return;
    }

    // Skip the intermediate provider choice screen and go directly to Keycloak registration.
    this.registerWithEmail();
  }

  registerWithEmail(): void {
    this.keycloakService.registerWithRedirect(
      `${window.location.origin}/register/complete-profile`
    );
  }

  goToLogin(): void {
    this.keycloakService.login();
  }
}
