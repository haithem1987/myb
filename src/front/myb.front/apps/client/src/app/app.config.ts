import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ENVIRONMENT } from 'libs/auth/src/lib/environment.token';
import { TYPE_KEY_TOKEN } from 'libs/shared/infra/tokens/apolloToken';
import { GraphQLModule } from 'libs/shared/infra/graphql/graphql.module';
import { appRoutes } from './app.routes';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  TranslateModule,
  TranslateLoader,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxStripeModule } from 'ngx-stripe';
import { environment } from '../environments/environment';

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
export function initializeKeycloak(keycloak: KeycloakService) {
  console.log('Initializing Keycloak...');
  return () => {
    return keycloak.init().catch((err) => {
      console.warn('Keycloak initialization failed, app will continue:', err);
      // Don't block app startup if Keycloak fails
      return false;
    });
  };
}
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ENVIRONMENT, useValue: environment },
    provideRouter(appRoutes),
    provideAnimations(),
    importProvidersFrom(
      GraphQLModule,
      HttpClientModule,
      FormsModule,
      NgxStripeModule.forRoot(
        'pk_test_51Q56AdGECxm7PWS6WYLmqYSjRR6Y685I3kIqfysdBgGASYswh0f6k7Wyl5haDtThwMlwKAwPGuOuUO3VIhlXfCf400B6QeNp5o'
      ),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
    // KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    },
    { provide: TYPE_KEY_TOKEN, useValue: 'User' },
  ],
};
