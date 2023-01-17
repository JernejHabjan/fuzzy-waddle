import * as Phaser from 'phaser';
import { MapDefinitions } from '../../const/map-size.info';
import { TilePossibleProperties } from './types/tile-types';
import { TilemapToAtlasMap } from '../../scenes/grassland.scene';
import { MapHelper } from './map-helper';

export class MapPropertiesHelper{
  constructor(private readonly mapHelper: MapHelper, private readonly textures: Phaser.Textures.TextureManager) {
  }


  mapLayerTilesetsToAtlasesAndExtractProperties() {
    const tilesetAtlasNameMapper: TilemapToAtlasMap[] = [];
    this.mapHelper.tilemapLayer.tileset.forEach((tileset) => {
      let i = tilesetAtlasNameMapper.length;
      for (i; i < tileset.firstgid; i++) {
        tilesetAtlasNameMapper.push({ imageName: null, atlasName: null, imageSuffix: null, tileProperties: null });
      }
      const atlasTexture = this.textures.get(tileset.name + MapDefinitions.atlasSuffix);

      const frames = atlasTexture.getFrameNames();
      // push to array
      frames.forEach((frameName:string, i:number) => {
        // split frameName by "." and get 2 variables
        const [imageName, imageSuffix] = frameName.split('.');
        const tileProperties = (tileset.tileProperties as TilePossibleProperties[])[i];
        tilesetAtlasNameMapper.push({ imageName, imageSuffix, atlasName: tileset.name, tileProperties });
      });
    });

    this.mapHelper.mappedTilesetsToAtlasesWithProperties =tilesetAtlasNameMapper;
  }
}
