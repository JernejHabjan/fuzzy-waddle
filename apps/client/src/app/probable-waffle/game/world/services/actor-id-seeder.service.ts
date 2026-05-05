import type GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import { getCommunicator } from "../../data/scene-data";
import { getActorComponent } from "../../data/actor-component";
import { setFullActorDataFromName } from "../../data/actor-data";
import { IdComponent } from "../../entity/components/id-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { GameSessionState, ProbableWaffleGameState, type ActorDefinition } from "@fuzzy-waddle/api-interfaces";
import type { Subscription } from "rxjs";
import Phaser from "phaser";
import { getSceneService } from "./scene-component-helpers";
import { ActorIndexSystem } from "./ActorIndexSystem";
import { SceneActorCreator } from "./scene-actor-creator";
import { ActorIdAuthorityService } from "./actor-id-authority.service";

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
 *  - Non-host: receives the "all" event, reconciles Phaser actors by their
 *    logical position + owner + name (deterministic across clients), patches
 *    the IdComponent to use the host's authoritative id, and creates any
 *    actor that is missing locally.
 *
 * After patching, the local gameState.data.actors is replaced with the
 * host's version so downstream systems see consistent ids.
 */
export class ActorIdSeeder {
  private subscription?: Subscription;
  private pendingActorDefs?: Partial<ActorDefinition>[];
  private hostBroadcastHandle?: number;
  private initialActorsCreated = false;
  private seededAuthoritativeIds = false;
  private readonly loggedOrphanKeys = new Set<string>();
  private readonly actorIdAuthority: ActorIdAuthorityService;

  constructor(private readonly scene: GameProbableWaffleScene) {
    this.actorIdAuthority = new ActorIdAuthorityService(scene);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    if (scene.isHost) {
      this.startHostSeedBroadcast();
    } else {
      this.listenForHostSeed();
    }
  }

  afterInitialActorsCreated(): void {
    this.initialActorsCreated = true;
    if (!this.pendingActorDefs?.length || this.seededAuthoritativeIds) {
      return;
    }
    this.applyAuthoritativeSeed(this.pendingActorDefs);
  }

  private listenForHostSeed(): void {
    const communicator = getCommunicator(this.scene);
    if (!communicator.gameStateChanged) return;

    this.subscription = communicator.gameStateChanged.on.subscribe((event) => {
      if (event.property !== "all") return;
      const actorDefs = event.data.gameState?.actors;
      if (!actorDefs?.length) return;

      this.pendingActorDefs = actorDefs;
      if (!this.initialActorsCreated || this.seededAuthoritativeIds) {
        return;
      }
      this.applyAuthoritativeSeed(actorDefs);
    });
  }

  private startHostSeedBroadcast(): void {
    const rebroadcast = () => {
      const sessionState = this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState;
      if (
        sessionState === GameSessionState.StartingTheGame ||
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

  private applyAuthoritativeSeed(actorDefs: Partial<ActorDefinition>[]): void {
    this.patchActorIds(actorDefs);

    const currentGameState = this.scene.baseGameData.gameInstance.gameState?.data;
    const nextGameState = new ProbableWaffleGameState(currentGameState);
    nextGameState.data.actors = structuredClone(actorDefs) as ActorDefinition[];
    this.scene.baseGameData.gameInstance.gameState = nextGameState;

    this.seededAuthoritativeIds = true;
    this.subscription?.unsubscribe();
    this.subscription = undefined;
  }

  /**
   * Match Phaser game objects to actor definitions from the host by
   * (name, ownerNumber, logicalX, logicalY) and set the authoritative id.
   * Coordinates are rounded to 1 decimal to absorb floating-point noise.
   *
   * When multiple actors share the same (name, owner, pos) key the definitions
   * are consumed in arrival order — so both sides must iterate in the same
   * deterministic spawn order for disambiguation to work.
   */
  private patchActorIds(actorDefs: Partial<ActorDefinition>[]): void {
    // Build host lookup: key → ordered array of defs (supports duplicate keys).
    const lookup = new Map<string, Partial<ActorDefinition>[]>();
    const hostActorIds = new Set<string>();
    const remappedIds = new Map<string, string>();
    for (const def of actorDefs) {
      const id = def.id?.id;
      const name = def.name;
      const owner = def.owner?.ownerId;
      const pos = def.representable?.logicalWorldTransform;
      if (!id || !name || pos === undefined) continue;
      hostActorIds.add(id);
      const key = seederKey(name, owner, pos.x, pos.y);
      const existing = lookup.get(key) ?? [];
      if (existing.length > 0) {
        console.warn(
          `[ActorIdSeeder] Duplicate seeder key "${key}" — ${existing.length + 1} defs share same (name, owner, pos). IDs matched by arrival order.`
        );
      }
      existing.push(def);
      lookup.set(key, existing);
    }

    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    const creator = getSceneService(this.scene, SceneActorCreator);
    const unmatchedChildren = new Map<string, Phaser.GameObjects.GameObject[]>();
    const localActorsById = new Map<string, Phaser.GameObjects.GameObject>();
    const actorToSeederKey = new Map<Phaser.GameObjects.GameObject, string>();
    const children = this.scene.children.getChildren();
    for (const obj of children) {
      const ownerComp = getActorComponent(obj, OwnerComponent);
      const owner = ownerComp?.getOwner();
      const pos = getGameObjectLogicalTransform(obj);
      if (!pos) continue;

      const key = seederKey(obj.name, owner, pos.x, pos.y);
      const existing = unmatchedChildren.get(key) ?? [];
      existing.push(obj);
      unmatchedChildren.set(key, existing);
      actorToSeederKey.set(obj, key);
      const localActorId = getActorComponent(obj, IdComponent)?.id;
      if (localActorId) {
        localActorsById.set(localActorId, obj);
      }
    }

    for (const [key, defs] of lookup.entries()) {
      for (const def of defs) {
        const authId = def.id?.id;
        let localActor = authId ? localActorsById.get(authId) : undefined;
        if (!localActor) {
          localActor = unmatchedChildren.get(key)?.shift();
        } else {
          this.removeActorFromUnmatched(localActor, unmatchedChildren, actorToSeederKey);
        }
        if (localActor) {
          let idComp = getActorComponent(localActor, IdComponent);
          if (!idComp) {
            setFullActorDataFromName(localActor, def);
            actorIndex?.registerActor(localActor);
            idComp = getActorComponent(localActor, IdComponent);
          }
          if (authId && idComp && idComp.id !== authId) {
            remappedIds.set(idComp.id, authId);
            idComp.setId(authId);
          }
          continue;
        }

        if (creator && def.name) {
          const created = creator.createActorFromDefinition(def as ActorDefinition);
          const createdId = created ? getActorComponent(created, IdComponent)?.id : undefined;
          if (created) {
            actorIndex?.registerActor(created);
          }
          if (created && createdId && authId && createdId !== authId) {
            remappedIds.set(createdId, authId);
            getActorComponent(created, IdComponent)?.setId(authId);
          }
        }
      }
    }

    // Log any local actors that had no matching host definition (keeps random GUID).
    for (const [key, orphans] of unmatchedChildren.entries()) {
      for (const orphan of orphans) {
        const idComp = getActorComponent(orphan, IdComponent);
        const orphanSignature = idComp ? `${key}|${idComp.id}` : undefined;
        if (idComp && orphanSignature && !this.loggedOrphanKeys.has(orphanSignature)) {
          if (hostActorIds.has(idComp.id)) {
            continue;
          }
          const deterministicId = this.actorIdAuthority.isDeterministicActorId(idComp.id);
          this.loggedOrphanKeys.add(orphanSignature);
          if (deterministicId) {
            console.warn(
              `[ActorIdSeeder] Orphaned actor key="${key}" name="${orphan.name}" id=${idComp.id} — no host key match, but deterministic ID is preserved.`
            );
          } else {
            console.warn(
              `[ActorIdSeeder] Orphaned actor key="${key}" name="${orphan.name}" id=${idComp.id} — no host definition matched; ID may diverge.`
            );
          }
        }
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

  private removeActorFromUnmatched(
    actor: Phaser.GameObjects.GameObject,
    unmatchedChildren: Map<string, Phaser.GameObjects.GameObject[]>,
    actorToSeederKey: Map<Phaser.GameObjects.GameObject, string>
  ): void {
    const key = actorToSeederKey.get(actor);
    if (!key) {
      return;
    }
    const list = unmatchedChildren.get(key);
    if (!list?.length) {
      return;
    }
    const actorIndex = list.indexOf(actor);
    if (actorIndex === -1) {
      return;
    }
    list.splice(actorIndex, 1);
    if (list.length === 0) {
      unmatchedChildren.delete(key);
    }
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
