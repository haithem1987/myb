import { TestBed } from '@angular/core/testing';

import { KeycloackService } from './keycloack.service';

describe('KeycloackService', () => {
  let service: KeycloackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeycloackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
