import { Injectable } from '@angular/core';
import Keycloak, { KeycloakProfile } from 'keycloak-js';

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  private keycloak!: Keycloak;
  private profile!: KeycloakProfile | null;

  constructor() {}

  init(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.keycloak = new Keycloak({
        url: 'https://www.keycloak.forlink-group.com/',
        realm: 'MYB',
        clientId: 'MYB-client',
      });

      this.keycloak
        .init({
          onLoad: 'login-required',
          checkLoginIframe: false,
        })
        .then((authenticated) => {
          if (authenticated) {
            this.loadUserProfile().then(() => resolve(authenticated));
          } else {
            resolve(authenticated);
          }
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

  getProfile(): KeycloakProfile | null {
    return this.profile;
  }

  isAuthenticated(): boolean | undefined {
    return this.keycloak.authenticated;
  }

  private loadUserProfile(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.keycloak
        .loadUserProfile()
        .then((profile) => {
          this.profile = profile;
          resolve();
        })
        .catch((err) => {
          this.profile = null;
          reject(err);
        });
    });
  }
}
