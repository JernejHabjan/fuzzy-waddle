import { Warrior1 } from './warrior1';
import { ManualTilesHelper, TilePlacementWorldWithProperties } from '../manual-tiles/manual-tiles.helper';
import { TilemapHelper } from '../tilemap/tilemap.helper';
import { MapSizeInfo } from '../const/map-size.info';
import * as Phaser from 'phaser';
import { IsoAngleToAnimDirectionEnum } from '../animation/lpc-animation-helper';
import Tween = Phaser.Tweens.Tween;
import { Vector2Simple } from '../math/intersection';
import { IComponent } from '../services/component.service';

export class CharacterNavigationComponent implements IComponent {
  private gameObject!: Warrior1; // todo!!! replace with interfaces -> for example Phaser.GameObjects.Sprite & NavigationComponent...
  private path?: TilePlacementWorldWithProperties[];
  private currentNavTween?: Phaser.Tweens.Tween;

  init(gameObject: Warrior1) {
    // todo!!!
    this.gameObject = gameObject;
  }

  /**
   * todo replace tweens with something else?
   * todo this needs to be improved - this is hacky
   */
  moveSpriteToTileCenters(path: TilePlacementWorldWithProperties[]) {
    this.path = path;
    this.cancelMove();
    this.startNav();
  }

  cancelMove() {
    if (this.currentNavTween) {
      this.currentNavTween.stop();
      this.currentNavTween = undefined;
    }
  }

  private startNav() {
    const { scene } = this.gameObject;
    const path = this.path;
    if (!path) {
      return;
    }
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

      const offsetByCharacterCenter = MapSizeInfo.info.tileHeightHalf + MapSizeInfo.info.tileHeightHalf / 4;

      // todo store this tween to selection so we can cancel it if needed
      this.gameObject.isMoving = true;
      this.currentNavTween = scene.tweens.add({
        targets: this.gameObject,
        x: tileWorldXYCenterWithOffset.x,
        y: tileWorldXYCenterWithOffset.y - offsetByCharacterCenter,
        duration: 300,
        ease: Phaser.Math.Easing.Linear, // Phaser.Math.Easing.Sine.InOut,
        yoyo: false,
        repeat: 0,
        onUpdate: (tween: Tween) => {
          const direction = Phaser.Math.Angle.BetweenPoints(
            prevNavTile.tileWorldData.tileXY,
            currentNavTile.tileWorldData.tileXY
          );
          // get iso angle (one of 8 directions)
          const isoAngle = Phaser.Math.RadToDeg(direction);
          const isoAngleRounded = Math.round(isoAngle / 45) * 45;

          this.gameObject.move(IsoAngleToAnimDirectionEnum[isoAngleRounded.toString()]);
          this.handleSpriteUnderWaterCropping(
            tween,
            this.gameObject,
            prevNavTile.tileLayerProperties?.stepHeight,
            currentNavTile.tileLayerProperties?.stepHeight
          );

          this.setSpriteDepthDuringNavigation(this.gameObject, currentNavTile, prevNavTile, tileWorldXYCenter);
        },
        onComplete: () => {
          prevNavTile = currentNavTile;
          this.gameObject.tilePlacementData.tileXY = currentNavTile.tileWorldData.tileXY; // update selection
          this.gameObject.tilePlacementData.z = currentNavTile.tileWorldData.z; // update selection

          this.gameObject.isMoving = false;

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
    if (currentPathNode.tileWorldData.z > prevNavTile.tileWorldData.z) {
      spriteInstance.depth = currentDepth;
    } else if (currentPathNode.tileWorldData.z < prevNavTile.tileWorldData.z) {
      spriteInstance.depth = prevDepth;
    } else {
      spriteInstance.depth = currentDepth;
    }
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
}
