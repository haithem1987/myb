import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';

@Component({
  selector: 'app-coproperty-redirect',
  standalone: true,
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="text-align: center;">
        <h2>Redirection...</h2>
        <p>Chargement de votre espace...</p>
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
    const roles = this.keycloakService.getRoles();
    console.log('User roles:', roles);

    // Priority-based routing
    if (roles.includes('coproperty-syndic')) {
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
      console.log('Redirecting to admin dashboard');
      this.router.navigate(['/coproperty/admin/dashboard']);
    } else {
      console.log('No valid role found, redirecting to access denied');
      this.router.navigate(['/access-denied']);
    }
  }
}
