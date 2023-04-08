import { TestBed } from '@angular/core/testing';

import { ServerHealthService } from './server-health.service';

describe('ServerHealthService', () => {
  let service: ServerHealthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerHealthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
