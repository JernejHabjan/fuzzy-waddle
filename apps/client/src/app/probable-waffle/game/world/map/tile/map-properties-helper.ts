import { TilePossibleProperties } from "./types/tile-types";
import { TilemapToAtlasMap } from "../../scenes/grassland.scene";
import { MapHelper } from "./map-helper";
import { Textures } from "phaser";

export class MapPropertiesHelper {
  constructor(
    private readonly mapHelper: MapHelper,
    private readonly textures: Textures.TextureManager
  ) {}

  mapLayerTilesetsToAtlasesAndExtractProperties() {
    const tilesetAtlasNameMapper: TilemapToAtlasMap[] = [];
    this.mapHelper.tilemapLayer.tileset.forEach((tileset) => {
      let i = tilesetAtlasNameMapper.length;
      for (i; i < tileset.firstgid; i++) {
        tilesetAtlasNameMapper.push({ imageName: null, atlasName: null, imageSuffix: null, tileProperties: null });
      }
      const atlasTexture = this.textures.get(tileset.name);

      const frames = atlasTexture.getFrameNames();
      // push to array
      frames.forEach((frameName: string, i: number) => {
        // split frameName by "." and get 2 variables
        const [imageName, imageSuffix] = frameName.split(".");
        const tileProperties = (tileset.tileProperties as TilePossibleProperties[])[i];
        tilesetAtlasNameMapper.push({ imageName, imageSuffix, atlasName: tileset.name, tileProperties });
      });
    });

    this.mapHelper.mappedTilesetsToAtlasesWithProperties = tilesetAtlasNameMapper;
  }
}
