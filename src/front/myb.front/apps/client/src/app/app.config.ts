import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
<<<<<<< HEAD
import { TYPE_KEY_TOKEN } from 'libs/shared/shared-ui/src/lib/tokens/apolloToken';
import { GraphQLModule } from 'libs/time-sheet-module/src/lib/graphql/graphql.module';
=======
import { TYPE_KEY_TOKEN } from 'libs/shared/infra/tokens/apolloToken';
import { GraphQLModule } from 'libs/shared/infra/graphql/graphql.module';
>>>>>>> a003f02 (fixing project architecture)
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    importProvidersFrom(GraphQLModule),
    KeycloakService,
    { provide: TYPE_KEY_TOKEN, useValue: 'User' },
  ], // Add your Keycloak service to providers],
};
