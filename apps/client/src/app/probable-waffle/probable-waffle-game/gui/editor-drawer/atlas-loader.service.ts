import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MapDefinitions } from '../../const/map-size.info';

export interface AtlasFrameWithMeta{
  tilesetName: string;
  firstgid:number; // with what index does this tileset start
  framesWithMeta: FrameWithMeta[];
}

export interface FrameWithMeta {
  filename: string;
  frame: Frame;
}


interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Atlas {
  textures: { frames: FrameWithMeta[] }[];
  meta: unknown;
}

interface MapJson {
layers: unknown[];
tilesets: {name:string, firstgid:number, tilecount:number}[];
}


@Injectable({
  providedIn: 'root'
})
export class AtlasLoaderService {
  constructor(private httpClient: HttpClient) {}

  load(): Promise<AtlasFrameWithMeta[]> {

    return firstValueFrom(this.httpClient.get<MapJson>(MapDefinitions.mapJson)).then((atlas) => {

      const promises = atlas.tilesets.map((tileset) => {
        return firstValueFrom(this.httpClient.get<Atlas>(`assets/probable-waffle/atlas/${tileset.name}.json`)).then((atlas) => {
          if (atlas.textures.length !== 1) {
            throw new Error('Atlas must have exactly one texture');
          }
          return {
            tilesetName: tileset.name,
            firstgid: tileset.firstgid,
            framesWithMeta:atlas.textures[0].frames
          } as AtlasFrameWithMeta;
        });
      });
      return Promise.all(promises);
    });
  }
}
