import * as Phaser from 'phaser';
import { Pathfinder } from '../navigation/pathfinder';
import { MapSizeInfo } from '../const/map-size.info';
import { ManualTilesHelper, TilePlacementWorldWithProperties } from '../manual-tiles/manual-tiles.helper';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { Vector2Simple } from '../math/intersection';
import { MapNavHelper } from '../map/map-nav-helper';
import { PlacedGameObject } from '../placable-objects/static-object';
import Tween = Phaser.Tweens.Tween;

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
      const currentNavTile = path[i];
      const tileXY = currentNavTile.tileWorldData.tileXY;
      const tileWorldXYCenter = TilemapHelper.getTileWorldCenterByTilemapTileXY(tileXY, {
        centerOfTile: true
      });

      const stepHeight = currentNavTile.tileLayerProperties?.stepHeight ?? 0;
      const stepHeightPercentage = stepHeight !== 0 ? stepHeight / MapSizeInfo.info.tileHeight : 0;
      const offsetLayerAndStepHeight = currentNavTile.tileWorldData.z + stepHeightPercentage;

      // make sure to move to correct layer and walkable height
      const tileWorldXYCenterWithOffset = {
        x: tileWorldXYCenter.x,
        y: tileWorldXYCenter.y - offsetLayerAndStepHeight * MapSizeInfo.info.tileHeight
      };

      // this.sinkSpriteInWater(stepHeightPercentage, selection.spriteInstance);

      // todo store this tween to selection so we can cancel it if needed
      this.scene.tweens.add({
        targets: selection.spriteInstance,
        x: tileWorldXYCenterWithOffset.x,
        y: tileWorldXYCenterWithOffset.y,
        duration: 300,
        ease: Phaser.Math.Easing.Linear, // Phaser.Math.Easing.Sine.InOut,
        yoyo: false,
        repeat: 0,
        onUpdate: (tween: Tween) => {
          this.handleSpriteUnderWaterCropping(
            tween,
            selection.spriteInstance,
            prevNavTile.tileLayerProperties?.stepHeight,
            currentNavTile.tileLayerProperties?.stepHeight
          );

          this.setSpriteDepthDuringNavigation(selection.spriteInstance, currentNavTile, prevNavTile, tileWorldXYCenter);
        },
        onComplete: () => {
          prevNavTile = currentNavTile;
          selection.tileWorldData = currentNavTile.tileWorldData; // update selection
          addTween(i + 1);
        }
      });
    };

    addTween(1);
  }

  /**
   * todo this is a bit hackish
   */
  private setSpriteDepthDuringNavigation(
    spriteInstance: Phaser.GameObjects.Sprite,
    currentPathNode: TilePlacementWorldWithProperties,
    prevNavTile: TilePlacementWorldWithProperties,
    tileWorldXYCenter: Vector2Simple
  ) {
    const currentDepth = ManualTilesHelper.getDepth(
      currentPathNode.tileWorldData.tileXY,
      tileWorldXYCenter,
      currentPathNode.tileWorldData.z
    );
    const prevDepth = ManualTilesHelper.getDepth(
      prevNavTile.tileWorldData.tileXY,
      tileWorldXYCenter, // todo
      prevNavTile.tileWorldData.z
    );

    spriteInstance.depth = Math.max(currentDepth, prevDepth);
  }

  /**
   * Can be improved - is a bit jagged when exiting water
   */
  private handleSpriteUnderWaterCropping(
    tween: Tween,
    spriteInstance: Phaser.GameObjects.Sprite,
    prevStepHeightIn: number | undefined,
    currentStepHeightIn?: number | undefined
  ) {
    const sinkBelow = spriteInstance.height;
    // if going below water
    const prevStepHeight = prevStepHeightIn ?? 0;
    const currentStepHeight = currentStepHeightIn ?? 0;

    if (currentStepHeight >= 0 && prevStepHeight >= 0) {
      if (spriteInstance.isCropped) {
        spriteInstance.setCrop();
      }
      return;
    }

    const halfTotal = tween.totalDuration / 2;
    if (prevStepHeight < currentStepHeight) {
      // going up
      if (tween.totalElapsed < halfTotal) {
        // percentage of tween elapsed
        const percentage = tween.totalElapsed / halfTotal;

        spriteInstance.setCrop(
          0,
          0,
          spriteInstance.width,
          spriteInstance.height - (sinkBelow - percentage * sinkBelow)
        );
      }
    } else if (prevStepHeight > currentStepHeight) {
      // going down
      if (tween.totalElapsed > halfTotal) {
        // percentage of tween elapsed
        const percentage = halfTotal / tween.totalElapsed;

        spriteInstance.setCrop(
          0,
          0,
          spriteInstance.width,
          spriteInstance.height - (sinkBelow - percentage * sinkBelow)
        );
      }
    } else {
      if (spriteInstance.isCropped) {
        spriteInstance.setCrop();
      }
    }
  }

  destroy() {
    // todo?
  }
}
