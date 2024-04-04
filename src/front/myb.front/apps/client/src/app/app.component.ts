import { RouterModule } from '@angular/router';
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

  constructor(private keycloakService: KeycloakService) {}

  ngOnInit(): void {
    this.keycloakService
      .init()
      .then((authenticated) => {
        if (authenticated) {
          console.log('Keycloak is initialized and user is authenticated.');
          console.log(this.keycloakService.getProfile());
          // Perform any additional actions here, such as navigating to a protected route
        } else {
          console.error(
            'Keycloak initialization failed or user is not authenticated.'
          );
        }
      })
      .catch((err) => {
        console.error('Error initializing Keycloak:', err);
      });
  }
}
