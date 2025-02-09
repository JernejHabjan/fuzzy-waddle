// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import {
  getGameObjectDirection,
  moveGameObjectToRandomTileInNavigableRadius,
  MovementSystem,
  PathMoveConfig
} from "../../entity/systems/movement.system";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getGameObjectCurrentTile, onObjectReady } from "../../data/game-object-helper";
import { ANIM_SHEEP_IDLE_DOWN, ANIM_SHEEP_IDLE_LEFT, ANIM_SHEEP_IDLE_RIGHT, ANIM_SHEEP_IDLE_UP } from "./anims/animals";
import { getActorSystem } from "../../data/actor-system";
import { ObjectNames } from "../../data/object-names";
/* END-USER-IMPORTS */

export default class Sheep extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 49.42203448546586, texture || "animals", frame ?? "sheep/sheep_down.png");

    this.setInteractive(new Phaser.Geom.Circle(29, 39, 17.805288050449516), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.772219288835404);
    this.play("sheep_idle_down");

    /* START-USER-CTR-CODE */
    onObjectReady(this, this.postSceneCreate, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Sheep;
  private postSceneCreate() {
    this.handleWoolParticles(this.scene);
    this.startMovement();
  }
  private nextTile?: Vector2Simple;
  private readonly actionDelay = 5000;
  private readonly radius = 5;
  private currentDelay: Phaser.Time.TimerEvent | null = null;
  private woolParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private sheared = false;
  private handleWoolParticles(scene: Phaser.Scene) {
    // Add wool particle emitter to the scene
    this.woolParticles = scene.add.particles(0, 0, "animals", {
      frame: ["sheep/effects/wool_1.png", "sheep/effects/wool_2.png"],
      speed: { min: 20, max: 50 },
      lifespan: 1000,
      quantity: 1,
      gravityY: 50,
      scale: { start: 2, end: 1 },
      rotate: { start: 0, end: 360 },
      frequency: 1,
      emitting: false
    });

    let shearedCount = 0;
    const maxShearedCount = 5;

    this.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      this.cancelMovement();
      if (shearedCount < maxShearedCount) {
        this.woolParticles?.emitParticleAt(this.x, this.y - 25, Phaser.Math.Between(1, 4));
      }
      shearedCount++;
      if (shearedCount === maxShearedCount) {
        this.woolParticles?.emitParticleAt(this.x, this.y - 20, 50);
        this.sheared = true;
        this.playSheepAnimation();
        // start timer to reset sheep
        scene.time.delayedCall(5000, () => {
          shearedCount = 0;
          this.woolParticles?.emitParticleAt(this.x, this.y - 20, 50);
          this.sheared = false;
          this.playSheepAnimation();
          this.moveSheepAfterDelay();
        });
      } else {
        this.moveSheepAfterDelay();
      }
    });
  }
  private async startMovement() {
    if (!this.active) return;
    this.nextTile = undefined;
    try {
      await moveGameObjectToRandomTileInNavigableRadius(this, this.radius, {
        onPathUpdate: (newTileXY) => {
          this.nextTile = newTileXY;
          this.playAnimation("walk", newTileXY);
        }
      } satisfies PathMoveConfig);
    } catch (e) {
      console.error(e);
    }
    this.nextTile = undefined;
    this.moveSheepAfterDelay();
  }

  private moveSheepAfterDelay() {
    this.removeDelay();
    if (!this.active) return;
    this.currentDelay = this.scene.time.delayedCall(this.actionDelay, this.startMovement, [], this);
  }

  private playAnimation(animType: "walk" | "idle", tile?: Vector2Simple) {
    if (!this.active) return;
    this.removeDelay();
    this.cancelMovement();

    const currentTile = tile ?? getGameObjectCurrentTile(this);
    if (!currentTile) return;
    const anim = this.getAnim(currentTile);
    if (!anim) return;

    const { walkAnim, idleAnim } = anim;
    const animToPlay = animType === "walk" ? walkAnim : idleAnim;
    this.play(animToPlay);
  }

  private getAnim(newTile: Vector2Simple): { walkAnim: string; idleAnim: string } | undefined {
    const direction = getGameObjectDirection(this, newTile);

    let walkAnim: string;
    let idleAnim: string;

    switch (direction) {
      case "north":
        walkAnim = ANIM_SHEEP_IDLE_UP; // todo ANIM_SHEEP_WALK_TOP;
        idleAnim = ANIM_SHEEP_IDLE_UP;
        break;
      case "south":
        walkAnim = ANIM_SHEEP_IDLE_DOWN; // todo ANIM_SHEEP_WALK_DOWN;
        idleAnim = ANIM_SHEEP_IDLE_DOWN;
        break;
      case "east":
      case "northeast":
      case "southeast":
        walkAnim = ANIM_SHEEP_IDLE_RIGHT; // todo ANIM_SHEEP_WALK_RIGHT;
        idleAnim = ANIM_SHEEP_IDLE_RIGHT;
        break;

      case "west":
      case "northwest":
      case "southwest":
        walkAnim = ANIM_SHEEP_IDLE_LEFT; // todo ANIM_SHEEP_WALK_LEFT;
        idleAnim = ANIM_SHEEP_IDLE_LEFT;
        break;
      default:
        return;
    }
    return { walkAnim, idleAnim };
  }

  private playSheepAnimation() {
    const direction = getGameObjectDirection(this, this.nextTile ?? getGameObjectCurrentTile(this)!);

    let dirMapped: "up" | "right" | "down" | "left" = "down";
    switch (direction) {
      case "north":
        dirMapped = "up";
        break;
      case "south":
        dirMapped = "down";
        break;
      case "east":
      case "northeast":
      case "southeast":
        dirMapped = "right";
        break;
      case "west":
      case "northwest":
      case "southwest":
        dirMapped = "left";
        break;
      default:
        return;
    }

    const anim = "sheep_idle_" + dirMapped + (this.sheared ? "_sheared" : "");
    this.play(anim, true);
  }

  setDepth(value: number): this {
    this.woolParticles?.setDepth(value + 1);
    return super.setDepth(value);
  }

  private cancelMovement = () => {
    const movementSystem = getActorSystem<MovementSystem>(this, MovementSystem);
    if (movementSystem) movementSystem.cancelMovement();
  };

  private removeDelay() {
    this.currentDelay?.remove(false);
    this.currentDelay = null;
  }
  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.currentDelay?.remove(false);
  }

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
