import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LanguageService,
  currentIntlLocale,
  getAppLanguage,
  normalizeLanguageCode,
} from 'libs/shared/infra/services/language.service';

describe('language helpers', () => {
  it('normalizes supported codes and regional variants', () => {
    expect(normalizeLanguageCode('ar-TN')).toBe('ar');
    expect(normalizeLanguageCode(' EN ')).toBe('en');
    expect(normalizeLanguageCode('fr')).toBe('fr');
  });

  it('rejects unsupported or empty codes', () => {
    expect(normalizeLanguageCode('de')).toBeNull();
    expect(normalizeLanguageCode('')).toBeNull();
    expect(normalizeLanguageCode(null)).toBeNull();
  });

  it('falls back to French metadata for unknown codes', () => {
    expect(getAppLanguage('de').code).toBe('fr');
    expect(getAppLanguage('ar').dir).toBe('rtl');
  });
});

describe('LanguageService', () => {
  let service: LanguageService;
  let translate: TranslateService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [TranslateModule.forRoot()] });
    service = TestBed.inject(LanguageService);
    translate = TestBed.inject(TranslateService);
  });

  it('starts in French, left-to-right', () => {
    expect(translate.currentLang).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('switches the document to right-to-left for Arabic', () => {
    service.setLanguage('ar');

    expect(translate.currentLang).toBe('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.body.classList.contains('rtl')).toBe(true);
    expect(currentIntlLocale()).toBe('ar-TN');
    expect(localStorage.getItem('language')).toBe('ar');
  });

  it('restores left-to-right when leaving Arabic', () => {
    service.setLanguage('ar');
    service.setLanguage('en');

    expect(document.documentElement.dir).toBe('ltr');
    expect(document.body.classList.contains('rtl')).toBe(false);
    expect(currentIntlLocale()).toBe('en-GB');
  });

  it('ignores unsupported languages', () => {
    service.setLanguage('de');

    expect(translate.currentLang).toBe('fr');
  });
});
