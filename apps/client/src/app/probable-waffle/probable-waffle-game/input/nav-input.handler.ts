import * as Phaser from 'phaser';
import { Pathfinder } from '../navigation/pathfinder';
import { MapSizeInfo } from '../const/map-size.info';
import { IsoHelper } from '../iso/iso-helper';
import { ManualTilesHelper, TilePlacementWorldWithProperties } from '../manual-tiles/manual-tiles.helper';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';
import { MapNavHelper } from '../map/map-nav-helper';

export class NavInputHandler {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly pathfinder: Pathfinder,
    private readonly mapNavHelper: MapNavHelper
  ) {}

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
      if (NavInputHandler.tileXYWithinMapBounds(navigableTile.tileWorldData.tileXY)) {
        try {
          const tileXYPathWithoutFirst = await this.pathfinder.find(
            objectTileXY, // todo objectTileXY is incorrect as it doesn't take into account z index!!!!
            {
              x: navigableTile.tileWorldData.tileXY.x,
              y: navigableTile.tileWorldData.tileXY.y
            },
            this.mapNavHelper.getFlattenedGrid
          );

          this.moveSpriteToTileCenters(gameObject, tileXYPathWithoutFirst);
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
  private moveSpriteToTileCenters(gameObject: Phaser.GameObjects.Sprite, path: TilePlacementWorldWithProperties[]) {
    const addTween = (i: number) => {
      if (i >= path.length) {
        return;
      }
      const currentPathNode = path[i];
      const tileXY = currentPathNode.tileWorldData.tileXY;
      const tileWorldXYCenter = TilemapHelper.getTileWorldCenterByTilemapTileXY(tileXY, {
        centerOfTile: true
      });

      const raised = (currentPathNode.tileLayerProperties?.stepHeight ?? 0) > 0 ? 1 : 0;
      const offsetLayerAndRaised = currentPathNode.tileWorldData.z + raised;

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
          addTween(i + 1);
        }
      });
    };

    addTween(0);
  }

  destroy() {
    // todo?
  }
}
