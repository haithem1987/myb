import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Keycloak, { KeycloakProfile } from 'keycloak-js';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { ENVIRONMENT } from './environment.token';

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  private keycloak!: Keycloak;
  private profileSubject: BehaviorSubject<KeycloakProfile | null> =
    new BehaviorSubject<KeycloakProfile | null>(null);
  public profile$: Observable<KeycloakProfile | null> =
    this.profileSubject.asObservable();

  private get currentUserToken(): string { return this.keycloak?.token ?? ''; }
  private clientIdCache: string | null = null; // Cache clientId here
  private userIdSubject: BehaviorSubject<string | null> = new BehaviorSubject<
    string | null
  >(null);
  public userId$: Observable<string | null> = this.userIdSubject.asObservable();

  private initialized = false;

  constructor(private http: HttpClient, @Inject(ENVIRONMENT) private environment: any) {}

  /**
   * URL for Keycloak Admin REST API calls.
   * In development this points to the Angular dev proxy (/keycloak-admin) to avoid
   * CORS errors when calling Keycloak's admin endpoints from the browser.
   * In production this points directly to the Keycloak server.
   */
  private get keycloakAdminUrl(): string {
    return this.environment.services.keycloak.adminUrl
      ?? this.environment.services.keycloak.url;
  }

  /**
   * Normalizes a Keycloak user ID to the standard UUID format (with hyphens).
   * Some backends store UUIDs without hyphens (32 hex chars); Keycloak Admin API
   * requires the hyphenated form: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   */
  private normalizeUuid(id: string): string {
    const clean = id.replace(/-/g, '');
    if (clean.length === 32) {
      return `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`;
    }
    return id;
  }

  private static readonly SUPPORTED_LANGUAGES = ['fr', 'en'];

  private normalizeLanguage(language: string | null | undefined): string {
    const normalized = language?.trim().toLowerCase().split('-')[0];
    return KeycloakService.SUPPORTED_LANGUAGES.includes(normalized ?? '') ? normalized! : 'en';
  }

  private getPreferredLanguage(): string {
    const saved = localStorage.getItem('language') ?? sessionStorage.getItem('language');
    const docLang = typeof document !== 'undefined' ? document.documentElement.lang : null;
    return this.normalizeLanguage(saved ?? docLang);
  }

  private withLanguageInRedirectUri(redirectUri: string, language: string): string {
    const url = new URL(redirectUri, window.location.origin);
    url.searchParams.set('app_lang', language);
    return url.toString();
  }

  private getScopedUserId(): string | undefined {
    const fromProfile = this.getProfile()?.id ?? this.getUserId();
    if (fromProfile) {
      return fromProfile;
    }

    const rawSub = this.keycloak?.tokenParsed?.sub;
    if (typeof rawSub !== 'string' || rawSub.length === 0) {
      return undefined;
    }

    const normalized = this.normalizeUuid(rawSub);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized)
      ? normalized
      : undefined;
  }

  async init(): Promise<boolean> {
    // If already initialized, return the authentication status
    if (this.initialized) {
      return this.keycloak?.authenticated ?? false;
    }

    return new Promise((resolve, reject) => {
      this.keycloak = new Keycloak({
        url: this.environment.services.keycloak.url,
        realm: this.environment.services.keycloak.realm,
        clientId: this.environment.services.keycloak.clientId,
      });

      this.keycloak
        .init({
          onLoad: 'check-sso',
          checkLoginIframe: false,
          pkceMethod: 'S256',
        })
        .then((authenticated: any) => {
          console.log('Keycloak authenticated:', authenticated);
          if (authenticated) {
            this.loadUserProfile()
              .then(() => {
                this.initialized = true;
                console.log('User profile loaded successfully');
                resolve(true);
              })
              .catch((err) => {
                console.error('Failed to load user profile:', err);
                this.initialized = true;
                resolve(true); // Still resolve as authenticated
              });
          } else {
            console.log('User not authenticated');
            this.initialized = true;
            resolve(false);
          }
        })
        .catch((err: any) => {
          console.error('Keycloak initialization error:', err);
          console.error('Error details:', JSON.stringify(err, null, 2));
          this.initialized = true;
          // Resolve instead of reject to prevent app crash
          resolve(false);
        });
    });
  }

  /**
   * Redirect to Keycloak login.
   * @param redirectUri Where Keycloak should redirect after login.
   *                    Defaults to current origin + pathname if omitted.
   */
  login(redirectUri?: string): void {
    const locale = this.getPreferredLanguage();
    const uri = this.withLanguageInRedirectUri(
      redirectUri ?? (window.location.origin + window.location.pathname),
      locale
    );
    localStorage.setItem('language', locale);
    sessionStorage.setItem('language', locale);
    console.log('Redirecting to Keycloak login with redirectUri:', uri);
    this.keycloak.login({ redirectUri: uri, locale });
  }

  /**
   * Redirect to Keycloak registration page.
   * After successful registration + email verification, Keycloak redirects to `redirectUri`.
   */
  registerWithRedirect(redirectUri?: string): void {
    const locale = this.getPreferredLanguage();
    const uri = this.withLanguageInRedirectUri(
      redirectUri ?? (window.location.origin + '/register/complete-profile'),
      locale
    );
    localStorage.setItem('language', locale);
    sessionStorage.setItem('language', locale);
    this.keycloak.register({
      redirectUri: uri,
      locale,
    });
  }

  /**
   * Trigger Keycloak login with Google identity provider hint.
   * Keycloak must have a "google" social IDP configured in the realm.
   */
  loginWithGoogle(redirectUri?: string): void {
    const locale = this.getPreferredLanguage();
    const uri = this.withLanguageInRedirectUri(
      redirectUri ?? (window.location.origin + '/register/complete-profile'),
      locale
    );
    localStorage.setItem('language', locale);
    sessionStorage.setItem('language', locale);
    this.keycloak.login({
      idpHint: 'google',
      redirectUri: uri,
      locale,
    });
  }

  /** @deprecated Use registerWithRedirect instead */
  register(): void {
    this.keycloak.register();
  }

  /**
   * Returns the Keycloak user ID (sub) of the currently authenticated user.
   */
  getUserId(): string | null {
    return this.userIdSubject.value;
  }

  logout(redirectUri?: string): void {
    this.keycloak.logout({ redirectUri: redirectUri ?? window.location.origin });
  }

  getToken(): string | undefined {
    return this.keycloak?.token || undefined;
  }

  async updateToken(): Promise<void> {
    if (this.keycloak?.isTokenExpired()) {
      try {
        await this.keycloak.updateToken(30);
      } catch (err) {
        console.error('Erreur lors du rafraîchissement du token', err);
      }
    }
  }

  /**
   * Force-refresh the Keycloak token regardless of expiry.
   * Use this after a server-side role change (e.g. coproperty-owner assignment)
   * so the new roles are reflected in the JWT claims immediately.
   */
  async forceTokenRefresh(): Promise<void> {
    try {
      await this.keycloak.updateToken(-1);
    } catch (err) {
      console.error('Failed to force-refresh Keycloak token', err);
    }
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

  // Alias for getUserRoles for convenience
  getRoles(): string[] {
    return this.getUserRoles();
  }

  private static readonly ADMIN_ROLES = ['coproperty-admin', 'system-admin'];

  /**
   * Returns the current user's id to use when scoping a coproperty list to
   * "only my assigned coproperties", or `undefined` when the caller should
   * see every coproperty (admin/system-admin, or any other non-syndic role).
   *
   * Only callers who hold the `coproperty-syndic` role and no admin-level
   * role are scoped — admins retain full visibility even on syndic-facing
   * screens/routes.
   */
  getSyndicManagerId(): string | undefined {
    const roles = this.getUserRoles();
    const isSyndic = roles.includes('coproperty-syndic');
    const isAdmin = roles.some((role) => KeycloakService.ADMIN_ROLES.includes(role));

    return isSyndic && !isAdmin ? this.getScopedUserId() : undefined;
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

  private async getClientId(): Promise<string | null> {
    if (this.clientIdCache) {
      return this.clientIdCache;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.currentUserToken}`,
      'Content-Type': 'application/json',
    });

    try {
      const keycloakUrl = this.keycloakAdminUrl;
      const clients: any = await firstValueFrom(
        this.http.get(
          `${keycloakUrl}/admin/realms/MYB/clients?clientId=MYB-client`,
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
    return this.queryUsersByPartialEmailForClient(partialEmail);
  }

  private async queryUsersByPartialEmailForClient(
    partialEmail: string
  ): Promise<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.currentUserToken}`,
    });

    try {
      const keycloakUrl = this.keycloakAdminUrl;
      const users: any = await firstValueFrom(
        this.http.get(
          `${keycloakUrl}/admin/realms/MYB/users?email=${partialEmail}`,
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
            const keycloakUrl = this.keycloakAdminUrl;
            const roles: any = await firstValueFrom(
              this.http.get(
                `${keycloakUrl}/admin/realms/MYB/users/${user.id}/role-mappings/clients/${clientId}`,
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

  /**
   * Create a new user in Keycloak and return the created user's ID.
   * Optionally sets a temporary password and assigns a client role.
   */
  async createUser(options: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    role?: string;
    enabled?: boolean;
  }): Promise<string> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.currentUserToken}`,
      'Content-Type': 'application/json',
    });

    const keycloakUrl = this.keycloakAdminUrl;

    // Build the user representation
    const userPayload: any = {
      username: options.email,
      email: options.email,
      firstName: options.firstName,
      lastName: options.lastName,
      enabled: options.enabled !== false,
      emailVerified: true,
    };

    // If a password is provided, set it as a temporary credential
    if (options.password) {
      userPayload.credentials = [
        {
          type: 'password',
          value: options.password,
          temporary: true,
        },
      ];
    }

    // Create the user (returns 201 with Location header)
    const response = await firstValueFrom(
      this.http.post(
        `${keycloakUrl}/admin/realms/MYB/users`,
        userPayload,
        { headers, observe: 'response' }
      )
    );

    // Extract the user ID from the Location header
    const location = response.headers.get('Location') || '';
    const userId = location.substring(location.lastIndexOf('/') + 1);

    if (!userId) {
      // Fallback: query by email to get the ID
      const users: any[] = await firstValueFrom(
        this.http.get<any[]>(
          `${keycloakUrl}/admin/realms/MYB/users?email=${encodeURIComponent(options.email)}&exact=true`,
          { headers }
        )
      );
      if (users && users.length > 0) {
        const createdUserId = users[0].id;
        if (options.role) {
          await this.assignRoleToUser(createdUserId, options.role);
        }
        return createdUserId;
      }
      throw new Error('Failed to retrieve created Keycloak user ID');
    }

    // Assign role if requested
    if (options.role) {
      await this.assignRoleToUser(userId, options.role);
    }

    console.log(`Keycloak user created: ${userId} (${options.email})`);
    return userId;
  }

  /**
   * Check if a user with the given email already exists in Keycloak.
   * Returns the user ID if found, null otherwise.
   */
  async findUserByEmail(email: string): Promise<string | null> {
    // Note: this returns a normalized UUID
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.currentUserToken}`,
      'Content-Type': 'application/json',
    });

    const keycloakUrl = this.keycloakAdminUrl;

    try {
      const users: any[] = await firstValueFrom(
        this.http.get<any[]>(
          `${keycloakUrl}/admin/realms/MYB/users?email=${encodeURIComponent(email)}&exact=true`,
          { headers }
        )
      );
      if (users && users.length > 0) {
        return users[0].id;
      }
      return null;
    } catch (err) {
      console.error('Error finding Keycloak user by email:', err);
      return null;
    }
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    userId = this.normalizeUuid(userId);
    try {
      const graphqlUrl = this.getGraphqlUrl();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.currentUserToken}`,
        'Content-Type': 'application/json',
      });
      const body = {
        query: `mutation AssignRole($userId: String!, $roleName: String!) {
          assignUserClientRole(userId: $userId, roleName: $roleName)
        }`,
        variables: { userId, roleName }
      };
      const response: any = await firstValueFrom(this.http.post(graphqlUrl, body, { headers }));
      if (response?.errors?.length) throw new Error(response.errors[0].message);
      if (response?.data?.assignUserClientRole === false) throw new Error('Role assignment failed');
      console.log(`Successfully assigned role ${roleName} to user ${userId}`);
    } catch (err) {
      console.error(`Error assigning role ${roleName} to user ${userId}:`, err);
      throw err;
    }
  }

  async unassignRoleFromUser(userId: string, roleName: string): Promise<void> {
    userId = this.normalizeUuid(userId);
    try {
      const graphqlUrl = this.getGraphqlUrl();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.currentUserToken}`,
        'Content-Type': 'application/json',
      });
      const body = {
        query: `mutation UnassignRole($userId: String!, $roleName: String!) {
          unassignUserClientRole(userId: $userId, roleName: $roleName)
        }`,
        variables: { userId, roleName }
      };
      const response: any = await firstValueFrom(this.http.post(graphqlUrl, body, { headers }));
      if (response?.errors?.length) throw new Error(response.errors[0].message);
      if (response?.data?.unassignUserClientRole === false) throw new Error('Role unassignment failed');
      console.log(`Successfully unassigned role ${roleName} from user ${userId}`);
    } catch (err) {
      console.error(`Error unassigning role ${roleName} from user ${userId}:`, err);
      throw err;
    }
  }

  /**
   * Search Keycloak users by email (partial match).
   * Routes through the coproperty backend GraphQL service account to avoid
   * Keycloak admin API 403 errors with regular user tokens.
   */
  async searchKeycloakUsers(emailSearch: string): Promise<any[]> {
    try {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.currentUserToken}`,
        'Content-Type': 'application/json',
      });

      const graphqlUrl = this.getGraphqlUrl();

      const body = {
        query: `query SearchKeycloakUsers($email: String!, $max: Int) {
          searchKeycloakUsers(email: $email, max: $max) {
            id
            email
            firstName
            lastName
            enabled
            emailVerified
            roles
          }
        }`,
        variables: { email: emailSearch, max: 20 }
      };

      const response: any = await firstValueFrom(
        this.http.post(graphqlUrl, body, { headers })
      );

      return response?.data?.searchKeycloakUsers ?? [];
    } catch (err) {
      console.error('Error searching Keycloak users:', err);
      return [];
    }
  }

  /**
   * Get the client roles assigned to a specific Keycloak user.
   * Routes through the coproperty backend to avoid 403 with regular user tokens.
   */
  async getUserClientRoles(userId: string): Promise<string[]> {
    userId = this.normalizeUuid(userId);
    try {
      const graphqlUrl = this.getGraphqlUrl();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${this.currentUserToken}`,
        'Content-Type': 'application/json',
      });
      const body = {
        query: `query GetUserClientRoles($userId: String!) {
          userClientRoles(userId: $userId)
        }`,
        variables: { userId }
      };
      const response: any = await firstValueFrom(this.http.post(graphqlUrl, body, { headers }));
      return response?.data?.userClientRoles ?? [];
    } catch (err) {
      console.error('Error fetching user client roles:', err);
      return [];
    }
  }

  private getGraphqlUrl(): string {
    return this.environment.services?.coproperty?.graphqlUrl
      ?? (this.environment.services?.coproperty?.baseUrl + '/graphql')
      ?? 'http://localhost:8088/graphql';
  }

  /**
   * Update the current authenticated user's profile via Keycloak Account REST API.
   * Only firstName, lastName, and email can be updated this way.
   */
  async updateMyProfile(data: { firstName: string; lastName: string; email: string }): Promise<void> {
    const token = this.keycloak?.token;
    if (!token) throw new Error('Not authenticated');

    const keycloakUrl = this.environment.services.keycloak.url;
    const realm = this.environment.services.keycloak.realm;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    await firstValueFrom(
      this.http.post(
        `${keycloakUrl}/realms/${realm}/account`,
        { firstName: data.firstName, lastName: data.lastName, email: data.email },
        { headers }
      )
    );

    // Reload the local profile cache
    await this.loadUserProfile();
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    if (!this.currentUserToken) throw new Error('Not authenticated');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.currentUserToken}`,
      'Content-Type': 'application/json',
    });
    const body = {
      query: `mutation ChangeOwnPassword($currentPassword: String!, $newPassword: String!, $confirmPassword: String!) {
        changeOwnPassword(
          currentPassword: $currentPassword,
          newPassword: $newPassword,
          confirmPassword: $confirmPassword
        )
      }`,
      variables: { currentPassword, newPassword, confirmPassword },
    };

    const response: any = await firstValueFrom(
      this.http.post(this.getGraphqlUrl(), body, { headers })
    );
    if (response?.errors?.length) throw new Error(response.errors[0].message);
    if (response?.data?.changeOwnPassword !== true) {
      throw new Error('Password change failed');
    }
  }
}
