import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { MapDefinitions } from "../../../game/world/const/map-size.info";
import { TilePossibleProperties } from "../../../game/world/map/tile/types/tile-types";
import { AtlasLoaderServiceInterface } from "./tile-selector-group/atlas-loader.service.interface";

export interface TileAtlasFrame {
  tilesetName: string;
  firstgid: number; // with what index does this tileset start
  tileFrame: TileFrame[];
}

export interface AtlasFrame {
  filename: string;
  frame: Frame;
}

export interface TileFrame extends AtlasFrame {
  id: number;
  tileProperties: TilePossibleProperties;
}

interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Atlas {
  frames: AtlasFrame[];
  meta: unknown;
}

interface TileProperties {
  name: string;
  type: string;
  value: string;
}

interface Tile {
  id: number;
  properties: TileProperties[];
}

interface Tileset {
  name: string;
  firstgid: number;
  tilecount: number;
  tiles: Tile[];
}

interface MapJson {
  layers: unknown[];
  tilesets: Tileset[];
}

export interface AtlasJsonWrapper {
  tilesetName: string;
  atlas: Atlas;
}

@Injectable({
  providedIn: "root"
})
export class AtlasLoaderService implements AtlasLoaderServiceInterface {
  constructor(private httpClient: HttpClient) {}

  /**
   * Todo it'd be better to use loaded jsons from game reference
   */
  async loadMap(): Promise<TileAtlasFrame[]> {
    const mapJson = await this.loadMapJson();
    const promises = mapJson.tilesets.map(async (tileset) => {
      const atlasJson = await this.loadAtlasJson(tileset.name);

      return {
        tilesetName: tileset.name,
        firstgid: tileset.firstgid,
        tileFrame: this.extractTileFrames(tileset, atlasJson.atlas)
      } satisfies TileAtlasFrame;
    });
    return Promise.all(promises);
  }

  async loadAtlasJson(tilesetName: string): Promise<AtlasJsonWrapper> {
    return {
      tilesetName,
      atlas: await firstValueFrom(this.httpClient.get<Atlas>(`assets/probable-waffle/atlas/${tilesetName}.json`))
    };
  }

  private loadMapJson(): Promise<MapJson> {
    return firstValueFrom(this.httpClient.get<MapJson>(MapDefinitions.tilemapMapJson));
  }

  private extractTileFrames(tileset: Tileset, atlas: Atlas): TileFrame[] {
    const filteredFrames: TileFrame[] = [];
    tileset.tiles.forEach((tile) => {
      const tileFrame = atlas.frames[tile.id];
      filteredFrames.push({
        ...tileFrame,
        id: tile.id + tileset.firstgid,
        tileProperties: this.extractTileProperties(tile)
      });
    });
    return filteredFrames;
  }

  /**
   * convert tile properties to TilePossibleProperties dictionary
   */
  private extractTileProperties(tile: Tile): TilePossibleProperties {
    const tileProperties: TilePossibleProperties = {};
    tile.properties.forEach((property) => {
      tileProperties[property.name as keyof TilePossibleProperties] = property.value as any;
    });
    return tileProperties;
  }
}
