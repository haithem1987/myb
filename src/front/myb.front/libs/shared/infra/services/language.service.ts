import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export type TextDirection = 'ltr' | 'rtl';

export interface AppLanguage {
  /** ISO code used for translation files (assets/i18n/{code}.json). */
  code: string;
  /** Native name shown in the language switcher. */
  label: string;
  dir: TextDirection;
  /** Locale used by Intl / toLocale*String for dates and numbers. */
  locale: string;
}

export const APP_LANGUAGES: readonly AppLanguage[] = [
  { code: 'fr', label: 'Français', dir: 'ltr', locale: 'fr-FR' },
  { code: 'en', label: 'English', dir: 'ltr', locale: 'en-GB' },
  { code: 'ar', label: 'العربية', dir: 'rtl', locale: 'ar-TN' },
];

export const SUPPORTED_LANGUAGE_CODES = APP_LANGUAGES.map((l) => l.code);
export const DEFAULT_LANGUAGE = 'fr';

/** Returns the supported language code for any value such as "ar-TN" or "EN", or null. */
export function normalizeLanguageCode(language: string | null | undefined): string | null {
  const normalized = language?.trim().toLowerCase().split('-')[0] ?? '';
  return SUPPORTED_LANGUAGE_CODES.includes(normalized) ? normalized : null;
}

export function getAppLanguage(code: string | null | undefined): AppLanguage {
  const normalized = normalizeLanguageCode(code) ?? DEFAULT_LANGUAGE;
  return APP_LANGUAGES.find((l) => l.code === normalized)!;
}

/**
 * Intl locale of the language currently displayed (read from <html lang>).
 * Usable from plain functions and components that do not inject LanguageService.
 */
export function currentIntlLocale(): string {
  const docLang = typeof document !== 'undefined' ? document.documentElement.lang : null;
  return getAppLanguage(docLang).locale;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private languageSubject: BehaviorSubject<string>;
  private static readonly STORAGE_KEY = 'language';

  constructor(private translate: TranslateService) {
    // Restore language from localStorage (persistent) or sessionStorage (session-only)
    const savedLanguage =
      normalizeLanguageCode(
        localStorage.getItem(LanguageService.STORAGE_KEY) ??
        sessionStorage.getItem(LanguageService.STORAGE_KEY)
      ) ?? DEFAULT_LANGUAGE;

    this.languageSubject = new BehaviorSubject<string>(savedLanguage);
    this.translate.addLangs(SUPPORTED_LANGUAGE_CODES);
    this.translate.setDefaultLang(DEFAULT_LANGUAGE);
    this.translate.use(savedLanguage);
    this.applyDocumentLanguage(savedLanguage);

    // Persist language changes reactively
    this.translate.onLangChange.subscribe((event) => {
      localStorage.setItem(LanguageService.STORAGE_KEY, event.lang);
      sessionStorage.setItem(LanguageService.STORAGE_KEY, event.lang);
      this.applyDocumentLanguage(event.lang);
    });
  }

  setLanguage(language: string): void {
    const normalized = normalizeLanguageCode(language);
    if (!normalized) {
      return;
    }
    this.languageSubject.next(normalized);
    this.translate.use(normalized);
    localStorage.setItem(LanguageService.STORAGE_KEY, normalized);
    sessionStorage.setItem(LanguageService.STORAGE_KEY, normalized);
    this.applyDocumentLanguage(normalized);
  }

  get language$() {
    return this.languageSubject.asObservable();
  }

  get currentLanguage(): AppLanguage {
    return getAppLanguage(this.languageSubject.value);
  }

  get languages(): readonly AppLanguage[] {
    return APP_LANGUAGES;
  }

  /** Sets <html lang/dir> so CSS logical properties, Bootstrap RTL overrides and Intl follow the language. */
  private applyDocumentLanguage(code: string): void {
    if (typeof document === 'undefined') {
      return;
    }
    const language = getAppLanguage(code);
    const root = document.documentElement;
    root.lang = language.code;
    root.dir = language.dir;
    document.body?.classList.toggle('rtl', language.dir === 'rtl');
  }
}
