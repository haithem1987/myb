import { Component, DestroyRef, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PushNotificationService, PushState } from 'libs/shared/infra/services/push-notification.service';

const DISMISSED_UNTIL_KEY = 'myb_push_banner_dismissed_until';
const DISMISS_DAYS = 30;

/**
 * "banner": discreet invitation shown in the owner/syndic layouts until the user enables push
 * or dismisses it (asked again after 30 days).
 * "setting": permanent switch for the profile page.
 */
@Component({
  selector: 'myb-front-push-opt-in',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './push-opt-in.component.html',
  styleUrl: './push-opt-in.component.css',
})
export class PushOptInComponent implements OnInit {
  @Input() mode: 'banner' | 'setting' = 'banner';

  private push = inject(PushNotificationService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  state = signal<PushState>('unsupported');
  busy = signal(false);
  error = signal(false);
  dismissed = signal(PushOptInComponent.isDismissed());

  ngOnInit(): void {
    this.push.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => this.state.set(state));
    void this.push.init();
  }

  get showBanner(): boolean {
    const state = this.state();
    return !this.dismissed() && (state === 'available' || state === 'ios-install-required');
  }

  async enable(): Promise<void> {
    this.busy.set(true);
    this.error.set(false);
    try {
      await this.push.enable(this.translate.currentLang || this.translate.defaultLang);
    } catch (error) {
      console.warn('MYB push enable failed', error);
      this.error.set(true);
    } finally {
      this.busy.set(false);
    }
  }

  async disable(): Promise<void> {
    this.busy.set(true);
    try {
      await this.push.disable();
    } finally {
      this.busy.set(false);
    }
  }

  dismiss(): void {
    this.dismissed.set(true);
    try {
      localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
    } catch {
      // Private mode: the banner simply comes back on the next visit.
    }
  }

  private static isDismissed(): boolean {
    try {
      return Number(localStorage.getItem(DISMISSED_UNTIL_KEY) ?? 0) > Date.now();
    } catch {
      return false;
    }
  }
}
