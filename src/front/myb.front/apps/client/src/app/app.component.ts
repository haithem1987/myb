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
import { LanguageService } from '@myb-front/shared-ui';
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
  private static readonly SUPPORTED_LANGUAGES = ['fr', 'en'];

  private normalizeLanguage(language: string | null): string {
    const normalized = language?.trim().toLowerCase().split('-')[0] ?? '';
    return AppComponent.SUPPORTED_LANGUAGES.includes(normalized) ? normalized : 'fr';
  }

  constructor(
    private translate: TranslateService,
    private notificationService: NotificationService,
    private languageService: LanguageService,
    private router: Router,
    private destroyRef: DestroyRef
  ) {
    this.translate.addLangs(['fr', 'en']);
    this.translate.setDefaultLang('fr');
  }

  private getLanguageFromRedirectParams(): string | null {
    const params = new URLSearchParams(window.location.search);
    const redirectLang =
      params.get('app_lang')
      ?? params.get('kc_locale')
      ?? params.get('ui_locales')?.split(' ')[0]
      ?? null;
    const normalized = redirectLang?.trim().toLowerCase().split('-')[0] ?? null;
    return AppComponent.SUPPORTED_LANGUAGES.includes(normalized ?? '') ? normalized : null;
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
