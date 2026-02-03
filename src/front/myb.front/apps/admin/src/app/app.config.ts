import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appRoutes } from './app.routes';
import { KeycloakService } from '@myb-front/auth';
import { GraphQLModule } from 'libs/shared/infra/graphql/graphql.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function initializeKeycloak(keycloak: KeycloakService) {
  return async () => {
    try {
      console.log('Starting Keycloak initialization...');
      const authenticated = await keycloak.init();
      console.log('Keycloak initialized successfully, authenticated:', authenticated);
      return true; // Always return true to allow app to load
    } catch (error) {
      console.error('Keycloak initialization failed:', error);
      // Don't block app startup even if Keycloak fails
      return true;
    }
  };
}

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(
      GraphQLModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    },
  ],
};
