import {
  type PlayerNumber,
  type PlayerStateHousing,
  type PlayerStateResources,
  type ProbableWaffleGameStateDataChangeEvent,
  type ProbableWaffleGameStateDataChangeEventProperty,
  type ProbableWaffleGameStateDataPayload,
  ProbableWafflePlayer,
  type ProbableWafflePlayerDataChangeEvent,
  type ProbableWafflePlayerDataChangeEventPayload,
  type ProbableWafflePlayerDataChangeEventProperty
} from "@fuzzy-waddle/api-interfaces";
import { Scene } from "phaser";
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";
import { getActorComponent, hasActorComponent } from "./actor-component";
import { IdComponent } from "../entity/components/id-component";
import { Observable } from "rxjs";
import GameProbableWaffleScene from "../world/scenes/GameProbableWaffleScene";
import { BaseScene } from "../../../shared/game/phaser/scene/base.scene";
import { AttackComponent } from "../entity/components/combat/components/attack-component";
import { ProductionComponent } from "../entity/components/production/production-component";
import { GathererComponent } from "../entity/components/resource/gatherer-component";
import { SelectableComponent } from "../entity/components/selectable-component";
import { HealthComponent } from "../entity/components/combat/components/health-component";
import { VisionComponent } from "../entity/components/vision-component";
import { ActorIndexSystem } from "../world/services/ActorIndexSystem";
import { OwnerComponent } from "../entity/components/owner-component";
import { getSceneService } from "../world/services/scene-component-helpers";

export enum ProbableWaffleSceneDataKey {
  SnapshotApplyInProgress = "snapshotApplyInProgress",
  SnapshotApplySuppressedUntilTick = "snapshotApplySuppressedUntilTick"
}

export function isSnapshotApplyInProgress(scene: Scene): boolean {
  return scene.data.get(ProbableWaffleSceneDataKey.SnapshotApplyInProgress) === true;
}

export function setSnapshotApplyInProgress(scene: Scene, inProgress: boolean): void {
  scene.data.set(ProbableWaffleSceneDataKey.SnapshotApplyInProgress, inProgress);
}

export function getSnapshotApplySuppressedUntilTick(scene: Scene): number | undefined {
  const value = scene.data.get(ProbableWaffleSceneDataKey.SnapshotApplySuppressedUntilTick);
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function setSnapshotApplySuppressedUntilTick(scene: Scene, tick: number): void {
  scene.data.set(ProbableWaffleSceneDataKey.SnapshotApplySuppressedUntilTick, tick);
}

export function getPlayer(scene: Scene, playerNumber?: PlayerNumber): ProbableWafflePlayer | undefined {
  if (!scene) {
    console.error("Scene is undefined");
    return undefined;
  }
  if (!(scene instanceof BaseScene)) throw new Error("scene is not instanceof BaseScene");
  if (playerNumber === undefined) {
    playerNumber = scene.baseGameData.user.playerNumber!;
  }
  return scene.baseGameData.gameInstance.getPlayerByNumber(playerNumber);
}

export function getAllPlayers(scene: Scene): ProbableWafflePlayer[] {
  if (!scene) {
    console.error("Scene is undefined");
    return [];
  }
  if (!(scene instanceof BaseScene)) throw new Error("scene is not instanceof BaseScene");
  return scene.baseGameData.gameInstance.players;
}

/**
 * Returns the current player number of the human player
 * @param scene
 * @returns {number | undefined}
 */
export function getCurrentPlayerNumber(scene: Scene): number | undefined {
  if (!scene) {
    console.error("Scene is undefined");
    return undefined;
  }
  if (!(scene instanceof BaseScene)) throw new Error("scene is not instanceof BaseScene");
  return scene.player.playerNumber;
}

export function getCommunicator(scene: Scene): ProbableWaffleCommunicatorService {
  if (!scene) {
    console.error("Scene is undefined");
  }
  if (!(scene instanceof BaseScene)) throw new Error("scene is not instanceof BaseScene");

  return scene.baseGameData.communicator;
}

export function hasMultiplayerCommandRelay(scene: Scene): boolean {
  return !!getCommunicator(scene).gameCommandChanged;
}

export function isRealtimeMultiplayerMatch(scene: Scene): boolean {
  if (!(scene instanceof BaseScene)) {
    return false;
  }

  return hasMultiplayerCommandRelay(scene) && !scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay();
}

export function listenToActorEvents(
  gameObject: Phaser.GameObjects.GameObject,
  property: ProbableWaffleGameStateDataChangeEventProperty | null = null
): Observable<ProbableWaffleGameStateDataChangeEvent> | undefined {
  const actorId = getActorComponent(gameObject, IdComponent)?.id;
  if (!actorId) throw new Error("actorId is not defined");

  return getCommunicator(gameObject.scene).gameStateChanged?.onWithFilter(
    (p) => p.data.actorDefinition?.id === actorId && (property ? p.property.includes(property) : true)
  );
}

export function sendActorEvent(
  gameObject: Phaser.GameObjects.GameObject,
  property: ProbableWaffleGameStateDataChangeEventProperty,
  payloadIn: ProbableWaffleGameStateDataPayload
): void {
  const id = getActorComponent(gameObject, IdComponent)?.id;
  if (!id) return; // throw new Error("actorId is not defined");
  if (!(gameObject.scene instanceof GameProbableWaffleScene))
    throw new Error("Scene is not of type GameProbableWaffleSceneData");

  const communicator = getCommunicator(gameObject.scene);
  const data: ProbableWaffleGameStateDataPayload = {
    actorDefinition: {
      id,
      ...payloadIn.actorDefinition
    },
    gameState: payloadIn.gameState
  };

  communicator.gameStateChanged?.send({
    property,
    data,
    gameInstanceId: gameObject.scene.gameInstanceId,
    emitterUserId: gameObject.scene.userId
  });
}

export function sendPlayerStateEvent(
  scene: Scene,
  property: ProbableWafflePlayerDataChangeEventProperty,
  payloadIn: ProbableWafflePlayerDataChangeEventPayload,
  playerNumber?: PlayerNumber,
  options?: {
    /**
     * When true in multiplayer, emit only locally and do not send to server.
     * This is used for UI/local mirror state that should not enter lockstep relay.
     */
    localOnlyInMultiplayer?: boolean;
    /**
     * When true, suppresses this player-state event while a reconnect/desync snapshot
     * is being applied, so transient actor recreation side-effects cannot perturb
     * the restored authoritative state.
     */
    suppressDuringSnapshotRestore?: boolean;
  }
): void {
  if (!(scene instanceof BaseScene)) throw new Error("Scene is not of type BaseScene");
  if (options?.suppressDuringSnapshotRestore && isSnapshotApplyInProgress(scene)) {
    return;
  }

  const communicator = getCommunicator(scene);
  const data = {
    playerNumber: playerNumber ?? scene.player.playerNumber!,
    ...payloadIn
  } satisfies ProbableWafflePlayerDataChangeEventPayload;

  const event = {
    property,
    data,
    gameInstanceId: scene.gameInstanceId,
    emitterUserId: scene.userId
  };

  if (hasMultiplayerCommandRelay(scene) && options?.localOnlyInMultiplayer) {
    communicator.playerChanged?.sendLocally(event);
    return;
  }

  communicator.playerChanged?.send(event);
}

export function emitEventSelection(
  scene: Phaser.Scene,
  property: "selection.set" | "selection.added" | "selection.removed" | "selection.cleared",
  actorIds?: string[]
) {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleScene");
  const player = getPlayer(scene);
  if (player?.playerNumber === undefined) {
    console.warn(`[Selection] Skipping ${property} because the local player is not ready yet.`);
    return;
  }
  const sanitizedActorIds = sanitizeOwnedActorIds(scene, actorIds, player.playerNumber);
  if (property !== "selection.cleared" && actorIds && sanitizedActorIds.length !== actorIds.length) {
    console.warn(
      `[Selection] Sanitized ${actorIds.length - sanitizedActorIds.length} stale actor IDs before sending ${property}.`
    );
  }
  scene.communicator.playerChanged!.send({
    property,
    data: {
      playerNumber: player.playerNumber,
      playerStateData: {
        selection: property === "selection.cleared" ? actorIds : sanitizedActorIds
      }
    },
    gameInstanceId: scene.gameInstanceId,
    emitterUserId: scene.userId
  });
}

export function sanitizeOwnedActorIds(
  scene: Phaser.Scene,
  actorIds: string[] | undefined,
  playerNumber: PlayerNumber | undefined
): string[] {
  if (!actorIds?.length || playerNumber === undefined) {
    return actorIds ?? [];
  }

  const actorIndex = getSceneService(scene, ActorIndexSystem);
  if (!actorIndex) {
    return actorIds;
  }

  const sanitized: string[] = [];
  const seen = new Set<string>();
  for (const actorId of actorIds) {
    if (!actorId || seen.has(actorId)) {
      continue;
    }
    const actor = actorIndex.getActorById(actorId);
    const owner = actor ? getActorComponent(actor, OwnerComponent)?.getOwner() : undefined;
    if (actor?.active && owner === playerNumber) {
      sanitized.push(actorId);
      seen.add(actorId);
    }
  }
  return sanitized;
}

export function listenToPlayerChangedChanged(scene: Scene, searchString: string) {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleScene");
  const player = getPlayer(scene);
  return scene.communicator.playerChanged?.onWithFilter(
    (p) => p.data.playerNumber === player?.playerNumber && p.property.startsWith(searchString)
  );
}

export function emitResource(
  scene: Scene,
  action: "resource.added" | "resource.removed",
  resources: Partial<PlayerStateResources>,
  playerNumber?: PlayerNumber
) {
  sendPlayerStateEvent(
    scene,
    action,
    {
      playerStateData: {
        resources: resources as PlayerStateResources
      }
    },
    playerNumber,
    {
      localOnlyInMultiplayer: true,
      suppressDuringSnapshotRestore: true
    }
  );
}

export function emitHousing(
  scene: Scene,
  action: "housing.added" | "housing.removed" | "housing.current.increased" | "housing.current.decreased",
  housing: Partial<PlayerStateHousing>,
  playerNumber?: PlayerNumber
) {
  sendPlayerStateEvent(
    scene,
    action,
    {
      playerStateData: {
        housing: housing as PlayerStateHousing
      }
    },
    playerNumber,
    {
      localOnlyInMultiplayer: true,
      suppressDuringSnapshotRestore: true
    }
  );
}

export function listenToSelectionEvents(scene: Scene): Observable<ProbableWafflePlayerDataChangeEvent> | undefined {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleScene");
  const player = getPlayer(scene);
  return scene.communicator.playerChanged?.onWithFilter(
    (p) => p.data.playerNumber === player?.playerNumber && p.property.startsWith("selection.")
  );
}

export function getSelectedActors(scene: Phaser.Scene): Phaser.GameObjects.GameObject[] {
  if (!(scene instanceof GameProbableWaffleScene)) throw new Error("Scene is not of type GameProbableWaffleScene");
  const selectionGuids = getPlayer(scene)?.getSelection();
  if (!selectionGuids) return [];
  return scene.children.getChildren().filter((child) => {
    const idComponent = getActorComponent(child, IdComponent);
    if (!idComponent || !idComponent.id) return false;
    if (!selectionGuids.includes(idComponent.id)) return false;
    const healthComponent = getActorComponent(child, HealthComponent);
    if (healthComponent && healthComponent.killed) return false;
    const visionComponent = getActorComponent(child, VisionComponent);
    // noinspection RedundantIfStatementJS
    if (visionComponent && !visionComponent.visibilityByCurrentPlayer) return false;

    return true;
  });
}

export function getSelectableSceneChildren(scene: Phaser.Scene): Phaser.GameObjects.GameObject[] {
  return scene.children.list.filter(
    (actor) => hasActorComponent(actor, SelectableComponent) && hasActorComponent(actor, IdComponent)
  );
}

/**
 * Priority list:
 * - Attack
 * - Production
 * - Gatherer
 */
export function sortActorsByPriority(actors: Phaser.GameObjects.GameObject[]): Phaser.GameObjects.GameObject[] {
  return actors.sort((a, b) => {
    const attackComponent = getActorComponent(a, AttackComponent);
    if (attackComponent) return -1;
    const productionComponent = getActorComponent(a, ProductionComponent);
    if (productionComponent) return -1;
    const gathererComponent = getActorComponent(a, GathererComponent);
    if (gathererComponent) return -1;
    return 1;
  });
}

export function getPlayers(scene: Scene): ProbableWafflePlayer[] {
  if (!(scene instanceof BaseScene)) throw new Error("Scene is not of type BaseScene");
  return scene.baseGameData.gameInstance.players;
}
