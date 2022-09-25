import { TestBed } from '@angular/core/testing';

import { ProbableWafflePlaygroundService } from './probable-waffle-playground.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ProbableWafflePlaygroundService', () => {
  let service: ProbableWafflePlaygroundService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ProbableWafflePlaygroundService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
