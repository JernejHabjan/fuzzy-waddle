import type Phaser from "phaser";
import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { OwnerComponentData } from "@fuzzy-waddle/probable-waffle-protocol";
import type { OwnerDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/owner-definition";
import { getActorComponent } from "../../data/actor-component";
import { arePlayersAllied } from "../../data/player-relation";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { OwnerPresentation } from "./owner-presentation";
import { fenceSceneResourceHistory } from "../../data/scene-resource-observation";

/** Authoritative owner identity and public facade; visual state belongs to OwnerPresentation. */
export class OwnerComponent {
  static readonly ZIndex = 1;
  static readonly OwnerColorAppliedEvent = "owner-color-applied";
  static readonly OwnerChangedEvent = "owner-changed";
  /**
   * Not using color replace as it adds huge load on GPU
   */
  static useColorReplace = false;
  private owner?: PlayerNumber;
  private readonly presentation: OwnerPresentation;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly ownerDefinition: OwnerDefinition
  ) {
    this.presentation = new OwnerPresentation(gameObject, ownerDefinition, () => this.owner, {
      useColorReplace: OwnerComponent.useColorReplace,
      zIndex: OwnerComponent.ZIndex,
      colorAppliedEvent: OwnerComponent.OwnerColorAppliedEvent
    });
    this.presentation.attach();
  }

  get ownerColor(): Phaser.Display.Color | undefined { return this.presentation.ownerColor; }
  set ownerColor(value: Phaser.Display.Color | undefined) { this.presentation.ownerColor = value; }

  setOwner(playerNumber?: PlayerNumber) {
    const oldOwner = this.owner;
    const newOwner = playerNumber;

    // Handle tech tree unlock changes when owner changes
    if (oldOwner === newOwner) return;
    // Global loss precedes index callbacks; an exhaustive actor-to-need dependency map is unavailable.
    fenceSceneResourceHistory(this.gameObject.scene, "resource_actor_owner_change");
    const actorIndexSystem = getSceneService(this.gameObject.scene, ActorIndexSystem);
    actorIndexSystem?.updateActorOwnership(this.gameObject, oldOwner, newOwner);
    this.owner = playerNumber;
    this.presentation.tryToSetComponents();
    this.gameObject.emit(OwnerComponent.OwnerChangedEvent, oldOwner, newOwner);
  }

  setOwnerWithBlink(playerNumber: PlayerNumber) {
    const oldOwner = this.owner;
    this.setOwner(playerNumber);

    // Only blink if this was a conversion from no owner to owned
    if (oldOwner === undefined && playerNumber !== undefined) {
      this.presentation.playBlinkEffect();
    }
  }

  clearOwner() {
    this.setOwner(undefined);
    this.presentation.assignOwnerColor();
    this.presentation.setOwnerColorToActor();
  }

  getOwner(): number | undefined {
    return this.owner;
  }

  isSameTeamAsGameObject(gameObject: Phaser.GameObjects.GameObject) {
    const ownerComponent = getActorComponent(gameObject, OwnerComponent);
    if (!ownerComponent) {
      return false;
    }
    return arePlayersAllied(this.gameObject.scene, this.getOwner(), ownerComponent.getOwner());
  }

  setData(data: OwnerComponentData) {
    if (data.ownerId !== undefined) {
      this.setOwner(data.ownerId);
    }
  }

  getData(): OwnerComponentData {
    return {
      ownerId: this.owner
    } satisfies OwnerComponentData;
  }

}
