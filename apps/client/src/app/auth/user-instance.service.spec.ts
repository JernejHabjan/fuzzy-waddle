import { TestBed } from '@angular/core/testing';

import { UserInstanceService } from './user-instance.service';

describe('UserInstanceService', () => {
  let service: UserInstanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserInstanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
