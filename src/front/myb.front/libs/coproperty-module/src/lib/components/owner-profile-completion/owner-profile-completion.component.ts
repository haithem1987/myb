import {
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { from, switchMap } from 'rxjs';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { OwnerService } from '../../services/owner.service';
import { CreateOwnerWithUnitsInput } from '../../models/owner.model';

@Component({
  selector: 'myb-owner-profile-completion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './owner-profile-completion.component.html',
  styleUrls: ['./owner-profile-completion.component.scss'],
})
export class OwnerProfileCompletionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private keycloakService = inject(KeycloakService);
  private ownerService = inject(OwnerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);
  submitted = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  /** Read-only info pre-filled from Keycloak token */
  keycloakFirstName = '';
  keycloakLastName = '';
  keycloakEmail = '';

  profileForm = this.fb.group({
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    phone: [
      '',
      [Validators.required, Validators.pattern(/^\+?[0-9\s\-().]{6,20}$/)],
    ],
  });

  ngOnInit(): void {
    // Guard: if not authenticated, go to registration
    if (!this.keycloakService.isAuthenticated()) {
      this.router.navigate(['/register']);
      return;
    }

    // Check if profile already exists → skip to dashboard
    const userId = this.keycloakService.getUserId();
    if (userId) {
      this.ownerService
        .getOwnerByUserId(userId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (owner) => {
            if (owner) {
              // Profile already exists — navigate to owner dashboard.
              // router.navigate keeps Keycloak's in-memory token so authGuard passes.
              this.router.navigate(['/coproperty/owner/dashboard']);
            }
          },
          error: () => {
            // No existing profile — stay on this page
          },
        });
    }

    // Pre-fill read-only fields from Keycloak profile
    const profile = this.keycloakService.getProfile();
    if (profile) {
      this.keycloakFirstName = profile.firstName ?? '';
      this.keycloakLastName = profile.lastName ?? '';
      this.keycloakEmail = profile.email ?? '';
      this.profileForm.patchValue({
        firstName: this.keycloakFirstName,
        lastName: this.keycloakLastName,
        email: this.keycloakEmail,
      });
    }
  }

  get phone(): AbstractControl {
    return this.profileForm.get('phone')!;
  }

  /**
   * This component is exclusively for owner self-registration.
   * Always route to the owner dashboard after profile completion.
   */
  private getDefaultRoute(): string {
    return '/coproperty/owner/dashboard';
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.errorMessage.set(null);

    if (this.profileForm.invalid) return;

    const userId = this.keycloakService.getUserId();
    if (!userId) {
      this.errorMessage.set('auth.error.notAuthenticated');
      return;
    }

    const input: CreateOwnerWithUnitsInput = {
      userId,
      firstName: this.keycloakFirstName,
      lastName: this.keycloakLastName,
      email: this.keycloakEmail,
      phone: this.phone.value,
      units: [], // No units at self-registration — admin assigns units later
    };

    this.loading.set(true);
    this.ownerService
      .createOwner(input)
      .pipe(
        // Chain token refresh so the new coproperty-owner role is in the JWT
        // before the route guards evaluate. Using switchMap keeps everything
        // inside Angular's zone (no page reload = Keycloak keeps its token).
        // forceTokenRefresh() never throws — errors are caught internally.
        switchMap(() => from(this.keycloakService.forceTokenRefresh())),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('auth.register.profileSaved');
          this.router.navigate([this.getDefaultRoute()]);
        },
        error: (err) => {
          this.loading.set(false);
          console.error('Profile creation error:', err);
          this.errorMessage.set('auth.register.profileError');
        },
      });
  }
}
