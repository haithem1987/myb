import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppLanguage, LanguageService } from 'libs/shared/infra/services/language.service';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
@Component({
  selector: 'myb-front-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css',
})
export class LanguageSwitcherComponent implements OnInit {
  selectedLanguage!: string;
  readonly languages: readonly AppLanguage[];

  constructor(
    private languageService: LanguageService,
    private keycloakService: KeycloakService
  ) {
    this.languages = this.languageService.languages;
  }

  ngOnInit(): void {
    this.languageService.language$.subscribe((language) => {
      this.selectedLanguage = language;
    });
  }

  switchLanguage(language: string): void {
    this.languageService.setLanguage(language);
    void this.keycloakService.syncPreferredLanguage(language).catch((error) => {
      console.warn('Could not synchronize email language preference', error);
    });
  }
}
