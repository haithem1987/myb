import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { KeycloakService } from '@myb-front/auth';
import { AuthLayoutComponent } from '@myb-front/shared-ui';

@Component({
  selector: 'myb-registration-path',
  standalone: true,
  imports: [CommonModule, TranslateModule, AuthLayoutComponent],
  templateUrl: './registration-path.component.html',
  styleUrls: ['./registration-path.component.scss'],
})
export class RegistrationPathComponent {
  private readonly keycloakService = inject(KeycloakService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal(false);

  async createResidence(): Promise<void> {
    const userId = this.keycloakService.getUserId();
    if (!userId || this.loading()) return;

    this.loading.set(true);
    this.error.set(false);

    try {
      if (!this.keycloakService.getUserRoles().includes('coproperty-syndic')) {
        await this.keycloakService.assignRoleToUser(userId, 'coproperty-syndic');
        await this.keycloakService.forceTokenRefresh();
      }
      await this.router.navigate(['/coproperty/manage/new']);
    } catch (error) {
      console.error('Unable to prepare the syndic space', error);
      this.error.set(true);
      this.loading.set(false);
    }
  }

  joinResidence(): void {
    this.router.navigate(['/coproperty/select'], { queryParams: { space: 'owner' } });
  }
}
