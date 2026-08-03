import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NxWelcomeComponent } from './nx-welcome.component';
import { LanguageService } from 'libs/shared/infra/services/language.service';

@Component({
  standalone: true,
  imports: [NxWelcomeComponent, RouterModule],
  selector: 'myb-front-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'admin';
  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);

  ngOnInit(): void {
    // Initialize supported languages
    this.translate.addLangs(['fr', 'en']);
    this.translate.setDefaultLang('fr');

    // Restore language from URL redirect params (Keycloak) if present,
    // otherwise fall back to the value persisted in localStorage/sessionStorage.
    const redirectLang = this.getLanguageFromRedirectParams();
    if (redirectLang) {
      this.languageService.setLanguage(redirectLang);
    } else {
      const saved = this.normalizeLanguage(
        localStorage.getItem('language') ?? sessionStorage.getItem('language') ?? 'fr'
      );
      this.languageService.setLanguage(saved);
    }
  }

  private normalizeLanguage(lang: string | null): string {
    const normalized = lang?.trim().toLowerCase().split('-')[0] ?? '';
    return ['fr', 'en'].includes(normalized) ? normalized : 'fr';
  }

  private getLanguageFromRedirectParams(): string | null {
    const params = new URLSearchParams(window.location.search);
    const redirectLang =
      params.get('app_lang')
      ?? params.get('kc_locale')
      ?? params.get('ui_locales')?.split(' ')[0]
      ?? null;
    const normalized = redirectLang?.trim().toLowerCase().split('-')[0] ?? null;
    return normalized && ['fr', 'en'].includes(normalized) ? normalized : null;
  }
}
