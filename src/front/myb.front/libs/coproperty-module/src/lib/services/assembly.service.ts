import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Assembly, CreateAssemblyInput, AssemblyStatus } from '../models/assembly.model';
import { GET_ASSEMBLIES, GET_UPCOMING_ASSEMBLIES, GET_ASSEMBLY_BY_ID } from '../graphql/queries/assembly.queries';
import { CREATE_ASSEMBLY, UPDATE_ASSEMBLY, UPDATE_ASSEMBLY_STATUS, DELETE_ASSEMBLY } from '../graphql/mutations/assembly.mutations';

@Injectable({
  providedIn: 'root'
})
export class AssemblyService {
  constructor(private apollo: Apollo) {}

  getAssemblies(copropertyId: string): Observable<Assembly[]> {
    return this.apollo.query<{ assemblies: Assembly[] }>({
      query: GET_ASSEMBLIES,
      variables: { copropertyId },
      fetchPolicy: 'network-only',
      context: { service: 'copropertyService' }
    }).pipe(
      map(result => result.data.assemblies)
    );
  }

  getUpcomingAssemblies(copropertyId: string): Observable<Assembly[]> {
    return this.apollo.query<{ assemblies: Assembly[] }>({
      query: GET_UPCOMING_ASSEMBLIES,
      variables: { copropertyId },
      fetchPolicy: 'network-only',
      context: { service: 'copropertyService' }
    }).pipe(
      map(result => result.data.assemblies)
    );
  }

  getAssemblyById(id: string): Observable<Assembly> {
    return this.apollo.query<{ assembly: Assembly }>({
      query: GET_ASSEMBLY_BY_ID,
      variables: { id },
      fetchPolicy: 'network-only',
      context: { service: 'copropertyService' }
    }).pipe(
      map(result => result.data.assembly)
    );
  }

  createAssembly(input: CreateAssemblyInput): Observable<Assembly> {
    return this.apollo.mutate<{ createAssembly: Assembly }>({
      mutation: CREATE_ASSEMBLY,
      variables: { input },
      context: { service: 'copropertyService' }
    }).pipe(
      map(result => result.data!.createAssembly)
    );
  }

  updateAssembly(id: string, input: Partial<Assembly>): Observable<Assembly> {
    return this.apollo.mutate<{ updateAssembly: Assembly }>({
      mutation: UPDATE_ASSEMBLY,
      variables: { id, input },
      context: { service: 'copropertyService' }
    }).pipe(
      map(result => result.data!.updateAssembly)
    );
  }

  updateAssemblyStatus(id: string, status: AssemblyStatus): Observable<Assembly> {
    return this.apollo.mutate<{ updateAssemblyStatus: Assembly }>({
      mutation: UPDATE_ASSEMBLY_STATUS,
      variables: { id, status },
      context: { service: 'copropertyService' }
    }).pipe(
      map(result => result.data!.updateAssemblyStatus)
    );
  }

  deleteAssembly(id: string): Observable<boolean> {
    return this.apollo.mutate<{ deleteAssembly: boolean }>({
      mutation: DELETE_ASSEMBLY,
      variables: { id },
      context: { service: 'copropertyService' }
    }).pipe(
      map(result => result.data!.deleteAssembly)
    );
  }
}
