import * as Phaser from 'phaser';
import { Pathfinder } from '../navigation/pathfinder';
import { MapSizeInfo } from '../const/map-size.info';
import { IsoHelper } from '../iso/iso-helper';
import { ManualTilesHelper, TilePlacementWorldWithProperties } from '../manual-tiles/manual-tiles.helper';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';

export class OtherInputHandler {
  private scene: Phaser.Scene;
  private input: Phaser.Input.InputPlugin;
  private pathfinder: Pathfinder;
  private navigationGrid: number[][];

  constructor(
    scene: Phaser.Scene,
    input: Phaser.Input.InputPlugin,
    pathfinder: Pathfinder,
    navigationGrid: number[][]
  ) {
    this.scene = scene; // todo temp because of tweens
    this.input = input;
    this.pathfinder = pathfinder;
    this.navigationGrid = navigationGrid;
  }

  static tileXYWithinMapBounds(tileXY: Vector2Simple): boolean {
    return 0 <= tileXY.x && tileXY.x <= MapSizeInfo.info.width && 0 <= tileXY.y && tileXY.y <= MapSizeInfo.info.height;
  }

  startNav(navigableTile: TilePlacementWorldWithProperties, selected: Phaser.GameObjects.Sprite[]) {
    const spriteOffset = TilemapHelper.tileCenterOffset;
    selected.forEach(async (gameObject) => {
      const objectTileXY = IsoHelper.isometricWorldToTileXY(
        gameObject.x - MapSizeInfo.info.tileWidthHalf,
        gameObject.y - MapSizeInfo.info.tileWidthHalf - spriteOffset,
        true
      );
      if (OtherInputHandler.tileXYWithinMapBounds(navigableTile.tileWorldData.tileXY)) {
        try {
          const tileXYPathWithoutFirst = await this.pathfinder.find(
            objectTileXY,
            {
              x: navigableTile.tileWorldData.tileXY.x,
              y: navigableTile.tileWorldData.tileXY.y
            },
            this.navigationGrid
          );

          /**
           * todo this is hacky - we need to get the height of the tile we are navigating to
           * we should get stepHeight property for every tile when calling moveSpriteToTileCenters
           */
          const raised = (navigableTile.tileLayerProperties?.stepHeight ?? 0) > 0 ? 1 : 0;
          const offsetLayerAndRaised = navigableTile.tileWorldData.z + raised;
          this.moveSpriteToTileCenters(gameObject, tileXYPathWithoutFirst, offsetLayerAndRaised);
        } catch (e) {
          console.log(e);
        }
      }
    });
  }

  /**
   * todo replace tweens with something else?
   * todo this needs to be improved - this is hacky
   */
  private moveSpriteToTileCenters(
    gameObject: Phaser.GameObjects.Sprite,
    tilesXY: Vector2Simple[],
    // todo this is to be removed when navigationGrid actually contains tile properties, so we can read height and other props when navigating here
    offsetLayerAndRaised: number
  ) {
    const addTween = (tilesXY: Vector2Simple[], i: number) => {
      if (i >= tilesXY.length) {
        return;
      }
      const tileXY = tilesXY[i];
      const tileWorldXYCenter = TilemapHelper.getTileWorldCenterByTilemapTileXY(tileXY, {
        centerOfTile: true
      });
      // make sure to move to correct layer and walkable height
      const tileWorldXYCenterWithOffset = {
        x: tileWorldXYCenter.x,
        y: tileWorldXYCenter.y - offsetLayerAndRaised * MapSizeInfo.info.tileHeight
      };
      this.scene.tweens.add({
        targets: gameObject,
        x: tileWorldXYCenterWithOffset.x,
        y: tileWorldXYCenterWithOffset.y,
        duration: 1000,
        ease: Phaser.Math.Easing.Sine.InOut,
        yoyo: false,
        repeat: 0,
        onUpdate: () => {
          gameObject.depth = ManualTilesHelper.getDepth(tileXY, tileWorldXYCenter, offsetLayerAndRaised); // todo + walkable height?
        },
        onComplete: () => {
          addTween(tilesXY, i + 1);
        }
      });
    };

    addTween(tilesXY, 0);
  }

  destroy() {
    // todo?
  }
}
