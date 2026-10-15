import '@angular/localize/init';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import localeFr from '@angular/common/locales/fr';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Locale data for the date/number pipes when a language code is passed (e.g. translate.currentLang).
registerLocaleData(localeFr, 'fr');
registerLocaleData(localeAr, 'ar');

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    if (environment.production && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' }).catch(error =>
        console.warn('MYB service worker registration failed', error)
      );
    }
  })
  .catch((err) => console.error(err));
