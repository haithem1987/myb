// libs/shared/data-access/src/lib/graphql.module.ts
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';

@NgModule({
  imports: [HttpClientModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink) => ({
        cache: new InMemoryCache(),
        link: httpLink.create({ uri: 'http://localhost:5145/graphql' }),
      }),
      deps: [HttpLink],
    },
  ],
  exports: [],
})
export class GraphQLModule {}
