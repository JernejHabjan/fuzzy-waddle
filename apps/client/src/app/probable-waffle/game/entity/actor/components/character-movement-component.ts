import {
  ManualTilesHelper,
  TilePlacementWorldWithProperties
} from "../../../world/map/tile/manual-tiles/manual-tiles.helper";
import { TilemapHelper_old } from "../../../world/map/tile/tilemapHelper_old";
import { MapSizeInfo_old } from "../../../world/const/map-size.info_old";
import { IComponent } from "../../../core/component.service";
import { Actor } from "../actor";
import { Events, GameObjects, Tweens } from "phaser";
import { SpriteRepresentationComponent } from "./sprite-representable-component";
import { TransformComponent } from "./transformable-component";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export enum MoveEventTypeEnum {
  MOVE_START = "move-start",
  MOVE_END = "move-end",
  MOVE_PROGRESS = "move-progress"
}

export class CharacterMovementComponent implements IComponent {
  moveEventEmitter = new Events.EventEmitter();
  isMoving = false;
  // todo refactor navigation component to use navigation tree
  private path?: TilePlacementWorldWithProperties[];
  private currentNavTween?: Tweens.Tween;

  constructor(private readonly gameObject: Actor) {}

  init() {
    // pass
  }

  /**
   * todo replace tweens with something else?
   * todo this needs to be improved - this is hacky
   */
  moveSpriteToTileCenters(path: TilePlacementWorldWithProperties[]) {
    if (this.gameObject.killed) {
      return;
    }
    this.path = path;
    this.cancelMove();
    this.startNav();
  }

  cancelMove() {
    if (this.currentNavTween) {
      this.currentNavTween.stop();
      this.currentNavTween = undefined;
    }
    this.isMoving = false;
  }

  canMove() {
    return !this.isMoving;
  }

  private startMove() {
    this.moveEventEmitter.emit(MoveEventTypeEnum.MOVE_START);
    this.isMoving = true;
  }

  private stopMove() {
    this.isMoving = false;
    this.moveEventEmitter.emit(MoveEventTypeEnum.MOVE_END);
  }

  private startNav() {
    const spriteRepresentationComponent = this.gameObject.components.findComponent(SpriteRepresentationComponent);
    const transformComponent = this.gameObject.components.findComponent(TransformComponent);
    const scene = spriteRepresentationComponent.scene;
    const path = this.path;
    if (!path) {
      return;
    }
    let prevNavTile = path[0];
    this.startMove();

    const addTween = (i: number) => {
      if (i >= path.length) {
        return;
      }
      const currentNavTile = path[i];
      const tileXY = currentNavTile.tileWorldData.tileXY;
      const tileWorldXYCenter = TilemapHelper_old.getTileWorldCenterByTilemapTileXY(tileXY, {
        centerOfTile: true
      });

      const stepHeight = currentNavTile.tileLayerProperties?.stepHeight ?? 0;
      const stepHeightPercentage = stepHeight !== 0 ? stepHeight / MapSizeInfo_old.info.tileHeight : 0;
      const offsetLayerAndStepHeight = currentNavTile.tileWorldData.z + stepHeightPercentage;

      // make sure to move to correct layer and walkable height
      const tileWorldXYCenterWithOffset = {
        x: tileWorldXYCenter.x,
        y: tileWorldXYCenter.y - offsetLayerAndStepHeight * MapSizeInfo_old.info.tileHeight
      };

      // this.sinkSpriteInWater(stepHeightPercentage, selection.spriteInstance);

      const offsetByCharacterCenter = MapSizeInfo_old.info.tileHeightHalf + MapSizeInfo_old.info.tileHeightHalf / 4;

      this.currentNavTween = scene.tweens.add({
        targets: spriteRepresentationComponent.sprite,
        x: tileWorldXYCenterWithOffset.x,
        y: tileWorldXYCenterWithOffset.y - offsetByCharacterCenter,
        duration: 300,
        ease: Phaser.Math.Easing.Linear, // Phaser.Math.Easing.Sine.InOut,
        yoyo: false,
        repeat: 0,
        onUpdate: (tween: Tweens.Tween) => {
          const direction = Phaser.Math.Angle.BetweenPoints(
            prevNavTile.tileWorldData.tileXY,
            currentNavTile.tileWorldData.tileXY
          );
          // get iso angle (one of 8 directions)
          const isoAngle = Phaser.Math.RadToDeg(direction);
          const isoAngleRounded = Math.round(isoAngle / 45) * 45;

          // notify move
          this.moveEventEmitter.emit(MoveEventTypeEnum.MOVE_PROGRESS, isoAngleRounded);

          this.handleSpriteUnderWaterCropping(
            tween,
            spriteRepresentationComponent.sprite,
            prevNavTile.tileLayerProperties?.stepHeight,
            currentNavTile.tileLayerProperties?.stepHeight
          );

          this.setSpriteDepthDuringNavigation(
            spriteRepresentationComponent.sprite,
            currentNavTile,
            prevNavTile,
            tileWorldXYCenter
          );
        },
        onComplete: () => {
          prevNavTile = currentNavTile;
          transformComponent.transform({
            tileXY: currentNavTile.tileWorldData.tileXY,
            z: currentNavTile.tileWorldData.z
          });

          if (i + 1 < path.length) {
            addTween(i + 1);
          } else {
            this.stopMove();
          }
        }
      });
    };

    addTween(1);
  }

  /**
   * todo this is a bit hackish
   */
  private setSpriteDepthDuringNavigation(
    spriteInstance: GameObjects.Sprite,
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
    tween: Tweens.Tween,
    spriteInstance: GameObjects.Sprite,
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
