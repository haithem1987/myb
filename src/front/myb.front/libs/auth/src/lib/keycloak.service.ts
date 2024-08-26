import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Keycloak, { KeycloakProfile } from 'keycloak-js';
import {
  BehaviorSubject,
  firstValueFrom,
  lastValueFrom,
  Observable,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  private keycloak!: Keycloak;
  private profileSubject: BehaviorSubject<KeycloakProfile | null> =
    new BehaviorSubject<KeycloakProfile | null>(null);
  public profile$: Observable<KeycloakProfile | null> =
    this.profileSubject.asObservable();

  private adminToken: string | null = null;
  private clientIdCache: string | null = null; // Cache clientId here
  private userIdSubject: BehaviorSubject<string | null> = new BehaviorSubject<
    string | null
  >(null);
  public userId$: Observable<string | null> = this.userIdSubject.asObservable();

  private initialized = false;

  constructor(private http: HttpClient) {}

  async init(): Promise<boolean> {
    // if (this.initialized) {
    //   return true;
    // }

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
            this.loadUserProfile().then(() => {
              this.initialized = true;
              resolve(true);
            });
          } else {
            this.initialized = true;
            resolve(false);
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

  register(): void {
    this.keycloak.register();
  }

  logout(): void {
    this.keycloak.logout();
  }

  getToken(): string | undefined {
    return this.keycloak?.token;
  }

  getProfile(): KeycloakProfile | null {
    return this.profileSubject?.value;
  }

  isAuthenticated(): boolean | undefined {
    return this.keycloak?.authenticated;
  }

  getUserRoles(): string[] {
    if (!this.keycloak.tokenParsed) {
      return [];
    }

    const realmRoles = this.keycloak.tokenParsed.realm_access?.roles || [];
    const clientRoles =
      this.keycloak.tokenParsed.resource_access?.['MYB-client']?.roles || [];

    return [...realmRoles, ...clientRoles];
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
          this.profileSubject.next(profile);
          this.userIdSubject.next(profile?.id ?? null);
          resolve();
        })
        .catch((err) => {
          console.error('Error loading user profile:', err);
          this.profileSubject.next(null);
          this.userIdSubject.next(null);
          reject(err);
        });
    });
  }

  private async getAdminToken(): Promise<void> {
    const body = new URLSearchParams();
    body.set('client_id', 'admin-cli');
    body.set('username', 'user');
    body.set('password', 'bitnami');
    body.set('grant_type', 'password');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    try {
      const response: any = await firstValueFrom(
        this.http.post(
          'https://www.keycloak.forlink-group.com/realms/master/protocol/openid-connect/token',
          body.toString(),
          { headers }
        )
      );
      this.adminToken = response.access_token;
    } catch (err) {
      console.error('Error obtaining admin token:', err);
      this.adminToken = null;
      throw err;
    }
  }

  private async getClientId(): Promise<string | null> {
    if (this.clientIdCache) {
      return this.clientIdCache; // Return cached clientId
    }

    if (!this.adminToken) {
      await this.getAdminToken();
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.adminToken}`,
      'Content-Type': 'application/json',
    });

    try {
      const clients: any = await firstValueFrom(
        this.http.get(
          'https://www.keycloak.forlink-group.com/admin/realms/MYB/clients?clientId=MYB-client',
          { headers }
        )
      );

      if (clients && clients.length > 0) {
        this.clientIdCache = clients[0].id;
        return this.clientIdCache;
      } else {
        throw new Error('Client ID not found');
      }
    } catch (err) {
      console.error('Error fetching client ID:', err);
      return null;
    }
  }

  async getUsersByEmailForClient(partialEmail: string): Promise<any> {
    try {
      if (!this.adminToken) {
        await this.getAdminToken();
      }
      return this.queryUsersByPartialEmailForClient(partialEmail);
    } catch (err) {
      console.error('Error fetching admin token:', err);
      throw err;
    }
  }

  private async queryUsersByPartialEmailForClient(
    partialEmail: string
  ): Promise<any> {
    if (!this.adminToken) {
      throw new Error('Admin token is not available');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.adminToken}`,
    });

    try {
      const users: any = await firstValueFrom(
        this.http.get(
          `https://www.keycloak.forlink-group.com/admin/realms/MYB/users?email=${partialEmail}`,
          { headers }
        )
      );

      console.log('users:', users);

      const clientId = await this.getClientId();

      const usersWithRoles = await Promise.all(
        users.map(async (user: any) => {
          console.log(
            `Fetching role mappings for user: ${user.username} with clientId: ${clientId}`
          );

          try {
            const roles: any = await firstValueFrom(
              this.http.get(
                `https://www.keycloak.forlink-group.com/admin/realms/MYB/users/${user.id}/role-mappings/clients/${clientId}`,
                { headers }
              )
            );
            return { ...user, roles: roles.map((role: any) => role.name) }; // Extract role names
          } catch (error) {
            console.error(
              `Error fetching role mappings for user: ${user.username}`,
              error
            );
            return { ...user, roles: [] };
          }
        })
      );

      console.log('Users with roles:', usersWithRoles);
      const filteredUsers = usersWithRoles.filter(
        (user: any) =>
          !user.roles.includes('MYB_EMPLOYEE') &&
          !user.roles.includes('MYB_MANAGER')
      );

      return filteredUsers;
    } catch (err) {
      console.error('Error fetching users by partial email for client:', err);
      throw err;
    }
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    try {
      if (!this.adminToken) {
        await this.getAdminToken();
      }

      const clientId = await this.getClientId();
      if (!clientId) {
        throw new Error('Client ID could not be retrieved');
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json',
      });

      const roleUrl = `https://www.keycloak.forlink-group.com/admin/realms/MYB/clients/${clientId}/roles/${roleName}`;
      const role = await firstValueFrom(this.http.get(roleUrl, { headers }));

      const assignRoleUrl = `https://www.keycloak.forlink-group.com/admin/realms/MYB/users/${userId}/role-mappings/clients/${clientId}`;
      await firstValueFrom(this.http.post(assignRoleUrl, [role], { headers }));

      console.log(`Successfully assigned role ${roleName} to user ${userId}`);
    } catch (err) {
      console.error(`Error assigning role ${roleName} to user ${userId}:`, err);
    }
  }
}
