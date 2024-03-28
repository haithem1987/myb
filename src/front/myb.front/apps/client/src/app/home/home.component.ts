import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'libs/auth/src/lib/keycloack/keycloack.service';

@Component({
  selector: 'myb-front-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  constructor(private keycloakService: KeycloakService) {}
  logout() {
    console.log('logout');
    this.keycloakService.logout();
  }
}
