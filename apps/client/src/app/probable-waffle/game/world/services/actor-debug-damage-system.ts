import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getPrimarySelectedActor } from "../../data/selection-helpers";
import { getActorComponent } from "../../data/actor-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { AnimationActorComponent } from "../../entity/components/animation/animation-actor-component";
import { AnimationType } from "../../entity/components/animation/animation-type";
import { environment } from "../../../../../environments/environment";
import type { Subscription } from "rxjs";
import { DamageType } from "@fuzzy-waddle/api-interfaces";

export class ActorDebugDamageSystem {
  private externalModalOpen = false;
  private externalModalSubscription?: Subscription;
  constructor(private scene: ProbableWaffleScene) {
    if (!environment.production) {
      this.bindKeyboardListener();
      this.listenToChatModalEvents();
    }
    scene.onShutdown.subscribe(() => this.destroy());
  }

  private listenToChatModalEvents() {
    this.externalModalSubscription = this.scene.communicator.allScenes.subscribe((event) => {
      if (event.name === "external-modal-opened") {
        this.externalModalOpen = true;
      } else if (event.name === "external-modal-closed") {
        this.externalModalOpen = false;
      }
    });
  }

  private bindKeyboardListener() {
    this.scene.input.keyboard?.on("keydown", this.onKeyDown, this);
  }

  private onKeyDown(event: KeyboardEvent) {
    // Don't process keyboard events if chat modal is open
    if (this.externalModalOpen) return;

    const code = event.code;
    if (!code) return;

    switch (code) {
      case "KeyP":
        this.damageSelected();
        event.preventDefault();
        break;
      case "KeyN":
        this.playAttack();
        event.preventDefault();
        break;
    }
  }

  private damageSelected() {
    const { primaryActor } = getPrimarySelectedActor(this.scene);
    if (!primaryActor) return;

    const healthComponent = getActorComponent(primaryActor, HealthComponent);
    if (!healthComponent) return;
    if (!healthComponent.canDamageOrKillOnOwnerAction()) return;

    healthComponent.takeDamage(10, DamageType.Physical);
  }

  /**
   * Plays a large slash animation if the actor can damage or kill on keyboard action.
   * This is for testing of jumping UI health up and down
   */
  private playAttack() {
    const { primaryActor } = getPrimarySelectedActor(this.scene);
    if (!primaryActor) return;

    const healthComponent = getActorComponent(primaryActor, HealthComponent);
    if (!healthComponent) return;
    if (!healthComponent.canDamageOrKillOnOwnerAction()) return;

    const animationActorComponent = getActorComponent(primaryActor, AnimationActorComponent);
    if (!animationActorComponent) return;

    animationActorComponent.playCustomAnimation(AnimationType.LargeSlash);
  }

  private destroy() {
    this.scene.input.keyboard?.off("keydown", this.onKeyDown, this);
    this.externalModalSubscription?.unsubscribe();
  }
}
