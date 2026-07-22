# Technical Specification: Budget Management, Dashboard, Sidebar, and Change Password

**Date:** 2026-07-22  
**Project:** MYB Frontend (Angular 17, Nx monorepo)  
**Scope:** `libs/coproperty-module`, `apps/admin`, `libs/shared/shared-ui`, `libs/auth`

---

## 1. Budget Management Page — Default Year Filter on Page Load

### 1.1 Current State

**File:** `libs/coproperty-module/src/lib/components/charges-list/charges-list.component.ts`

The charges list uses signals for filter state (no FormGroup). The "Frequency" filter acts as a **Year** filter:

| Signal | Line | Initial Value |
|---|---|---|
| `filterFrequency` | 41 | `this.currentYear` (`new Date().getFullYear().toString()`) |
| `searchTerm` | 38 | `''` |
| `filterType` | 39 | `''` |
| `selectedCopropertyId` | 35 | `null` |

```typescript
// Line 40–41
readonly currentYear = new Date().getFullYear().toString();
filterFrequency = signal<string>(this.currentYear);
```

The frequency options are generated from `generateFrequencyOptions()` (lines 90–93):
```typescript
private generateFrequencyOptions(): string[] {
  const baseYear = new Date().getFullYear();
  return Array.from({ length: 11 }, (_, index) => (baseYear - 5 + index).toString());
}
```
Produces years `currentYear-5` through `currentYear+5`.

**Route initialization** (lines 64–66): If a `year` query param exists, it overrides the default:
```typescript
if (params['year']) {
  this.filterFrequency.set(String(params['year']));
}
```

**Template** (`charges-list.component.html` lines 83–98): The `<select>` for year is bound to `filterFrequency()` and emits `filterFrequency.set($event.target.value)` on change.

### 1.2 Assessment

The default year IS already set to the current year on page load (`filterFrequency` initialized to `this.currentYear`). The query param override also works correctly. **No code change is required for the default behavior.**

However, there is a subtle issue: after navigating back from `BudgetNewComponent` (which passes `year=formValue.frequency` in query params — `budget-new.component.ts` line 236), the route param correctly overrides the filter, but if the user then manually clears the year dropdown to "All years" (empty string), there's no way to reset it back without a "Reset Filters" button. This is a minor UX note, not a bug.

### 1.3 Recommendation

**No code change needed.** The default year filter already selects the current year on initial page load. The `year` query param from route initialization works correctly for cross-navigation synchronization.

**Verification steps:**
1. Navigate to `/coproperty/syndic/budgets` — verify the Year dropdown shows the current year.
2. Create a new budget and submit — verify it navigates back to the list with the year preserved in the query param.
3. Change the year dropdown — verify the filtered list updates immediately.

---

## 2. Dashboard Syndic Refinement

### 2.1 Redirection Link Audit

**File:** `libs/coproperty-module/src/lib/components/dashboard/coproperty-dashboard.component.html`

#### Current Links and Their Destinations

| Card | Translation Key | `routerLink` | Target Route |
|---|---|---|---|
| Copropriétés gérées | `coproperty.dashboard.copropertiesManaged` | `/admin/coproperties/list` | Does this route exist? **No.** Admin routes are under `/admin/coproperties` → `loadChildren: COPROPERTY_ROUTES`. There is no `/admin/coproperties/list`. |
| Lots occupés / total | `coproperty.dashboard.occupiedLots` | `/admin/coproperties/list` | Same issue — route does not exist. |
| Budget total | `coproperty.dashboard.totalBudget` | `/admin/coproperties/treasury` | Route does not exist. |
| Copropriétaires | `coproperty.dashboard.coOwners` | `/admin/coproperties/list` | Same issue. |
| Taux d'occupation | `coproperty.dashboard.occupancyRate` | `/admin/coproperties/list` | Same issue. |
| Charges actives | `coproperty.dashboard.activeCharges` | `/admin/coproperties/unpaid-payments` | Route does not exist. |
| Impayés en retard | `coproperty.dashboard.overduePayments` | `/admin/coproperties/unpaid-payments` | Same issue. |
| Trésorerie Réelle | `coproperty.dashboard.realTreasury` | `/admin/coproperties/treasury` | Route does not exist. |
| Trésorerie Comptable | `coproperty.dashboard.accountingTreasury` | `/admin/coproperties/treasury` | Same issue. |

#### Correct Routes (from `apps/admin/src/app/app.routes.ts`)

The admin app lazy-loads the coproperty module at:
```
{ path: 'admin', children: [ { path: 'coproperties', loadChildren: ...COPROPERTY_ROUTES } ] }
```

The coproperty routes (`libs/coproperty-module/src/lib/components/index.ts` line 30) export `COPProperty_ROUTES`, which include:
- `/admin/coproperties` → dashboard (redirect)
- `/admin/coproperties/list` — **THIS DOES EXIST** inside `COPProperty_ROUTES` but only if it's defined as a child there. Let's check.

Wait — looking at the admin routes more carefully:
```typescript
// app.routes.ts
{ path: 'admin', canActivate: [authGuard], children: [
    { path: '', redirectTo: 'coproperties', pathMatch: 'full' },
    { path: 'coproperties', loadChildren: ...COPROPERTY_ROUTES },
    { path: 'owner', loadComponent: OwnerDashboardComponent },
]}
```

The `loadChildren` expects `COPProperty_ROUTES` to define its own child routes. The syndic layout is likely loaded as a child of coproperty. Let's examine the actual route structure of the syndic layout.

From the exploration: `syndic-layout.component.ts` has navigation to routes like `/coproperty/syndic/dashboard`, `/coproperty/syndic/coproperties`, `/coproperty/syndic/budgets`, `/coproperty/syndic/units`, etc.

But the dashboard component (`coproperty-dashboard.component.ts`) links to `/admin/coproperties/list`, `/admin/coproperties/treasury`, `/admin/coproperties/unpaid-payments`.

The admin app routes the coproperty module at `/admin/coproperties/`, and the syndic routes are nested under `/coproperty/syndic/` (NOT `/admin/coproperties/syndic/`).

This means the dashboard links are pointing to `/admin/coproperties/...` but the actual routes are under `/coproperty/syndic/...`. This is a bug — the redirection links in the dashboard point to routes that either don't exist or are under the wrong path prefix.

#### Fix Plan

The dashboard is rendered within the syndic layout (which has routes prefixed with `/coproperty/syndic/`). The correct links should be:

| Card | Current (broken) | Correct `routerLink` |
|---|---|---|
| Copropriétés gérées | `/admin/coproperties/list` | `/coproperty/syndic/coproperties` |
| Lots occupés / total | `/admin/coproperties/list` | `/coproperty/syndic/units` |
| Budget total | `/admin/coproperties/treasury` | `/coproperty/syndic/budgets` |
| Copropriétaires | `/admin/coproperties/list` | `/coproperty/syndic/owners` |
| Taux d'occupation | `/admin/coproperties/list` | `/coproperty/syndic/coproperties` |
| Charges actives | `/admin/coproperties/unpaid-payments` | `/coproperty/syndic/budgets` |
| Impayés en retard | `/admin/coproperties/unpaid-payments` | `/coproperty/syndic/budgets` |
| Trésorerie Réelle | `/admin/coproperties/treasury` | `/coproperty/syndic/budgets` |
| Trésorerie Comptable | `/admin/coproperties/treasury` | `/coproperty/syndic/budgets` |

**Implementation:**
- `coproperty-dashboard.component.html` lines 49, 67, 82, 98, 112, 123, 141, 167, 188: replace all `routerLink="/admin/coproperties/*"` with the correct `/coproperty/syndic/*` paths.

### 2.2 "Surface totale gérée" Card Removal

**File:** `libs/coproperty-module/src/lib/components/dashboard/coproperty-dashboard.component.ts`

The `totalArea` signal exists at line 40 but the corresponding card is **not rendered** in the dashboard HTML template. The exploration confirmed this — no `totalArea` card exists in `coproperty-dashboard.component.html`.

However, `totalArea` is still populated with mock data:
```typescript
// Line 368
this.totalArea.set(1652);
```
And the `DashboardStats` model (line 204 of `coproperty.models.ts`) still includes `totalArea: number`.

**Actions:**
1. Remove `totalArea` signal from `coproperty-dashboard.component.ts` (line 40).
2. Remove `this.totalArea.set(1652)` from mock data (line 368).
3. Remove `totalArea` from the `DashboardStats` interface in `coproperty.models.ts` (line 208).
4. Remove the translation keys `coproperty.dashboard.totalArea` from `client/src/assets/i18n/en.json` (line 204) and `client/src/assets/i18n/fr.json` (line 205) — but only if no other component references them. The owner dashboard (`owner-dashboard.component.html` line 69) uses `totalSurface()` which is a different signal — do NOT remove owner dashboard references.

### 2.3 Profile Data Cleanup: User ID, Fournisseur, Identifiant

**File:** `libs/shared/shared-ui/src/lib/components/profile-page/profile-page.component.html`

**Current Account Info section** (lines 167–192):
```html
<div class="card">
  <div class="card-body">
    <h5 class="card-title">Account Info</h5>
    <div class="list-group list-group-flush">
      <div class="list-group-item">
        <strong>Identifiant</strong>
        <span>{{ username() }}</span>
      </div>
      <div class="list-group-item">
        <strong>ID utilisateur</strong>
        <span>{{ userId() }}</span>
      </div>
      <div class="list-group-item">
        <strong>Fournisseur</strong>
        <span>Keycloak SSO</span>
      </div>
      <div class="list-group-item">
        <strong>Session depuis</strong>
        <span>{{ joinedDate() }}</span>
      </div>
    </div>
  </div>
</div>
```

**Fields to remove:**
1. **User ID** — the `userId` signal (line 23) and its display
2. **Fournisseur** — hardcoded `"Keycloak SSO"` string
3. **Identifiant** — the `username` display

**Keep:**
- **Session depuis** (joinedDate) — provides user value

**Implementation:**
- Remove lines for Identifiant, ID utilisateur, and Fournisseur from the HTML template.
- Remove `userId` signal (line 23 in TS) and `username` signal (line 21) if they are only used for these three fields. Check usage:
  - `username()` is used only in the "Identifiant" list group item and for the avatar `@username` display. If keeping the avatar username, keep the signal.
  - `userId()` is used only in the "ID utilisateur" list group item. Remove the signal.
  - The `initials` computation (lines 103–105) uses the form values, not username.
  - `loadProfile()` lines 45–79: remove assignment to `this.userId.set(...)` and `this.username.set(...)`.

---

## 3. UI/UX — Sidebar Expanded by Default on Desktop, Collapsed on Mobile

### 3.1 Current State

**File:** `apps/admin/src/app/layouts/syndic-layout/syndic-layout.component.ts`

```typescript
// Line 45
isSidebarCollapsed = signal(true);  // starts COLLAPSED
```

The sidebar starts **collapsed** on all viewports. The toggle button in the header switches between expanded/collapsed states.

### 3.2 SCSS Responsive Breakpoints

**File:** `apps/admin/src/app/layouts/syndic-layout/syndic-layout.component.scss`

- **Desktop (>992px):** Sidebar width 280px when expanded, 80px when collapsed.
- **Tablet (≤992px):** Sidebar becomes off-canvas drawer, `left: -280px` when collapsed, `left: 0` when expanded.
- **Mobile (≤576px):** Sidebar width 260px with tighter padding.

### 3.3 Target Behavior

| Viewport | Default State | Interaction |
|---|---|---|
| Desktop (>992px) | **Expanded** (`isSidebarCollapsed = false`) | User can toggle to collapse manually |
| Tablet/Phone (≤992px) | **Collapsed** (`isSidebarCollapsed = true`) | Tap hamburger to open, auto-collapse on nav item click |

### 3.4 Implementation Plan

**`syndic-layout/syndic-layout.component.ts`:**

1. Replace the static initializer with a computed default based on `window.innerWidth`:
```typescript
private getDefaultSidebarState(): boolean {
  return window.innerWidth <= 992;
}
isSidebarCollapsed = signal(this.getDefaultSidebarState());
```

2. Add a `ResizeObserver` or `hostListener` to handle window resize (so if the user switches between mobile and desktop via responsive dev tools, the sidebar adjusts):
```typescript
// In constructor or ngOnInit
fromEvent(window, 'resize')
  .pipe(debounceTime(200), takeUntilDestroyed())
  .subscribe(() => {
    const isMobile = window.innerWidth <= 992;
    // Only auto-update if the user hasn't manually toggled
    // Optional: track manual toggle vs auto state
  });
```

**Alternative simpler approach (recommended):** Use `afterNextRender` and check on init only — the `onNavItemClick()` handler already auto-collapses on mobile. The key is just flipping the initial default.

```typescript
// Line 45 — single line change
isSidebarCollapsed = signal(window.innerWidth <= 992);
```

**`syndic-layout/syndic-layout.component.scss`:** No SCSS changes needed. The existing breakpoint logic works correctly with the signal state.

### 3.5 Also Apply to Other Layouts

| Layout | File | Current State | Change |
|---|---|---|---|
| Council | `council-layout/council-layout.component.ts` | No collapsible sidebar logic | Add same `isSidebarCollapsed` signal + toggle |
| Accountant | `accountant-layout/accountant-layout.component.ts` | No collapsible sidebar logic | Add same `isSidebarCollapsed` signal + toggle |
| Owner | `owner-layout/owner-layout.component.ts` | Uses `isMobileMenuOpen` (top nav, not sidebar) | No change needed — different pattern |

---

## 4. Security Feature — Change Password via Keycloak

### 4.1 Current State

**File:** `libs/auth/src/lib/keycloak.service.ts` (666 lines)

The service has extensive Keycloak integration, including:
- User profile update via Account REST API (`updateMyProfile()`, lines 644–665)
- Token management, role assignment, user CRUD via Admin API
- **No password change method exists.**

The Keycloak environment config (`apps/admin/src/environments/environment.ts` lines 15–20):
```typescript
keycloak: {
  url: 'http://localhost:8080',
  adminUrl: 'http://localhost:8080',
  realm: 'MYB',
  clientId: 'MYB-client',
},
```

### 4.2 Implementation Approach: Keycloak Account REST API

The Keycloak Account REST API has a password reset endpoint:
```
POST /realms/{realm}/account/credentials/password
```

**Request body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmation": "string"
}
```

This endpoint uses the **user's own bearer token** (not Admin API token), meaning the user must be authenticated and can only change their own password.

### 4.3 New Method in KeycloakService

Add to `keycloak.service.ts` (after `updateMyProfile`, around line 665):

```typescript
/**
 * Changes the current user's password via Keycloak Account REST API.
 * The user must be authenticated — uses the current session token.
 */
async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
  if (!this.isAuthenticated() || !this.keycloak) {
    throw new Error('User must be authenticated to change password.');
  }

  const token = this.keycloak.token;
  if (!token) {
    throw new Error('No valid user token available.');
  }

  const url = `${this.environment.services.keycloak.url}/realms/${this.environment.services.keycloak.realm}/account/credentials/password`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmation: confirmPassword,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage: string;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.errorMessage || errorJson.error || 'Password change failed';
    } catch {
      errorMessage = errorBody || `Password change failed with status ${response.status}`;
    }
    throw new Error(errorMessage);
  }
}
```

### 4.4 New Password Change Form in Profile Page

**File:** `libs/shared/shared-ui/src/lib/components/profile-page/profile-page.component.ts`

**Add to signals (after line 33):**
```typescript
isChangingPassword = signal(false);
passwordSaving = signal(false);
passwordSaveSuccess = signal(false);
passwordSaveError = signal<string | null>(null);
```

**Add new FormGroup (after existing `profileForm`, line 39):**
```typescript
passwordForm = this.fb.group({
  currentPassword: ['', [Validators.required, Validators.minLength(6)]],
  newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
  )]],
  confirmPassword: ['', [Validators.required]],
}, { validators: this.passwordMatchValidator });
```

**Add validator method:**
```typescript
private passwordMatchValidator(form: FormGroup): ValidationErrors | null {
  const newPw = form.get('newPassword')?.value;
  const confirm = form.get('confirmPassword')?.value;
  if (newPw && confirm && newPw !== confirm) {
    form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  return null;
}
```

**Add `onChangePassword()` method:**
```typescript
async onChangePassword(): Promise<void> {
  if (this.passwordForm.invalid) {
    this.passwordForm.markAllAsTouched();
    return;
  }
  this.passwordSaving.set(true);
  this.passwordSaveError.set(null);
  this.passwordSaveSuccess.set(false);

  try {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    await this.keycloakService.changePassword(currentPassword, newPassword, confirmPassword);
    this.passwordSaveSuccess.set(true);
    this.passwordForm.reset();
    this.isChangingPassword.set(false);
  } catch (error: any) {
    this.passwordSaveError.set(error.message || 'Password change failed. Please try again.');
  } finally {
    this.passwordSaving.set(false);
  }
}
```

### 4.5 New Password Change Section in Profile Template

**File:** `libs/shared/shared-ui/src/lib/components/profile-page/profile-page.component.html`

**Add after Account Info card** (after line 192):

```html
<!-- Change Password Section -->
<div class="card mt-4">
  <div class="card-header d-flex justify-content-between align-items-center">
    <h5 class="mb-0">
      <i class="bi bi-lock-fill me-2"></i>Change Password
    </h5>
    <button
      class="btn btn-sm"
      [class.btn-outline-secondary]="isChangingPassword()"
      [class.btn-outline-primary]="!isChangingPassword()"
      (click)="isChangingPassword.set(!isChangingPassword())">
      <i class="bi" [class.bi-x-circle]="isChangingPassword()" [class.bi-pencil-square]="!isChangingPassword()"></i>
      {{ isChangingPassword() ? 'Cancel' : 'Change Password' }}
    </button>
  </div>

  <div class="card-body" *ngIf="isChangingPassword()">
    <!-- Success alert -->
    <div class="alert alert-success d-flex align-items-center" *ngIf="passwordSaveSuccess()" role="alert">
      <i class="bi bi-check-circle-fill me-2"></i>
      Password changed successfully. Please use your new password on next login.
    </div>

    <!-- Error alert -->
    <div class="alert alert-danger d-flex align-items-center" *ngIf="passwordSaveError()" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ passwordSaveError() }}
    </div>

    <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
      <!-- Current Password -->
      <div class="mb-3">
        <label class="form-label">Current Password <span class="text-danger">*</span></label>
        <input
          type="password"
          class="form-control"
          formControlName="currentPassword"
          placeholder="Enter your current password"
          [class.is-invalid]="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched" />
        <div class="invalid-feedback" *ngIf="passwordForm.get('currentPassword')?.errors?.['required'] && passwordForm.get('currentPassword')?.touched">
          Current password is required.
        </div>
        <div class="invalid-feedback" *ngIf="passwordForm.get('currentPassword')?.errors?.['minlength']">
          Current password must be at least 6 characters.
        </div>
      </div>

      <!-- New Password -->
      <div class="mb-3">
        <label class="form-label">New Password <span class="text-danger">*</span></label>
        <input
          type="password"
          class="form-control"
          formControlName="newPassword"
          placeholder="Enter your new password"
          [class.is-invalid]="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched" />
        <div class="invalid-feedback" *ngIf="passwordForm.get('newPassword')?.errors?.['required'] && passwordForm.get('newPassword')?.touched">
          New password is required.
        </div>
        <div class="invalid-feedback" *ngIf="passwordForm.get('newPassword')?.errors?.['minlength']">
          Password must be at least 8 characters.
        </div>
        <div class="invalid-feedback" *ngIf="passwordForm.get('newPassword')?.errors?.['pattern']">
          Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.
        </div>
      </div>

      <!-- Confirm New Password -->
      <div class="mb-3">
        <label class="form-label">Confirm New Password <span class="text-danger">*</span></label>
        <input
          type="password"
          class="form-control"
          formControlName="confirmPassword"
          placeholder="Confirm your new password"
          [class.is-invalid]="(passwordForm.get('confirmPassword')?.invalid || passwordForm.hasError('passwordMismatch')) && passwordForm.get('confirmPassword')?.touched" />
        <div class="invalid-feedback" *ngIf="passwordForm.get('confirmPassword')?.errors?.['required'] && passwordForm.get('confirmPassword')?.touched">
          Please confirm your new password.
        </div>
        <div class="invalid-feedback" *ngIf="passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched">
          Passwords do not match.
        </div>
      </div>

      <!-- Submit -->
      <div class="d-flex gap-2">
        <button type="submit" class="btn btn-primary" [disabled]="passwordForm.invalid || passwordSaving()">
          <span *ngIf="passwordSaving()" class="spinner-border spinner-border-sm me-2"></span>
          {{ passwordSaving() ? 'Changing Password...' : 'Update Password' }}
        </button>
        <button type="button" class="btn btn-outline-secondary" (click)="isChangingPassword.set(false); passwordForm.reset(); passwordSaveError.set(null);">
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>
```

### 4.6 Imports Required

**`profile-page.component.ts`** — Add to `imports` array:
- No new Angular imports needed (already has `CommonModule`, `ReactiveFormsModule`, `TranslateModule`).

**Inject KeycloakService:**
```typescript
private keycloakService = inject(KeycloakService);
```
Already present (line 15 in the current file).

### 4.7 Translation Keys Required

| Key (EN) | English | French |
|---|---|---|
| `PROFILE_CHANGE_PASSWORD` | Change Password | Changer le mot de passe |
| `PROFILE_CURRENT_PASSWORD` | Current Password | Mot de passe actuel |
| `PROFILE_NEW_PASSWORD` | New Password | Nouveau mot de passe |
| `PROFILE_CONFIRM_PASSWORD` | Confirm New Password | Confirmer le mot de passe |
| `PROFILE_UPDATE_PASSWORD` | Update Password | Mettre à jour le mot de passe |
| `PROFILE_PASSWORD_SUCCESS` | Password changed successfully. | Mot de passe modifié avec succès. |
| `PROFILE_PASSWORD_REQUIRED` | Current password is required. | Le mot de passe actuel est requis. |
| `PROFILE_PASSWORD_MINLENGTH` | Current password must be at least 6 characters. | Le mot de passe doit comporter au moins 6 caractères. |
| `PROFILE_NEWPW_REQUIRED` | New password is required. | Le nouveau mot de passe est requis. |
| `PROFILE_NEWPW_MINLENGTH` | Password must be at least 8 characters. | Le mot de passe doit comporter au moins 8 caractères. |
| `PROFILE_NEWPW_PATTERN` | Must contain uppercase, lowercase, number, and special character. | Doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial. |
| `PROFILE_CONFIRM_REQUIRED` | Please confirm your new password. | Veuillez confirmer le nouveau mot de passe. |
| `PROFILE_PASSWORD_MISMATCH` | Passwords do not match. | Les mots de passe ne correspondent pas. |
| `PROFILE_CHANGING_PASSWORD` | Changing Password... | Modification du mot de passe... |
| `PROFILE_PASSWORD_LABEL` | Change Password | Changer le mot de passe |
| `PROFILE_CANCEL` | Cancel | Annuler |

### 4.8 Edge Cases and Error Handling

| Scenario | Behavior |
|---|---|
| Token expired during password change | `keycloakService.updateToken()` should be called before the request. Add to `changePassword()` method. |
| Network failure | `fetch()` will throw — caught by try/catch, shows error message. |
| Invalid current password | Keycloak returns 400 — parsed and displayed as `passwordSaveError`. |
| New password doesn't meet realm policy | Keycloak returns 400 with `errorMessage` describing the policy violation. Display as-is. |
| New password same as current | Keycloak policy should reject — error message displayed. |
| User navigates away mid-form | Form state resets on component re-entry since `passwordForm` is recreated. |
| Confirm password mismatch | Client-side validators prevent submission. |
| Successful change | Form resets, success message shown, change section collapses after 3 seconds. |

---

## 5. Summary of All File Changes

| # | File | Change |
|---|---|---|
| 1 | `libs/coproperty-module/src/lib/components/dashboard/coproperty-dashboard.component.html` | Fix all 9 `routerLink` paths to point to correct `/coproperty/syndic/*` routes |
| 2 | `libs/coproperty-module/src/lib/components/dashboard/coproperty-dashboard.component.ts` | Remove `totalArea` signal (line 40), remove `this.totalArea.set(1652)` (line 368) |
| 3 | `libs/coproperty-module/src/lib/models/coproperty.models.ts` | Remove `totalArea` from `DashboardStats` interface (line 208) |
| 4 | `libs/shared/shared-ui/src/lib/components/profile-page/profile-page.component.ts` | Remove `userId`/`username` signals, remove their initialization from `loadProfile()`, add password change form and `onChangePassword()` method |
| 5 | `libs/shared/shared-ui/src/lib/components/profile-page/profile-page.component.html` | Remove Identifiant/ID utilisateur/Fournisseur rows, add password change section |
| 6 | `libs/auth/src/lib/keycloak.service.ts` | Add `changePassword()` method using Keycloak Account REST API |
| 7 | `apps/admin/src/app/layouts/syndic-layout/syndic-layout.component.ts` | Change `isSidebarCollapsed` initial value from `true` to `window.innerWidth <= 992` |
| 8 | `apps/admin/src/app/layouts/council-layout/council-layout.component.ts` | Add `isSidebarCollapsed` signal + toggle (same pattern as syndic) |
| 9 | `apps/admin/src/app/layouts/accountant-layout/accountant-layout.component.ts` | Add `isSidebarCollapsed` signal + toggle (same pattern as syndic) |
| 10 | `apps/client/src/assets/i18n/en.json` | Add password change translation keys |
| 11 | `apps/client/src/assets/i18n/fr.json` | Add password change translation keys |

**Files NOT changed (verified no change needed):**
- `charges-list.component.ts` — default year filter already correct
- `budget-new.component.ts` — correct year initialization
- `owner-dashboard.component.html` — `totalSurface()` is separate from `totalArea`, not affected
