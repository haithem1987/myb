import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { TYPE_KEY_TOKEN } from 'libs/shared/infra/tokens/apolloToken';
import { GraphQLModule } from 'libs/shared/infra/graphql/graphql.module';
import { appRoutes } from './app.routes';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  TranslateModule,
  TranslateLoader,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxStripeModule } from 'ngx-stripe';
import { ToastService } from 'libs/shared/infra/services/toast.service';

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}
export function initializeKeycloak(keycloak: KeycloakService) {
  console.log('initializeKeycloak');
  return () => (!keycloak?.isAuthenticated() ? keycloak.init() : false);
}
export const appConfig: ApplicationConfig = {
  providers: [
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
