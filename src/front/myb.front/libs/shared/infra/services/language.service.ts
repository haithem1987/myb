import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private languageSubject: BehaviorSubject<string>;
  private static readonly STORAGE_KEY = 'language';
  private static readonly SUPPORTED_LANGUAGES = ['fr', 'en'];
  private static readonly DEFAULT_LANGUAGE = 'fr';

  constructor(private translate: TranslateService) {
    // Restore language from localStorage (persistent) or sessionStorage (session-only)
    const savedLanguage =
      localStorage.getItem(LanguageService.STORAGE_KEY) ??
      sessionStorage.getItem(LanguageService.STORAGE_KEY) ??
      LanguageService.DEFAULT_LANGUAGE;

    this.languageSubject = new BehaviorSubject<string>(savedLanguage);
    this.translate.setDefaultLang(LanguageService.DEFAULT_LANGUAGE);
    this.translate.use(savedLanguage);

    // Persist language changes reactively
    this.translate.onLangChange.subscribe((event) => {
      localStorage.setItem(LanguageService.STORAGE_KEY, event.lang);
      sessionStorage.setItem(LanguageService.STORAGE_KEY, event.lang);
    });
  }

  setLanguage(language: string): void {
    if (!LanguageService.SUPPORTED_LANGUAGES.includes(language)) {
      return;
    }
    this.languageSubject.next(language);
    this.translate.use(language);
    localStorage.setItem(LanguageService.STORAGE_KEY, language);
    sessionStorage.setItem(LanguageService.STORAGE_KEY, language);
  }

  get language$() {
    return this.languageSubject.asObservable();
  }
}
