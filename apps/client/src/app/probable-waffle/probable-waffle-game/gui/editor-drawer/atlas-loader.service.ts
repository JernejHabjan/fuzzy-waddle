import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface FrameWithMeta{
  filename: string,
  frame: Frame;
}
export interface Frame {
 x: number; y: number; w: number; h: number
}
export interface Atlas {
  textures: { frames: FrameWithMeta[] }[];
  meta: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class AtlasLoaderService {
  private readonly atlasUrl = 'assets/probable-waffle/atlas/iso-64x64-outside.json';

  constructor(private httpClient: HttpClient) {}

  load(): Promise<FrameWithMeta[]> {
    return firstValueFrom(this.httpClient.get<Atlas>(this.atlasUrl)).then((atlas) => {
      if(atlas.textures.length !== 1) {
        throw new Error('Atlas must have exactly one texture');
      }
      return atlas.textures[0].frames;
    });
  }
}
