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
  // const serviceLinks = {
  //   timesheetService: httpLink.create({ uri: 'http://localhost:5059/graphql' }),
  //   documentService: httpLink.create({ uri: 'http://localhost:5117/graphql' }),
  //   invoiceService: httpLink.create({ uri: 'http://localhost:5145/graphql' }),
  // };
  console.log('httpLink', httpLink);
  return new ApolloLink((operation, forward) => {
    console.log('operation', operation);
    const targetService =
      operation?.getContext()['service'] ?? 'timesheetService';

    console.log('targetService', targetService);
    console.log('serviceLinks[targetService]', serviceLinks[targetService]);

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
