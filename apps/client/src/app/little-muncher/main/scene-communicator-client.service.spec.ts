import { TestBed } from '@angular/core/testing';

import { SceneCommunicatorClientService } from './scene-communicator-client.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SceneCommunicatorClientServiceInterface } from './scene-communicator-client.service.interface';

export const SceneCommunicatorClientServiceStub = {
  startListeningToEvents() {
    //
  },
  stopListeningToEvents() {
    //
  }
} as SceneCommunicatorClientServiceInterface;
describe('SceneCommunicatorClientService', () => {
  let service: SceneCommunicatorClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SceneCommunicatorClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
