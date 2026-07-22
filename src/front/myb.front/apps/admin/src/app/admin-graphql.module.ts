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
import { environment } from '../environments/environment';

// Define your microservices' endpoints from environment
const microserviceLinks = {
  timesheetService: environment.services?.timesheet?.baseUrl + '/graphql' ?? 'http://localhost:8082/graphql',
  documentService: environment.services?.document?.graphqlUrl ?? 'http://localhost:8086/graphql',
  invoiceService: environment.services?.invoice?.graphqlUrl ?? 'http://localhost:8083/invoice/graphql',
  copropertyService: environment.services?.coproperty?.graphqlUrl ?? 'http://localhost:8088/graphql',
};

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors?.length) {
    const summary = graphQLErrors.map(error => error.message).join(' | ');
    console.error(`[GraphQL] ${operation.operationName || 'UnnamedOperation'}: ${summary}`, graphQLErrors);
  }

  if (networkError) {
    console.error(`[GraphQL Network] ${operation.operationName || 'UnnamedOperation'}:`, networkError);
  }
});

const createServiceLink = (httpLink: HttpLink) => {
  const serviceLinks = Object.entries(microserviceLinks).reduce(
    (links, [key, uri]) => {
      links[key] = httpLink.create({ uri });
      return links;
    },
    {} as { [key: string]: ApolloLink }
  );
  return new ApolloLink((operation, forward) => {
    const targetService = operation?.getContext()['service'] ?? 'copropertyService';
    const link = serviceLinks[targetService];
    return link.request(operation, forward);
  });
};

/**
 * Attaches the authenticated user's Keycloak bearer token to coproperty-service
 * GraphQL requests, so the backend can identify the caller (role/id) and enforce
 * per-syndic access control server-side instead of trusting client-supplied
 * arguments alone. Other services are left untouched.
 */
const createAuthLink = (keycloakService: KeycloakService) =>
  setContext((_, prevContext) => {
    const targetService = prevContext['service'] ?? 'copropertyService';
    if (targetService !== 'copropertyService') {
      return {};
    }

    const token = keycloakService.getToken();
    if (!token) {
      return {};
    }

    return {
      headers: {
        ...prevContext['headers'],
        Authorization: `Bearer ${token}`,
      },
    };
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
export class AdminGraphQLModule {}
