import { TestBed } from '@angular/core/testing';

import { DbAccessTestService } from './db-access-test.service';

describe('DbAccessTest', () => {
  let service: DbAccessTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DbAccessTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
