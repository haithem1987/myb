import { TestBed } from '@angular/core/testing';

import { DownloadFilesService } from './download-files.service';

describe('DownloadFilesService', () => {
  let service: DownloadFilesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DownloadFilesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
