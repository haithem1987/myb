import { Injectable } from '@angular/core';
import Keycloak, { KeycloakProfile } from 'keycloak-js';

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  private keycloak!: Keycloak;

  constructor() {}

  init(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.keycloak = new Keycloak({
        url: 'https://www.keycloak.forlink-group.com',
        realm: 'MYB',
        clientId: 'MYB-client',
      });

      this.keycloak
        .init({
          onLoad: 'login-required',
          checkLoginIframe: false,
        })
        .then((authenticated) => {
          resolve(authenticated);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  login(): void {
    this.keycloak.login();
  }

  logout(): void {
    this.keycloak.logout();
  }

  getToken(): string | undefined {
    return this.keycloak.token;
  }

  getProfile(): Promise<KeycloakProfile> | undefined {
    return this.keycloak.loadUserProfile();
  }

  isAuthenticated(): boolean | undefined {
    return this.keycloak.authenticated;
  }
}
