import { TilemapToAtlasMap } from '../scenes/grassland.scene';
import { ManualTileLayer } from '../manual-tiles/manual-tiles.helper';
import * as Phaser from 'phaser';
import { PlacedGameObject } from '../placable-objects/static-object';

export class MapHelper {
  tilemapLayer!: Phaser.Tilemaps.TilemapLayer;
  mappedTilesetsToAtlasesWithProperties!: TilemapToAtlasMap[];
  manualLayers!: ManualTileLayer[];
  staticObjects!: PlacedGameObject[];
  dynamicObjects!: PlacedGameObject[];
}
