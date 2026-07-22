import { Component, OnInit } from '@angular/core';
import '@angular/localize/init';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { NxWelcomeComponent } from './nx-welcome.component';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';
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

  constructor(
    private keycloakService: KeycloakService,
    private router: Router,
    private translate: TranslateService,
    private location: Location,
    private notificationService: NotificationService,
    private languageService: LanguageService
  ) {
    this.translate.addLangs(['en', 'fr']);
    this.translate.setDefaultLang('en');
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
      localStorage.setItem('language', redirectLanguage);
      sessionStorage.setItem('language', redirectLanguage);
    }

    const savedLanguage = localStorage.getItem('language') || sessionStorage.getItem('language') || 'en';
    this.translate.use(savedLanguage);
    this.translate.onLangChange.subscribe((event) => {
      localStorage.setItem('language', event.lang);
      sessionStorage.setItem('language', event.lang);
    });
    this.languageService.language$.subscribe((lang) => {
      if (lang && lang !== this.translate.currentLang) {
        this.translate.use(lang);
      }
    });
    this.notificationService.startConnection();
  }
  private removeQueryParamsFromUrl(): void {
    const urlWithoutParams = this.location.path().split('?')[0];
    this.location.replaceState(urlWithoutParams);
  }
  private logUserProfile(): void {
    const profile = this.keycloakService.getProfile();
    console.log('User Profile:', profile);
  }
}
