import { TestBed } from '@angular/core/testing';

import { RootFolderService } from './root-folder.service';

describe('RootFolderService', () => {
  let service: RootFolderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RootFolderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
