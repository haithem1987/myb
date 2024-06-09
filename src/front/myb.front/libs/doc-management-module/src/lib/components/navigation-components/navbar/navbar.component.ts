import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { KeycloakProfile } from 'keycloak-js';
import { Observable } from 'rxjs';


@Component({
  selector: 'myb-front-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  user$: Observable<KeycloakProfile | null>;

  constructor(private keycloakService: KeycloakService) {
    this.user$ = this.keycloakService.profile$;
  }

  ngOnInit(): void {
    if (this.keycloakService.isAuthenticated()) {
      this.user$ = this.keycloakService.profile$;
    }
  }

  logout(): void {
    this.keycloakService.logout();
  }

  getAvatarColor(username: string): string {
    const colors = [
      '#FFB6C1',
      '#FF69B4',
      '#FF1493',
      '#DB7093',
      '#C71585',
      '#FFA07A',
      '#FA8072',
      '#E9967A',
      '#F08080',
      '#CD5C5C',
      '#DC143C',
      '#B22222',
      '#FF4500',
      '#FF8C00',
      '#FFA500',
      '#FFD700',
      '#FFFF00',
      '#ADFF2F',
      '#7FFF00',
      '#7CFC00',
      '#00FF00',
      '#32CD32',
      '#00FA9A',
      '#00FF7F',
      '#3CB371',
      '#2E8B57',
      '#228B22',
      '#006400',
      '#9ACD32',
      '#6B8E23',
      '#556B2F',
      '#66CDAA',
      '#8FBC8B',
      '#20B2AA',
      '#008B8B',
      '#008080',
      '#00CED1',
      '#40E0D0',
      '#48D1CC',
      '#AFEEEE',
      '#7FFFD4',
      '#B0E0E6',
      '#ADD8E6',
      '#87CEEB',
      '#87CEFA',
      '#4682B4',
      '#4169E1',
      '#0000FF',
      '#0000CD',
      '#00008B',
      '#000080',
      '#191970',
      '#8A2BE2',
      '#9932CC',
      '#9400D3',
      '#800080',
      '#9370DB',
      '#DDA0DD',
      '#EE82EE',
      '#DA70D6',
      '#FF00FF',
      '#BA55D3',
      '#D8BFD8',
      '#E6E6FA',
      '#DCDCDC',
    ];
    const charCode = username.charCodeAt(0);
    const colorIndex = charCode % colors.length;
    return colors[colorIndex];
  }
  
}
