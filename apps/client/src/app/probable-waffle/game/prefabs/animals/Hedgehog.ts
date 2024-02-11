// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import {
  ANIM_HEDGEHOG_BALL_DOWN,
  ANIM_HEDGEHOG_BALL_LEFT,
  ANIM_HEDGEHOG_BALL_RIGHT,
  ANIM_HEDGEHOG_BALL_TOP,
  ANIM_HEDGEHOG_IDLE_DOWN,
  ANIM_HEDGEHOG_IDLE_LEFT,
  ANIM_HEDGEHOG_IDLE_RIGHT,
  ANIM_HEDGEHOG_IDLE_TOP,
  ANIM_HEDGEHOG_WALK_DOWN,
  ANIM_HEDGEHOG_WALK_LEFT,
  ANIM_HEDGEHOG_WALK_RIGHT,
  ANIM_HEDGEHOG_WALK_TOP
} from "./anims/animals";
import { setActorData } from "../../data/actor-data";
import { MovementSystem, PathMoveConfig } from "../../entity/systems/movement.system";
import { getActorSystem } from "../../data/actor-system";
import { getSceneService } from "../../scenes/components/scene-component-helpers";
import { NavigationService } from "../../scenes/services/navigation.service";
import { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Hedgehog extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 21.596080279718947, texture || "animals", frame ?? "hedgehog/10.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 18, 11.323425464509395), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6748775087412171);

    /* START-USER-CTR-CODE */
    setActorData(this, [], [new MovementSystem(this)]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private readonly actionDelay = 5000;
  private readonly movementSpeed = 2000;
  private currentDelay: Phaser.Time.TimerEvent | null = null;

  override addedToScene() {
    super.addedToScene();

    this.moveHedgehog();
    this.handleClick();
  }

  private handleClick() {
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, async () => {
      // Cancel the current delay if it exists
      if (this.currentDelay) {
        this.currentDelay.remove(false);
        this.currentDelay = null;
      }

      // Stop the current tween if it exists
      this.cancelMovement();

      // get appropriate ball animation
      const currentTile = this.getCurrentTile();
      if (!currentTile) return;
      const anim = await this.getAnim(currentTile);
      if (!anim) return;
      const { ballAnim } = anim;

      this.play(ballAnim);
      this.moveHedgehogAfterDelay();
    });
  }
  async moveHedgehog() {
    if (!this.active) return;

    const newTile = await this.getNewTile();

    if (!newTile) {
      this.moveHedgehogAfterDelay();
      return;
    }

    const anim = await this.getAnim(newTile);
    if (!anim) return;
    const { ballAnim, idleAnim } = anim;

    // Randomly decide if the hedgehog should pause and play an idle animation
    if (Phaser.Math.Between(0, 10) < 3) {
      this.play(idleAnim);
      this.moveHedgehogAfterDelay();
    } else {
      const movementSystem = getActorSystem<MovementSystem>(this, MovementSystem);
      if (!movementSystem) return;
      try {
        await movementSystem.moveToLocation(
          {
            x: newTile.x,
            y: newTile.y,
            z: 0
          } satisfies Vector3Simple,
          {
            duration: this.movementSpeed,
            onPathUpdate: async (newTileXY) => {
              if (!this.active) return;
              const anim = await this.getAnim(newTileXY);
              if (!anim) return;
              this.play(anim.walkAnim);
            }
          } satisfies PathMoveConfig
        );
      } catch (e) {
        console.error(e);
        this.moveHedgehogAfterDelay();
        return;
      }

      if (!this.active) return;
      this.play(ballAnim);
      this.moveHedgehogAfterDelay();
    }
  }

  private moveHedgehogAfterDelay() {
    this.currentDelay = this.scene.time.delayedCall(this.actionDelay, this.moveHedgehog, [], this);
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.currentDelay?.remove(false);
    this.cancelMovement();
  }

  private cancelMovement = () => {
    const movementSystem = getActorSystem<MovementSystem>(this, MovementSystem);
    if (movementSystem) movementSystem.cancelMovement();
  };

  private async getNewTile(): Promise<Vector2Simple | undefined> {
    const navigationService = getSceneService(this.scene, NavigationService);
    if (!navigationService) return;

    const currentTile = this.getCurrentTile();
    if (!currentTile) return;
    return await navigationService.randomTileInNavigableRadius(currentTile, 5);
  }

  private getCurrentTile(): Vector2Simple | undefined {
    const navigationService = getSceneService(this.scene, NavigationService);
    if (!navigationService) return;

    return navigationService.getCenterTileCoordUnderObject(this);
  }

  private async getAnim(newTile: Vector2Simple): Promise<
    | {
        walkAnim: string;
        ballAnim: string;
        idleAnim: string;
      }
    | undefined
  > {
    const currentTile = this.getCurrentTile();
    if (!currentTile) return;

    const navigationService = getSceneService(this.scene, NavigationService);
    if (!navigationService) return;

    const currentTileWorldXY = navigationService.getTileWorldCenter(currentTile)!;
    const newTileWorldXY = navigationService.getTileWorldCenter(newTile)!;

    // here we're comparing world coordinates to determine the direction. Iso tile coordinates produce different results
    const directionX = newTileWorldXY.x - currentTileWorldXY.x;
    const directionY = newTileWorldXY.y - currentTileWorldXY.y;

    let walkAnim: string;
    let ballAnim: string;
    let idleAnim: string;

    if (Math.abs(directionX) > Math.abs(directionY)) {
      if (directionX > 0) {
        walkAnim = ANIM_HEDGEHOG_WALK_RIGHT;
        ballAnim = ANIM_HEDGEHOG_BALL_RIGHT;
        idleAnim = ANIM_HEDGEHOG_IDLE_RIGHT;
      } else {
        walkAnim = ANIM_HEDGEHOG_WALK_LEFT;
        ballAnim = ANIM_HEDGEHOG_BALL_LEFT;
        idleAnim = ANIM_HEDGEHOG_IDLE_LEFT;
      }
    } else {
      if (directionY > 0) {
        walkAnim = ANIM_HEDGEHOG_WALK_DOWN;
        ballAnim = ANIM_HEDGEHOG_BALL_DOWN;
        idleAnim = ANIM_HEDGEHOG_IDLE_DOWN;
      } else {
        walkAnim = ANIM_HEDGEHOG_WALK_TOP;
        ballAnim = ANIM_HEDGEHOG_BALL_TOP;
        idleAnim = ANIM_HEDGEHOG_IDLE_TOP;
      }
    }
    return { walkAnim, ballAnim, idleAnim };
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
