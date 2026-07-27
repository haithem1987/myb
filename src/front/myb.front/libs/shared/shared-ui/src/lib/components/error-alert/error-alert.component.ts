import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFriendlyError } from '../../services/error-message.service';

/**
 * Reusable error alert component for displaying user-friendly error messages.
 * Used across the platform to ensure consistent error UX.
 * 
 * Usage:
 * ```html
 * <myb-error-alert 
 *   [error]="currentError" 
 *   (onRetry)="retryAction()">
 * </myb-error-alert>
 * ```
 */
@Component({
  selector: 'myb-error-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-alert.component.html',
  styleUrls: ['./error-alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorAlertComponent {
  @Input() error: UserFriendlyError | null = null;
  @Output() onRetry = new EventEmitter<void>();
  @Output() onDismiss = new EventEmitter<void>();

  /**
   * Gets the appropriate title based on error severity.
   */
  getTitleForSeverity(severity: string): string {
    const titles: Record<string, string> = {
      info: 'Information',
      warning: 'Attention',
      danger: 'Erreur',
    };
    return titles[severity] || 'Notification';
  }

  /**
   * Gets Bootstrap alert class based on severity.
   */
  getAlertClass(): string {
    if (!this.error) return 'alert-secondary';
    const classes: Record<string, string> = {
      info: 'alert-info',
      warning: 'alert-warning',
      danger: 'alert-danger',
    };
    return classes[this.error.severity] || 'alert-secondary';
  }

  /**
   * Emits retry event and dismisses alert.
   */
  retry(): void {
    this.onRetry.emit();
    this.dismiss();
  }

  /**
   * Opens contact support email.
   */
  contactSupport(): void {
    const email = 'support@myb-platform.com';
    const subject = encodeURIComponent('Aide concernant une erreur');
    window.location.href = `mailto:${email}?subject=${subject}`;
  }

  /**
   * Dismisses the alert.
   */
  dismiss(): void {
    this.onDismiss.emit();
  }
}
