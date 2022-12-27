import { TestBed } from '@angular/core/testing';

import { GameInstanceService } from './game-instance.service';

describe('GameInstanceService', () => {
  let service: GameInstanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameInstanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
