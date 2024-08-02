import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Keycloak, { KeycloakProfile } from 'keycloak-js';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  private keycloak!: Keycloak;
  private profileSubject: BehaviorSubject<KeycloakProfile | null> = new BehaviorSubject<KeycloakProfile | null>(null);
  public profile$: Observable<KeycloakProfile | null> = this.profileSubject.asObservable();

  private adminToken: string | null = null;
  private userIdSubject: BehaviorSubject<string | null> = new BehaviorSubject<
    string | null
  >(null);
  public userId$: Observable<string | null> = this.userIdSubject.asObservable();

  constructor(private http: HttpClient) {}

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
          // console.log('Keycloak authentication success:', authenticated);
          if (authenticated) {
            this.loadUserProfile()
              .then(() => {
                const profile = this.profileSubject.value;
                if (profile && profile.id) {
                  this.userIdSubject.next(profile.id);
                }
                resolve(authenticated);
              })
              .catch((err) => {
                console.error('Failed to load user profile:', err);
                reject(err);
              });
          } else {
            resolve(authenticated);
          }
        })
        .catch((err) => {
          console.error('Keycloak initialization error:', err);
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
    return this.profileSubject.value;
  }

  isAuthenticated(): boolean | undefined {
    return this.keycloak.authenticated;
  }

  getUserRoles(): string[] {
    if (!this.keycloak.tokenParsed || !this.keycloak.tokenParsed.realm_access) {
      return [];
    }

    const resourceAccess = this.keycloak.tokenParsed.realm_access;
    const clientRoles = resourceAccess?.roles || [];
    return clientRoles;
  }

  hasRole(role: string): boolean {
    const roles = this.getUserRoles();
    console.log('roles', roles);
    return roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some((role) => userRoles.includes(role));
  }

  hasAllRoles(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.every((role) => userRoles.includes(role));
  }

  isUserManager(): boolean {
    return this.hasRole('manager_myb');
  }

  private loadUserProfile(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.keycloak
        .loadUserProfile()
        .then((profile) => {
          // console.log('User profile loaded successfully:', profile);
          this.profileSubject.next(profile);
          this.userIdSubject.next(profile?.id ?? null); // Set userId here
          resolve();
        })
        .catch((err) => {
          console.error('Error loading user profile:', err);
          this.profileSubject.next(null);
          this.userIdSubject.next(null); // Reset userId on error
          reject(err);
        });
    });
  }

  private getAdminToken(): Promise<void> {
    const body = new URLSearchParams();
    body.set('client_id', 'admin-cli');
    body.set('username', 'user'); // replace with your admin username
    body.set('password', 'bitnami'); // replace with your admin password
    body.set('grant_type', 'password');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    });

    return this.http
      .post<{ access_token: string }>(
        'https://www.keycloak.forlink-group.com/realms/master/protocol/openid-connect/token',
        body.toString(),
        { headers }
      )
      .toPromise()
      .then((response: any) => {
        this.adminToken = response.access_token;
      })
      .catch((err) => {
        console.error('Error obtaining admin token:', err);
        this.adminToken = null;
        throw err;
      });
  }

  getUsersByEmailForClient(email: string): Promise<any> {
    if (!this.adminToken) {
      return this.getAdminToken().then(() =>
        this.queryUsersByEmailForClient(email)
      );
    } else {
      return this.queryUsersByEmailForClient(email);
    }
  }

  private queryUsersByEmailForClient(email: string): Promise<any> {
    if (!this.adminToken) {
      return Promise.reject('Admin token is not available');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.adminToken}`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    });

    return this.http
      .get(
        `https://www.keycloak.forlink-group.com/admin/realms/MYB/users?email=${email}`,
        { headers }
      )
      .toPromise()
      .then((users: any) => {
        // Filter users by client role
        const clientRolesPromises = users.map((user: any) =>
          this.http
            .get(
              `https://www.keycloak.forlink-group.com/admin/realms/MYB/users/${user.id}/role-mappings/clients/${this.keycloak.clientId}`,
              { headers }
            )
            .toPromise()
            .then((roles: any) => ({ ...user, roles }))
        );

        return Promise.all(clientRolesPromises).then((usersWithRoles) =>
          usersWithRoles.filter((user: any) => user.roles.length > 0)
        );
      })
      .catch((err) => {
        console.error('Error fetching users by email for client:', err);
        throw err;
      });
  }
}
