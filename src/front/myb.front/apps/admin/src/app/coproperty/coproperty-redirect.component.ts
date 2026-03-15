import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';

@Component({
  selector: 'app-coproperty-redirect',
  standalone: true,
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="text-align: center;">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <h4>Redirection...</h4>
        <p class="text-muted">Chargement de votre espace en fonction de votre rôle...</p>
      </div>
    </div>
  `
})
export class CopropertyRedirectComponent implements OnInit {
  private router = inject(Router);
  private keycloakService = inject(KeycloakService);

  ngOnInit() {
    this.redirectBasedOnRole();
  }

  private redirectBasedOnRole() {
    const roles = this.keycloakService.getUserRoles();
    console.log('CopropertyRedirect — User roles from Keycloak:', roles);

    const hasSyndic = roles.includes('coproperty-syndic') || roles.includes('coproperty-admin');
    const hasOwner = roles.includes('coproperty-owner');

    // If user has BOTH syndic and owner roles, send them to home to choose
    if (hasSyndic && hasOwner) {
      console.log('Dual-role user (syndic + owner): redirecting to home for selection');
      this.router.navigate(['/home']);
      return;
    }

    // Priority-based routing using client roles
    if (hasSyndic) {
      console.log('Redirecting to syndic dashboard');
      this.router.navigate(['/coproperty/syndic/dashboard']);
    } else if (roles.includes('coproperty-council')) {
      console.log('Redirecting to council dashboard');
      this.router.navigate(['/coproperty/council/dashboard']);
    } else if (roles.includes('coproperty-accountant')) {
      console.log('Redirecting to accountant dashboard');
      this.router.navigate(['/coproperty/accountant/dashboard']);
    } else if (roles.includes('coproperty-owner')) {
      console.log('Redirecting to owner dashboard');
      this.router.navigate(['/coproperty/owner/dashboard']);
    } else if (roles.includes('system-admin')) {
      console.log('Redirecting to syndic dashboard (admin fallback)');
      this.router.navigate(['/coproperty/syndic/dashboard']);
    } else {
      console.warn('No valid coproperty role found. User roles:', roles);
      this.router.navigate(['/access-denied']);
    }
  }
}
