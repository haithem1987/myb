import { Component, OnInit } from '@angular/core';
import '@angular/localize/init';
import { RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';
import { TranslateService } from '@ngx-translate/core';
import {
  NotificationService,
  ToastsContainerComponent,
} from '@myb-front/shared-ui';
import { LanguageService } from '@myb-front/shared-ui';
@Component({
  standalone: true,
  imports: [NxWelcomeComponent, RouterModule, ToastsContainerComponent],
  selector: 'myb-front-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'client';
  private static readonly SUPPORTED_LANGUAGES = ['fr', 'en'];

  private normalizeLanguage(language: string | null): string {
    const normalized = language?.trim().toLowerCase().split('-')[0] ?? '';
    return AppComponent.SUPPORTED_LANGUAGES.includes(normalized) ? normalized : 'fr';
  }

  constructor(
    private translate: TranslateService,
    private notificationService: NotificationService,
    private languageService: LanguageService
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
}
