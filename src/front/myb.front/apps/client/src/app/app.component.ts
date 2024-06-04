import { Component, OnInit } from '@angular/core';
import '@angular/localize/init';
import { Router, RouterModule } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { NxWelcomeComponent } from './nx-welcome.component';

@Component({
  standalone: true,
  imports: [NxWelcomeComponent, RouterModule],
  selector: 'myb-front-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'client';

  constructor(
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.keycloakService
      .init()
      .then((authenticated) => {
        console.log(`Authenticated: ${authenticated}`);
        if (authenticated) {
          this.logUserProfile();
        } else {
          this.keycloakService.login();
        }
      })
      .catch((error) => {
        console.error(`Keycloak initialization failed: ${error}`);
      });
  }

  private logUserProfile(): void {
    const profile = this.keycloakService.getProfile();
    console.log('User Profile:', profile);
  }
}
