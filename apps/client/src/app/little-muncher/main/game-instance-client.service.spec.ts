import { TestBed } from '@angular/core/testing';

import { GameInstanceClientService } from './game-instance-client.service';

describe('GameInstanceClientService', () => {
  let service: GameInstanceClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameInstanceClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
