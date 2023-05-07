import { TilemapToAtlasMap } from '../../scenes/grassland.scene';
import { ManualTileLayer } from './manual-tiles/manual-tiles.helper';
import { Tilemaps } from 'phaser';

export class MapHelper {
  tilemapLayer!: Tilemaps.TilemapLayer;
  mappedTilesetsToAtlasesWithProperties!: TilemapToAtlasMap[];
  manualLayers!: ManualTileLayer[];
}
