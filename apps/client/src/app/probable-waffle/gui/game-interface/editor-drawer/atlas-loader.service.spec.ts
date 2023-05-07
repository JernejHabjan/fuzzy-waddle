import { TestBed } from '@angular/core/testing';

import { AtlasJsonWrapper, AtlasLoaderService, TileAtlasFrame } from './atlas-loader.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AtlasLoaderServiceInterface } from './tile-selector-group/atlas-loader.service.interface';

export const atlasLoaderServiceStub = {
  loadMap: (): Promise<TileAtlasFrame[]> => {
    return Promise.resolve([]);
  },
  loadAtlasJson: (tilesetName: string): Promise<AtlasJsonWrapper> => {
    return Promise.resolve({} as AtlasJsonWrapper);
  }
} as AtlasLoaderServiceInterface;

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
