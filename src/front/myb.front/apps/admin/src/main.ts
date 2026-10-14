import '@angular/localize/init';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import localeFr from '@angular/common/locales/fr';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Locale data for the date/number pipes when a language code is passed (e.g. translate.currentLang).
registerLocaleData(localeFr, 'fr');
registerLocaleData(localeAr, 'ar');

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
