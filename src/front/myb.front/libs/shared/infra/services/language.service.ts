import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private languageSubject: BehaviorSubject<string>;

  constructor(private translate: TranslateService) {
    const savedLanguage = localStorage.getItem('language') || 'en';
    this.languageSubject = new BehaviorSubject<string>(savedLanguage);
    this.translate.setDefaultLang(savedLanguage);
    this.translate.use(savedLanguage);
  }

  setLanguage(language: string): void {
    this.languageSubject.next(language);
    this.translate.use(language);
    localStorage.setItem('language', language);
  }

  get language$() {
    return this.languageSubject.asObservable();
  }
}
