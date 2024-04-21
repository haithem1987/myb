import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { ApolloClientOptions, InMemoryCache } from '@apollo/client/core';
import { HttpLink } from 'apollo-angular/http';
import { TYPE_KEY_TOKEN } from 'libs/shared/shared-ui/src/lib/tokens/apolloToken';
import { GraphQLModule } from 'libs/shared/shared-ui/src/lib/graphql/graphql.module';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    importProvidersFrom(GraphQLModule),
    KeycloakService,
    { provide: TYPE_KEY_TOKEN, useValue: 'User' },
  ], // Add your Keycloak service to providers],
};
