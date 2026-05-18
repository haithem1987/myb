import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { UserDropdownComponent } from '../user-dropdown/user-dropdown.component';

@Component({
  selector: 'myb-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, UserDropdownComponent],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  private keycloakService = inject(KeycloakService);
  private fb = inject(FormBuilder);
  private location = inject(Location);

  saving = signal(false);
  saveSuccess = signal(false);
  saveError = signal<string | null>(null);
  editMode = signal(false);

  // Read-only info from token
  username = signal('');
  userId = signal('');
  roles = signal<string[]>([]);
  emailVerified = signal(false);
  joinedDate = signal('');

  // Initials for avatar
  initials = signal('');

  profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    const profile = this.keycloakService.getProfile();
    const token = this.keycloakService.getToken();
    let tokenData: any = {};
    if (token) {
      try {
        tokenData = JSON.parse(atob(token.split('.')[1]));
      } catch { /* ignore */ }
    }

    const firstName = profile?.firstName ?? tokenData.given_name ?? '';
    const lastName = profile?.lastName ?? tokenData.family_name ?? '';
    const email = profile?.email ?? tokenData.email ?? '';
    const username = profile?.username ?? tokenData.preferred_username ?? '';

    this.username.set(username);
    this.userId.set(profile?.id ?? tokenData.sub ?? '');
    this.emailVerified.set(tokenData.email_verified ?? false);
    this.initials.set(
      ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || username[0]?.toUpperCase() || '?'
    );

    // Parse roles — only show meaningful ones (not internal Keycloak noise)
    const allRoles: string[] = this.keycloakService.getUserRoles();
    const meaningful = allRoles.filter(r =>
      r.startsWith('coproperty-') || r === 'system-admin' || r.startsWith('MYB_')
    );
    this.roles.set(meaningful.length > 0 ? meaningful : allRoles.slice(0, 5));

    // Creation date from token (iat = issued-at is not creation, use sub prefix as fallback)
    const iat = tokenData.iat ? new Date(tokenData.iat * 1000).toLocaleDateString('fr-FR') : '';
    this.joinedDate.set(iat);

    this.profileForm.patchValue({ firstName, lastName, email });
  }

  get firstName(): AbstractControl { return this.profileForm.get('firstName')!; }
  get lastName(): AbstractControl { return this.profileForm.get('lastName')!; }
  get email(): AbstractControl { return this.profileForm.get('email')!; }

  enableEdit(): void {
    this.editMode.set(true);
    this.saveSuccess.set(false);
    this.saveError.set(null);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.loadProfile();
    this.saveError.set(null);
  }

  async onSave(): Promise<void> {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    try {
      await this.keycloakService.updateMyProfile({
        firstName: this.firstName.value,
        lastName: this.lastName.value,
        email: this.email.value,
      });
      this.saveSuccess.set(true);
      this.editMode.set(false);
      this.loadProfile();
    } catch {
      this.saveError.set('Une erreur est survenue lors de la mise à jour. Veuillez réessayer.');
    } finally {
      this.saving.set(false);
    }
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'coproperty-owner': 'Copropriétaire',
      'coproperty-syndic': 'Syndic',
      'coproperty-admin': 'Admin Copropriété',
      'coproperty-council': 'Conseil Syndical',
      'coproperty-accountant': 'Comptable',
      'system-admin': 'Administrateur Système',
      'MYB_MANAGER': 'Manager MYB',
      'MYB_EMPLOYEE': 'Employé MYB',
    };
    return labels[role] ?? role;
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'system-admin' || role === 'coproperty-admin') return 'badge-danger';
    if (role === 'coproperty-syndic') return 'badge-primary';
    if (role === 'coproperty-owner') return 'badge-success';
    if (role === 'coproperty-council') return 'badge-info';
    if (role === 'coproperty-accountant') return 'badge-warning';
    return 'badge-secondary';
  }

  logout(): void {
    this.keycloakService.logout();
  }

  goBack(): void {
    this.location.back();
  }
}
