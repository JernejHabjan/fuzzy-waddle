import { TestBed } from '@angular/core/testing';

import { MapPlayerDefinitionsService } from './map-player-definitions.service';

describe('MapPlayerDefinitionsService', () => {
  let service: MapPlayerDefinitionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapPlayerDefinitionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
