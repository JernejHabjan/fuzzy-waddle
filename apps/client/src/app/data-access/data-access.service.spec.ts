import { TestBed } from '@angular/core/testing';

import { DataAccessService } from './data-access.service';

describe('DataAccess', () => {
  let service: DataAccessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataAccessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
