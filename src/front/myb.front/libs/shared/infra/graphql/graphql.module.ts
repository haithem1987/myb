import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink, from } from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { Router } from '@angular/router';

// Define your microservices' endpoints
const microserviceLinks = {
  timesheetService: 'http://localhost:5059/graphql',
  documentService: 'http://localhost:5117/graphql',
  invoiceService: 'http://localhost:5145/graphql',
};

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    console.error('GraphQL errors: ', graphQLErrors);
    // Show user-friendly error messages based on specific errors
  } else if (networkError) {
    console.error('Network error: ', networkError);
    // Handle network issues and inform user
  }
});

// Custom routing link
const createCustomLink = (httpLink: HttpLink, router: Router) => {
  const serviceLinks = Object.entries(microserviceLinks).reduce(
    (links, [key, uri]) => {
      links[key] = httpLink.create({ uri });
      return links;
    },
    {} as { [key: string]: ApolloLink }
  );

  return new ApolloLink((operation, forward) => {
    const currentUrl = router.url;
    console.log('currentUrl', currentUrl);
    if (currentUrl.startsWith('/timesheet')) {
      return serviceLinks['timesheetService'].request(operation, forward);
    } else if (currentUrl.startsWith('/documents')) {
      return serviceLinks['documentService'].request(operation, forward);
    } else if (currentUrl.startsWith('/invoice')) {
      return serviceLinks['invoiceService'].request(operation, forward);
    }

    // Default to timesheetService if no specific route matches
    return serviceLinks['timesheetService'].request(operation, forward);
  });
};

@NgModule({
  imports: [BrowserModule, ApolloModule, HttpClientModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink, router: Router) => {
        return {
          cache: new InMemoryCache({
            addTypename: false, // This is default, adds __typename automatically on read
          }),
          link: from([errorLink, createCustomLink(httpLink, router)]),
        };
      },
      deps: [HttpLink, Router],
    },
  ],
})
export class GraphQLModule {}
