import { HttpClientModule } from '@angular/common/http';
import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// import { onError } from 'apollo-link-error';
import { ApolloLink } from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
            
// const errorLink = onError(({ graphQLErrors, networkError }) => {
//   if (graphQLErrors) {
//     console.error('GraphQL errors: ', graphQLErrors);
//     // Show user-friendly error messages based on specific errors
//   } else if (networkError) {
//     console.error('Network error: ', networkError);
//     // Handle network issues and inform user
//   }
// });
//  }
// }const httpLink = new HttpLink({
//   uri: 'http://localhost:5117/graphql',
// });

// const httpLinkWithErrorHandling = ApolloLink.from([
//    errorLink,
//    httpLink,
// ]);      

@NgModule({
  imports: [BrowserModule, ApolloModule, HttpClientModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink) => {
        return {
          cache: new InMemoryCache({
            addTypename: false, // This is default, adds __typename automatically on read
          }),
          link: httpLink.create({
            uri: 'http://localhost:5117/graphql',
          }),
        };
      },
      deps: [HttpLink],
    },
  ],

})

export class GraphQLModule {}
