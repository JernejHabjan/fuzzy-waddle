import { TestBed } from '@angular/core/testing';

import { AtlasLoaderService } from './atlas-loader.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AtlasLoaderService', () => {
  let service: AtlasLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AtlasLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
