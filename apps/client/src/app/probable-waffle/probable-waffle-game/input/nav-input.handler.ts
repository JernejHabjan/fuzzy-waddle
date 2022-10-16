import * as Phaser from 'phaser';
import { Pathfinder } from '../navigation/pathfinder';
import { MapSizeInfo } from '../const/map-size.info';
import { ManualTilesHelper, TilePlacementWorldWithProperties } from '../manual-tiles/manual-tiles.helper';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';
import { MapNavHelper } from '../map/map-nav-helper';
import { PlacedGameObject } from '../placable-objects/static-object';

export class NavInputHandler {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly pathfinder: Pathfinder,
    private readonly mapNavHelper: MapNavHelper
  ) {}

  static tileXYWithinMapBounds(tileXY: Vector2Simple): boolean {
    return 0 <= tileXY.x && tileXY.x <= MapSizeInfo.info.width && 0 <= tileXY.y && tileXY.y <= MapSizeInfo.info.height;
  }

  startNav(navigableTile: TilePlacementWorldWithProperties, selected: PlacedGameObject[]) {
    selected.forEach(async (selection) => {
      if (NavInputHandler.tileXYWithinMapBounds(navigableTile.tileWorldData.tileXY)) {
        try {
          const tileXYPath = await this.pathfinder.find(
            selection.tileWorldData.tileXY,
            {
              x: navigableTile.tileWorldData.tileXY.x,
              y: navigableTile.tileWorldData.tileXY.y
            },
            this.mapNavHelper.getFlattenedGrid
          );

          this.moveSpriteToTileCenters(selection, tileXYPath);
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
  private moveSpriteToTileCenters(selection: PlacedGameObject, path: TilePlacementWorldWithProperties[]) {
    let prevNavTile = path[0];
    const addTween = (i: number) => {
      if (i >= path.length) {
        return;
      }
      const currentPathNode = path[i];
      const tileXY = currentPathNode.tileWorldData.tileXY;
      const tileWorldXYCenter = TilemapHelper.getTileWorldCenterByTilemapTileXY(tileXY, {
        centerOfTile: true
      });

      const stepHeightPercentage =
        (currentPathNode.tileLayerProperties?.stepHeight ?? 0) > 0
          ? (currentPathNode.tileLayerProperties.stepHeight as number) / MapSizeInfo.info.tileHeight
          : 0;
      const offsetLayerAndStepHeight = currentPathNode.tileWorldData.z + stepHeightPercentage;

      // make sure to move to correct layer and walkable height
      const tileWorldXYCenterWithOffset = {
        x: tileWorldXYCenter.x,
        y: tileWorldXYCenter.y - offsetLayerAndStepHeight * MapSizeInfo.info.tileHeight
      };
      this.scene.tweens.add({
        targets: selection.spriteInstance,
        x: tileWorldXYCenterWithOffset.x,
        y: tileWorldXYCenterWithOffset.y,
        duration: 300,
        ease: Phaser.Math.Easing.Sine.InOut,
        yoyo: false,
        repeat: 0,
        onUpdate: () => {
          selection.spriteInstance.depth = ManualTilesHelper.getDepth(
            currentPathNode.tileWorldData.tileXY,
            tileWorldXYCenter,
            Math.max(prevNavTile.tileWorldData.z, currentPathNode.tileWorldData.z) // todo this is a bit hackish
          );
        },
        onComplete: () => {
          prevNavTile = currentPathNode;
          selection.tileWorldData = currentPathNode.tileWorldData; // update selection
          addTween(i + 1);
        }
      });
    };

    addTween(1);
  }

  destroy() {
    // todo?
  }
}
