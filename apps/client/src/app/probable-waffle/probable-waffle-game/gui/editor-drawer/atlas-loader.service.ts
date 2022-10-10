import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MapDefinitions } from '../../const/map-size.info';
import { TilePossibleProperties } from '../../types/tile-types';

export interface AtlasFrameWithMeta {
  tilesetName: string;
  firstgid: number; // with what index does this tileset start
  framesWithMeta: FrameWithMeta[];
}

export interface TileFrame {
  filename: string;
  frame: Frame;
}
export interface FrameWithMeta extends TileFrame {
  id: number;
  tileProperties: TilePossibleProperties;
}

interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Atlas {
  frames: TileFrame[];
  meta: unknown;
}

interface TileProperties {
  name: string;
  type: string;
  value: string;
}

interface MapJson {
  layers: unknown[];
  tilesets: {
    name: string;
    firstgid: number;
    tilecount: number;
    tiles: { id: number; properties: TileProperties[] }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AtlasLoaderService {
  constructor(private httpClient: HttpClient) {}

  /**
   * Todo it'd be better to use loaded jsons from game
   */
  load(): Promise<AtlasFrameWithMeta[]> {
    return firstValueFrom(this.httpClient.get<MapJson>(MapDefinitions.mapJson)).then((atlas) => {
      const promises = atlas.tilesets.map((tileset) => {
        return firstValueFrom(this.httpClient.get<Atlas>(`assets/probable-waffle/atlas/${tileset.name}.json`)).then(
          (atlas) => {
            const filteredFrames: FrameWithMeta[] = [];
            tileset.tiles.forEach((tile) => {
              // tile properties to dict
              const tileProperties: TilePossibleProperties = {};
              tile.properties.forEach((property) => {
                tileProperties[property.name as keyof TilePossibleProperties] = property.value as any;
              });

              const tileFrame = atlas.frames[tile.id];
              filteredFrames.push({
                ...tileFrame,
                id: tile.id + tileset.firstgid,
                tileProperties
              });
            });

            return {
              tilesetName: tileset.name,
              firstgid: tileset.firstgid,
              framesWithMeta: filteredFrames
            } as AtlasFrameWithMeta;
          }
        );
      });
      return Promise.all(promises);
    });
  }
}
