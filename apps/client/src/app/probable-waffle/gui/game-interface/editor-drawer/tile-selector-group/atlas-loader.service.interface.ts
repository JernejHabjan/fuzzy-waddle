import { AtlasJsonWrapper, TileAtlasFrame } from '../atlas-loader.service';

export interface AtlasLoaderServiceInterface {
  loadMap(): Promise<TileAtlasFrame[]>;
  loadAtlasJson(tilesetName: string): Promise<AtlasJsonWrapper>;
}
