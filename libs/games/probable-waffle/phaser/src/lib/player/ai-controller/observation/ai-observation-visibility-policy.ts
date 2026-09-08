import type Phaser from "phaser";
import type { PlayerNumber, Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { getActorComponent } from "../../../data/actor-component";
import { getPlayerRelation, type PlayerRelation } from "../../../data/player-relation";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { VisionComponent } from "../../../entity/components/vision-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";

type GameObject = Phaser.GameObjects.GameObject;

/**
 * The information policy used by one host-owned AI. Normal skirmish is always
 * player-scoped; campaign policies are explicit so a scripted exception cannot
 * silently become a multiplayer visibility bypass.
 */
export type AiObservationInformationPolicy = "skirmish" | "campaign_revealed" | "campaign_omniscient";

type ScenePlayerDefinition = {
  campaignFogPolicy?: "normal" | "revealed" | "omniscient-ai";
};

type ScenePlayer = {
  playerNumber?: PlayerNumber;
  playerController: { data: { playerDefinition?: ScenePlayerDefinition } };
};

type SceneWithPlayers = Phaser.Scene & {
  baseGameData?: { gameInstance?: { players?: ScenePlayer[] } };
};

/** Resolves and applies the one permitted-knowledge policy for Stage 4 projections. */
export class AiObservationVisibilityPolicy {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly playerNumber: PlayerNumber
  ) {}

  get informationPolicy(): AiObservationInformationPolicy {
    const player = (this.scene as SceneWithPlayers).baseGameData?.gameInstance?.players?.find(
      (candidate) => candidate.playerNumber === this.playerNumber
    );
    switch (player?.playerController.data.playerDefinition?.campaignFogPolicy) {
      case "omniscient-ai":
        return "campaign_omniscient";
      case "revealed":
        return "campaign_revealed";
      default:
        return "skirmish";
    }
  }

  relationTo(actor: GameObject): PlayerRelation {
    return getPlayerRelation(this.scene, this.playerNumber, getActorComponent(actor, OwnerComponent)?.getOwner());
  }

  /**
   * Own actors are always observable. Scripted reveal/omniscience is intentional;
   * normal skirmish otherwise requires the same owned vision sources as a human.
   */
  mayObserve(actor: GameObject): boolean {
    const owner = getActorComponent(actor, OwnerComponent)?.getOwner();
    if (owner === this.playerNumber) return true;
    if (this.informationPolicy !== "skirmish") return true;

    const index = getSceneService(this.scene, ActorIndexSystem);
    if (!index) return false;
    return index.getOwnedActors(this.playerNumber).some((source) => {
      const vision = getActorComponent(source, VisionComponent);
      return vision?.isActorVisible(actor) ?? false;
    });
  }

  /** Applies the same owned vision ranges to a map effect that has no actor handle. */
  mayObserveTile(tile: Vector2Simple): boolean {
    if (this.informationPolicy !== "skirmish") return true;
    const index = getSceneService(this.scene, ActorIndexSystem);
    if (!index) return false;
    return index.getOwnedActors(this.playerNumber).some((source) => {
      const sourceTile = getGameObjectCurrentTile(source);
      const vision = getActorComponent(source, VisionComponent);
      if (!sourceTile || !vision) return false;
      return Math.floor(Math.hypot(sourceTile.x - tile.x, sourceTile.y - tile.y)) <= vision.range;
    });
  }
}
