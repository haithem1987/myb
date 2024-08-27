import { Injectable } from '@angular/core';
import { RepositoryService } from '../../../../shared/infra/services/repository.service';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root',
})
export class ClientService extends RepositoryService<Client> {
  private clientSubject = new BehaviorSubject<Client[]>([]);
  public clients$ = this.clientSubject.asObservable();

  constructor(apollo: Apollo) {
    super(apollo, 'Client', 'invoiceService');
    this.loadInitialClients();
  }

  private loadInitialClients(): void {
    this.getAll().subscribe((clients) => this.clientSubject.next(clients));
  }

  protected override mapAllItems(result: any): Client[] {
    return result.data?.allClients || [];
  }

  protected override mapCreateItem(result: any): Client {
    return result.data?.addClient as Client;
  }
  protected override mapSingleItem(result: any): Client {
    return result.data?.clientByID as Client;
  }
  protected override mapUpdateItem(result: any): Client {
    return result.data?.updateClient as Client;
  }

  override getAll(): Observable<Client[]> {
    return super.getAll().pipe(
      map((clients) => {
        this.clientSubject.next(clients);
        return clients;
      })
    );
  }

  override get(id: number): Observable<Client> {
    return super.get(id).pipe(
      map((client) => {
        console.log('client', client);
        return client;
      })
    );
  }

  override create(item: Client): Observable<Client> {
    return super.create(item).pipe(
      map((newClient) => {
        const clients = [...this.clientSubject.value, newClient];
        this.clientSubject.next(clients);
        console.log('new client', newClient);
        return newClient;
      })
    );
  }

  override update(id: number, item: Client): Observable<Client> {
    return super.update(id, item).pipe(
      map((updatedClient) => {
        const taxes = this.clientSubject.value.map((c) =>
          c.id === id ? updatedClient : c
        );
        this.clientSubject.next(taxes);
        return updatedClient;
      })
    );
  }
}
