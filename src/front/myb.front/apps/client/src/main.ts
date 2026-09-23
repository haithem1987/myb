import '@angular/localize/init';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    if (environment.production && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' }).catch(error =>
        console.warn('MYB service worker registration failed', error)
      );
    }
  })
  .catch((err) => console.error(err));
