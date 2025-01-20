// You can write more code here

/* START OF COMPILED CODE */

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
import { setActorDataFromName } from "../../data/actor-data";
import {
  getGameObjectDirection,
  moveGameObjectToRandomTileInNavigableRadius,
  MovementSystem,
  PathMoveConfig
} from "../../entity/systems/movement.system";
import { getActorSystem } from "../../data/actor-system";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getGameObjectCurrentTile, onPostSceneInitialized } from "../../data/game-object-helper";
import { ObjectNames } from "../../data/object-names";
/* END-USER-IMPORTS */

export default class Hedgehog extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 21.596080279718947, texture || "animals", frame ?? "hedgehog/10.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 18, 11.323425464509395), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6748775087412171);

    /* START-USER-CTR-CODE */
    setActorDataFromName(this);

    onPostSceneInitialized(scene, this.postSceneCreate, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Hedgehog;
  private readonly actionDelay = 5000;
  private readonly radius = 5;
  private currentDelay: Phaser.Time.TimerEvent | null = null;

  private postSceneCreate() {
    this.moveHedgehog();
    this.handleClick();
  }

  private handleClick() {
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      this.playAnimation("ball");
      this.moveHedgehogAfterDelay();
    });
  }

  async moveHedgehog() {
    // Randomly decide if the hedgehog should pause and play an idle animation
    if (Phaser.Math.Between(0, 10) < 3) {
      this.playAnimation("idle");
    } else {
      await this.startMovement();
      this.playAnimation("ball");
    }
    this.moveHedgehogAfterDelay();
  }

  private playAnimation(animType: "walk" | "ball" | "idle", tile?: Vector2Simple) {
    if (!this.active) return;
    this.removeDelay();
    this.cancelMovement();

    const currentTile = tile ?? getGameObjectCurrentTile(this);
    if (!currentTile) return;
    const anim = this.getAnim(currentTile);
    if (!anim) return;

    const { walkAnim, ballAnim, idleAnim } = anim;
    const animToPlay = animType === "walk" ? walkAnim : animType === "ball" ? ballAnim : idleAnim;
    this.play(animToPlay);
  }

  private async startMovement() {
    if (!this.active) return;

    try {
      await moveGameObjectToRandomTileInNavigableRadius(this, this.radius, {
        onPathUpdate: (newTileXY) => {
          this.playAnimation("walk", newTileXY);
        }
      } satisfies PathMoveConfig);
    } catch (e) {
      console.error(e);
    }
  }

  private moveHedgehogAfterDelay() {
    this.removeDelay();
    if (!this.active) return;
    this.currentDelay = this.scene.time.delayedCall(this.actionDelay, this.moveHedgehog, [], this);
  }

  private removeDelay() {
    this.currentDelay?.remove(false);
    this.currentDelay = null;
  }

  private cancelMovement = () => {
    const movementSystem = getActorSystem<MovementSystem>(this, MovementSystem);
    if (movementSystem) movementSystem.cancelMovement();
  };

  private getAnim(newTile: Vector2Simple): { walkAnim: string; ballAnim: string; idleAnim: string } | undefined {
    const direction = getGameObjectDirection(this, newTile);

    let walkAnim: string;
    let ballAnim: string;
    let idleAnim: string;

    switch (direction) {
      case "north":
        walkAnim = ANIM_HEDGEHOG_WALK_TOP;
        ballAnim = ANIM_HEDGEHOG_BALL_TOP;
        idleAnim = ANIM_HEDGEHOG_IDLE_TOP;
        break;
      case "south":
        walkAnim = ANIM_HEDGEHOG_WALK_DOWN;
        ballAnim = ANIM_HEDGEHOG_BALL_DOWN;
        idleAnim = ANIM_HEDGEHOG_IDLE_DOWN;
        break;
      case "east":
      case "northeast":
      case "southeast":
        walkAnim = ANIM_HEDGEHOG_WALK_RIGHT;
        ballAnim = ANIM_HEDGEHOG_BALL_RIGHT;
        idleAnim = ANIM_HEDGEHOG_IDLE_RIGHT;
        break;

      case "west":
      case "northwest":
      case "southwest":
        walkAnim = ANIM_HEDGEHOG_WALK_LEFT;
        ballAnim = ANIM_HEDGEHOG_BALL_LEFT;
        idleAnim = ANIM_HEDGEHOG_IDLE_LEFT;
        break;
      default:
        return;
    }
    return { walkAnim, ballAnim, idleAnim };
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.removeDelay();
    this.cancelMovement();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
