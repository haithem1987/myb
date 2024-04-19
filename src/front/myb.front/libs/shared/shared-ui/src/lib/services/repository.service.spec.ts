import { TestBed } from '@angular/core/testing';
import {
  ApolloTestingModule,
  ApolloTestingController,
} from 'apollo-angular/testing';
import { RepositoryService } from './repository.service';
import { typeConfig } from '../graphql/type-config';
import { gql } from 'apollo-angular';

describe('RepositoryService', () => {
  let service: RepositoryService<any>;
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      providers: [RepositoryService],
    });

    service = TestBed.inject(RepositoryService);
    controller = TestBed.inject(ApolloTestingController);

    // Mock typeConfig for your tests
    typeConfig['testType'] = {
      getAll: 'query { items { id } }',
      getById: 'query getItem($id: ID!) { item(id: $id) { id } }',
      create:
        'mutation createItem($item: ItemType!) { createItem(item: $item) { id } }',
      update:
        'mutation updateItem($id: ID!, $item: ItemType!) { updateItem(id: $id, item: $item) { id } }',
      delete: 'mutation deleteItem($id: ID!) { deleteItem(id: $id) }',
    };
  });

  afterEach(() => {
    controller.verify();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all items', () => {
    service.getAll().subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0]['id']).toBe(1);
    });

    const op = controller.expectOne(
      gql`
        ${typeConfig['testType'].getAll}
      `
    );
    expect(op.operation.variables).toEqual({});
    op.flush({
      data: {
        items: [{ id: 1 }],
      },
    });
  });

  it('should fetch a single item', () => {
    const id = 1;
    service.get(id).subscribe((item) => {
      expect(item['id']).toBe(id);
    });

    const op = controller.expectOne(
      gql`
        ${typeConfig['testType'].getById}
      `
    );
    expect(op.operation.variables['id']).toEqual(id);
    op.flush({
      data: {
        item: { id },
      },
    });
  });

  // Add more tests for create, update, delete methods following similar patterns
});
