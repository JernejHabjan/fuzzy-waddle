import { TestBed } from '@angular/core/testing';

import { PlaygroundService } from './playground.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('PlaygroundService', () => {
  let service: PlaygroundService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(PlaygroundService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
