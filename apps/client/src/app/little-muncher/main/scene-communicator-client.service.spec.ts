import { TestBed } from '@angular/core/testing';

import { SceneCommunicatorClientService } from './scene-communicator-client.service';

describe('SceneCommunicatorClientService', () => {
  let service: SceneCommunicatorClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SceneCommunicatorClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
