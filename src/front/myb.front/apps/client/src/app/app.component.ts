import { Router, RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';
import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

@Component({
  standalone: true,
  imports: [NxWelcomeComponent, RouterModule],
  selector: 'myb-front-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'client';
  router: any;

  constructor(private keycloakService: KeycloakService, router: Router) {}

  ngOnInit(): void {
    this.keycloakService
      .init()
      .then((authenticated) => {
        console.log(`Authenticated: ${authenticated}`);
        // If not authenticated, you can redirect to Keycloak's login page here
      })
      .catch((error) =>
        console.error(`Keycloak initialization failed: ${error}`)
      );
  }
}
