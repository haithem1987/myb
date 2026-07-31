import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink, from } from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { Router } from '@angular/router';
import { KeycloakService } from '@myb-front/auth';
import { environment } from '../../../../apps/client/src/environments/environment';

// Define your microservices' endpoints (use explicit per-service URIs)
const microserviceLinks = {
  timesheetService: environment.services?.timesheet?.baseUrl + '/graphql' ?? 'http://localhost:8082/graphql',
  documentService: environment.services?.document?.graphqlUrl ?? 'http://localhost:8086/graphql',
  invoiceService: environment.services?.invoice?.graphqlUrl ?? 'http://localhost:8083/graphql',
  copropertyService: (environment.services?.coproperty as any)?.graphqlUrl ?? environment.services?.coproperty?.baseUrl + '/graphql' ?? 'http://localhost:8088/graphql',
};

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    console.error('GraphQL errors: ', graphQLErrors);
  } else if (networkError) {
    console.error('Network error: ', networkError);
  }
});

// These operations belong to the coproperty schema. Keeping an explicit map
// prevents a missing/overwritten Apollo context from ever sending unit traffic
// to the timesheet endpoint.
const copropertyOperationNames = new Set([
  'GetAllUnitsBySyndic',
  'GetUnitsByCoproperty',
  'GetUnitById',
  'CreateUnit',
  'UpdateUnit',
  'DeleteUnit',
]);

const createServiceLink = (httpLink: HttpLink) => {
  const serviceLinks = Object.entries(microserviceLinks).reduce(
    (links, [key, uri]) => {
      links[key] = httpLink.create({ uri });
      return links;
    },
    {} as { [key: string]: ApolloLink }
  );
  return new ApolloLink((operation, forward) => {
    // Coproperty is the primary API used by the client application. Some Apollo
    // follow-up/refetch operations do not retain the caller's custom context, so
    // defaulting those requests to timesheet sends coproperty queries to
    // /api/timesheet/graphql (and results in a 405).
    const targetService = copropertyOperationNames.has(operation.operationName ?? '')
      ? 'copropertyService'
      : operation.getContext()['service'] ?? 'copropertyService';
    const link = serviceLinks[targetService];

    if (!link) {
      throw new Error(
        `Unknown GraphQL service "${targetService}" for operation "${operation.operationName || 'UnnamedOperation'}".`
      );
    }

    return link.request(operation, forward);
  });
};

const createAuthLink = (keycloakService: KeycloakService) =>
  setContext((operation, previousContext) => {
    const targetService = copropertyOperationNames.has(operation.operationName ?? '')
      ? 'copropertyService'
      : previousContext['service'] ?? 'copropertyService';

    if (targetService !== 'copropertyService') {
      return {};
    }

    const token = keycloakService.getToken();
    return token
      ? {
          headers: {
            ...previousContext['headers'],
            Authorization: `Bearer ${token}`,
          },
        }
      : {};
  });

@NgModule({
  imports: [BrowserModule, ApolloModule, HttpClientModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink, router: Router, keycloakService: KeycloakService) => {
        return {
          cache: new InMemoryCache({
            addTypename: false,
          }),
          link: from([errorLink, createAuthLink(keycloakService), createServiceLink(httpLink)]),
        };
      },
      deps: [HttpLink, Router, KeycloakService],
    },
  ],
})
export class GraphQLModule {}
