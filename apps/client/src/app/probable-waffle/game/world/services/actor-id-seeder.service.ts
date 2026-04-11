import type GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import { getCommunicator } from "../../data/scene-data";
import { getActorComponent } from "../../data/actor-component";
import { IdComponent } from "../../entity/components/id-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { getGameObjectLogicalTransform } from "../../data/game-object-helper";
import type { ActorDefinition } from "@fuzzy-waddle/api-interfaces";
import type { Subscription } from "rxjs";
import Phaser from "phaser";

/**
 * Ensures every actor on every client shares the same ActorId.
 *
 * Problem: IdComponent generates a new Guid on construction, so the same
 * logical actor has a different id on each machine. The host is the only
 * authority for initial actor ids.
 *
 * Solution:
 *  - Host: after spawnFromSpawnList, broadcasts the full game state via
 *    gameStateChanged "all". The broadcast already happens in
 *    SceneActorCreator.saveAllKnownActorsToGameState (host-only).
 *  - Non-host: receives the "all" event, finds each Phaser actor by its
 *    logical position + owner + name (deterministic across clients), and
 *    patches the IdComponent to use the host's authoritative id.
 *
 * After patching, the local gameState.data.actors is replaced with the
 * host's version so downstream systems see consistent ids.
 */
export class ActorIdSeeder {
  private subscription?: Subscription;

  constructor(private readonly scene: GameProbableWaffleScene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    if (!scene.isHost) {
      this.listenForHostSeed();
    }
  }

  private listenForHostSeed(): void {
    const communicator = getCommunicator(this.scene);
    if (!communicator.gameStateChanged) return;

    this.subscription = communicator.gameStateChanged.on.subscribe((event) => {
      if (event.property !== "all") return;
      const actorDefs = event.data.gameState?.actors;
      if (!actorDefs?.length) return;

      this.patchActorIds(actorDefs);

      // Replace local game state so all id-based lookups are consistent
      this.scene.baseGameData.gameInstance.gameState!.data = event.data.gameState as any;
    });
  }

  /**
   * Match Phaser game objects to actor definitions from the host by
   * (name, ownerNumber, logicalX, logicalY) and set the authoritative id.
   * Coordinates are rounded to 1 decimal to absorb floating-point noise.
   */
  private patchActorIds(actorDefs: Partial<ActorDefinition>[]): void {
    // Build lookup: key → authoritative actorId
    const lookup = new Map<string, string>();
    for (const def of actorDefs) {
      const id = def.id?.id;
      const name = def.name;
      const owner = def.owner?.ownerId;
      const pos = def.representable?.logicalWorldTransform;
      if (!id || !name || pos === undefined) continue;
      const key = seederKey(name, owner, pos.x, pos.y);
      lookup.set(key, id);
    }

    const children = this.scene.children.getChildren();
    for (const obj of children) {
      const idComp = getActorComponent(obj, IdComponent);
      if (!idComp) continue;

      const ownerComp = getActorComponent(obj, OwnerComponent);
      const owner = ownerComp?.getOwner();
      const pos = getGameObjectLogicalTransform(obj);
      if (!pos) continue;

      const key = seederKey(obj.name, owner, pos.x, pos.y);
      const authId = lookup.get(key);
      if (authId && idComp.id !== authId) {
        idComp.setId(authId);
      }
    }
  }

  private destroy(): void {
    this.subscription?.unsubscribe();
  }
}

function seederKey(
  name: string,
  owner: number | undefined,
  x: number,
  y: number
): string {
  return `${name}|${owner ?? ""}|${Math.round(x * 10)}|${Math.round(y * 10)}`;
}
