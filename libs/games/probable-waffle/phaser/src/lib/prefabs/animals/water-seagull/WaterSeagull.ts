import Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { DepthHelper } from "../../../world/services/depth.helper";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ANIM_BIRD_FLY, ANIM_BIRD_FLY_OFF, ANIM_BIRD_IDLE } from "../tree-bird/anims-bird";
import {
  getWaterSeagullFlightDirection,
  isSharkWithinWaterSeagullReactionRadius,
  WATER_SEAGULL_FLIGHT_DISTANCE_PX,
  WATER_SEAGULL_FLIGHT_LIFT_PX,
  WATER_SEAGULL_FLIGHT_TIMEOUT_MS,
  WATER_SEAGULL_REACTION_POLL_MS
} from "./water-seagull.behavior";

/** Local presentation lifecycle; terminal birds never return to the water. */
enum WaterSeagullState {
  Idle,
  TakingOff,
  Flying,
  Destroyed
}

/**
 * A client-local water ambience prefab. It reads the synchronized shark positions from {@link ActorIndexSystem},
 * but never receives an actor ID or writes commands, snapshots, saves, selection, collision, or gameplay state.
 */
/* START OF COMPILED CODE */

export default class WaterSeagull extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 112, texture ?? "animals", frame ?? "1.png");

    this.setOrigin(0.5, 1);
    this.play(ANIM_BIRD_IDLE);
    /* START-USER-CTR-CODE */
    DepthHelper.setActorDepth(this);
    this.startSharkPolling();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private lifecycleState = WaterSeagullState.Idle;
  private reactionTimer?: Phaser.Time.TimerEvent;
  private flightTween?: Phaser.Tweens.Tween;
  private flightTimeout?: Phaser.Time.TimerEvent;

  /** Completes the guarded takeoff animation transition exactly once. */
  private readonly onTakeoffComplete = (): void => this.startFlying();

  /** Polls only in idle state, and safely does nothing in Phaser Editor previews without game scene services. */
  private startSharkPolling(): void {
    this.reactionTimer = this.scene.time.addEvent({
      delay: WATER_SEAGULL_REACTION_POLL_MS,
      loop: true,
      callback: () => {
        const shark = this.findNearbyShark();
        if (shark) this.takeOffFrom(shark);
      }
    });
  }

  /** Returns the first active typed shark within the approved local reaction radius. */
  private findNearbyShark(): Phaser.GameObjects.Sprite | undefined {
    if (this.lifecycleState !== WaterSeagullState.Idle || !(this.scene instanceof ProbableWaffleScene))
      return undefined;

    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    return actorIndex
      ?.getAllIdActors()
      .find(
        (actor): actor is Phaser.GameObjects.Sprite =>
          actor.active &&
          actor.name === ObjectNames.Shark &&
          actor instanceof Phaser.GameObjects.Sprite &&
          isSharkWithinWaterSeagullReactionRadius(this, actor)
      );
  }

  /** Stops idle work and begins the one-shot escape away from the shark that first entered range. */
  private takeOffFrom(shark: Phaser.GameObjects.Sprite): void {
    if (this.lifecycleState !== WaterSeagullState.Idle) return;

    this.lifecycleState = WaterSeagullState.TakingOff;
    this.reactionTimer?.remove(false);
    this.reactionTimer = undefined;
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ANIM_BIRD_FLY_OFF, this.onTakeoffComplete);
    this.play(ANIM_BIRD_FLY_OFF);
    this.flightTimeout = this.scene.time.delayedCall(WATER_SEAGULL_FLIGHT_TIMEOUT_MS, () => this.destroy());
    this.setFlipX(getWaterSeagullFlightDirection(this.x, shark.x) < 0);
  }

  /** Flies until leaving the padded camera view; the takeoff timeout also bounds stalled animations. */
  private startFlying(): void {
    if (this.lifecycleState !== WaterSeagullState.TakingOff || !this.active) return;

    this.lifecycleState = WaterSeagullState.Flying;
    this.play(ANIM_BIRD_FLY);
    const direction = this.flipX ? -1 : 1;
    this.flightTween = this.scene.tweens.add({
      targets: this,
      x: this.x + direction * WATER_SEAGULL_FLIGHT_DISTANCE_PX,
      y: this.y - WATER_SEAGULL_FLIGHT_LIFT_PX,
      duration: WATER_SEAGULL_FLIGHT_TIMEOUT_MS,
      ease: "Power1",
      onUpdate: () => {
        DepthHelper.setActorDepth(this);
        const bounds = this.scene.cameras.main.worldView;
        const padding = 64;
        if (
          this.x < bounds.left - padding ||
          this.x > bounds.right + padding ||
          this.y < bounds.top - padding ||
          this.y > bounds.bottom + padding
        ) {
          this.destroy();
        }
      },
      onComplete: () => this.destroy()
    });
  }

  /** Releases all local presentation resources; no world or multiplayer cleanup is needed for this ambient prefab. */
  override destroy(fromScene?: boolean): void {
    if (this.lifecycleState === WaterSeagullState.Destroyed) return;

    this.lifecycleState = WaterSeagullState.Destroyed;
    this.off(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ANIM_BIRD_FLY_OFF, this.onTakeoffComplete);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.reactionTimer?.remove(false);
    this.flightTimeout?.remove(false);
    this.flightTween?.stop();
    super.destroy(fromScene);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */
