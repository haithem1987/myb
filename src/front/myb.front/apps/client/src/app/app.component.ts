import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import '@angular/localize/init';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';
import { TranslateService } from '@ngx-translate/core';
import {
  NotificationService,
  ToastsContainerComponent,
} from '@myb-front/shared-ui';
import {
  DEFAULT_LANGUAGE,
  LanguageService,
  SUPPORTED_LANGUAGE_CODES,
  normalizeLanguageCode,
} from '@myb-front/shared-ui';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  standalone: true,
  imports: [CommonModule, NxWelcomeComponent, RouterModule, ToastsContainerComponent, TranslateModule],
  selector: 'myb-front-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'client';
  routeLoading = signal(false);
  private normalizeLanguage(language: string | null): string {
    return normalizeLanguageCode(language) ?? DEFAULT_LANGUAGE;
  }

  constructor(
    private translate: TranslateService,
    private notificationService: NotificationService,
    private languageService: LanguageService,
    private router: Router,
    private destroyRef: DestroyRef
  ) {
    this.translate.addLangs(SUPPORTED_LANGUAGE_CODES);
    this.translate.setDefaultLang(DEFAULT_LANGUAGE);
  }

  private getLanguageFromRedirectParams(): string | null {
    const params = new URLSearchParams(window.location.search);
    const redirectLang =
      params.get('app_lang')
      ?? params.get('kc_locale')
      ?? params.get('ui_locales')?.split(' ')[0]
      ?? null;
    return normalizeLanguageCode(redirectLang);
  }

  ngOnInit(): void {
    this.watchRouteLoading();
    const redirectLanguage = this.getLanguageFromRedirectParams();
    if (redirectLanguage) {
      this.languageService.setLanguage(redirectLanguage);
    } else {
      const savedLanguage = this.normalizeLanguage(
        localStorage.getItem('language') || sessionStorage.getItem('language') || 'fr'
      );
      this.languageService.setLanguage(savedLanguage);
    }

    this.notificationService.startConnection();
  }

  private watchRouteLoading(): void {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.routeLoading.set(true);
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.routeLoading.set(false);
        }
      });
  }
}
