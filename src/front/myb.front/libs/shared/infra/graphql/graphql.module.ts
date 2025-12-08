import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink, from } from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { Router } from '@angular/router';
import { environment } from '../../../../apps/client/envirements/envirement';

// Define your microservices' endpoints
const baseUri = environment.baseUri;
const microserviceLinks = {
  timesheetService: `${baseUri}/timesheet/graphql`,
  documentService: `${baseUri}/document/graphql`,
  invoiceService: `${baseUri}/invoice/graphql`,
};

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    console.error('GraphQL errors: ', graphQLErrors);
  } else if (networkError) {
    console.error('Network error: ', networkError);
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
    const targetService =
      operation?.getContext()['service'] ?? 'timesheetService';
    return serviceLinks[targetService].request(operation, forward);
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
            addTypename: false,
          }),
          link: from([errorLink, createServiceLink(httpLink)]),
        };
      },
      deps: [HttpLink, Router],
    },
  ],
})
export class GraphQLModule {}
