import type GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import { getCommunicator } from "../../data/scene-data";
import { getActorComponent } from "../../data/actor-component";
import { IdComponent } from "../../entity/components/id-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { GameSessionState, ProbableWaffleGameState, type ActorDefinition } from "@fuzzy-waddle/api-interfaces";
import type { Subscription } from "rxjs";
import Phaser from "phaser";
import { getSceneService } from "./scene-component-helpers";
import { SceneActorCreator } from "./scene-actor-creator";

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
  private pendingActorDefs?: Partial<ActorDefinition>[];
  private hostBroadcastHandle?: number;

  constructor(private readonly scene: GameProbableWaffleScene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    if (scene.isHost) {
      this.startHostSeedBroadcast();
    } else {
      this.listenForHostSeed();
    }
  }

  afterInitialActorsCreated(): void {
    if (!this.pendingActorDefs?.length) {
      return;
    }
    this.patchActorIds(this.pendingActorDefs);
  }

  private listenForHostSeed(): void {
    const communicator = getCommunicator(this.scene);
    if (!communicator.gameStateChanged) return;

    this.subscription = communicator.gameStateChanged.on.subscribe((event) => {
      if (event.property !== "all") return;
      const actorDefs = event.data.gameState?.actors;
      if (!actorDefs?.length) return;

      this.pendingActorDefs = actorDefs;
      this.patchActorIds(actorDefs);

      // Replace local game state so all id-based lookups are consistent
      this.scene.baseGameData.gameInstance.gameState = new ProbableWaffleGameState(event.data.gameState as any);
    });
  }

  private startHostSeedBroadcast(): void {
    const rebroadcast = () => {
      const sessionState = this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState;
      if (
        sessionState === GameSessionState.InProgress ||
        sessionState === GameSessionState.ToScoreScreen ||
        sessionState === GameSessionState.Stopped
      ) {
        this.stopHostSeedBroadcast();
        return;
      }

      const creator = getSceneService(this.scene, SceneActorCreator);
      const actors = this.scene.baseGameData.gameInstance.gameState?.data.actors;
      if (!creator || !actors?.length) {
        return;
      }

      creator.saveAllKnownActorsToGameState();
    };

    this.scene.time.delayedCall(0, rebroadcast);
    this.hostBroadcastHandle = window.setInterval(rebroadcast, 500);
  }

  /**
   * Match Phaser game objects to actor definitions from the host by
   * (name, ownerNumber, logicalX, logicalY) and set the authoritative id.
   * Coordinates are rounded to 1 decimal to absorb floating-point noise.
   */
  private patchActorIds(actorDefs: Partial<ActorDefinition>[]): void {
    // Build lookup: key → authoritative actorId
    const lookup = new Map<string, string>();
    const remappedIds = new Map<string, string>();
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
        remappedIds.set(idComp.id, authId);
        idComp.setId(authId);
      }
    }

    if (remappedIds.size > 0) {
      this.remapPlayerSelections(remappedIds);
    }
  }

  private remapPlayerSelections(remappedIds: Map<string, string>): void {
    for (const player of this.scene.baseGameData.gameInstance.players) {
      player.playerState.data.selection = player.playerState.data.selection.map((actorId) => remappedIds.get(actorId) ?? actorId);
      const selectionGroups = player.playerController.data.selectionGroups;
      if (!selectionGroups) {
        continue;
      }
      player.playerController.data.selectionGroups = selectionGroups.map((group) => ({
        ...group,
        actorIds: group.actorIds.map((actorId) => remappedIds.get(actorId) ?? actorId)
      }));
    }
  }

  private destroy(): void {
    this.subscription?.unsubscribe();
    this.stopHostSeedBroadcast();
  }

  private stopHostSeedBroadcast(): void {
    clearInterval(this.hostBroadcastHandle);
    this.hostBroadcastHandle = undefined;
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
