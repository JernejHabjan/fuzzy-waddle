import {
  PlayerStateResources,
  ProbableWaffleGameStateDataChangeEvent,
  ProbableWaffleGameStateDataChangeEventProperty,
  ProbableWaffleGameStateDataPayload,
  ProbableWafflePlayer,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWafflePlayerDataChangeEventPayload,
  ProbableWafflePlayerDataChangeEventProperty,
  Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import { Scene } from "phaser";
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";
import { getActorComponent } from "./actor-component";
import { IdComponent } from "../entity/actor/components/id-component";
import { Observable } from "rxjs";
import GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import { BaseScene } from "../../../shared/game/phaser/scene/base.scene";
import { AttackComponent } from "../entity/combat/components/attack-component";
import { ProductionComponent } from "../entity/building/production/production-component";
import { GathererComponent } from "../entity/actor/components/gatherer-component";
import { SelectableComponent } from "../entity/actor/components/selectable-component";
import { HealthComponent } from "../entity/combat/components/health-component";
import { VisionComponent } from "../entity/actor/components/vision-component";

export function getPlayer(scene: Scene, playerNumber?: number): ProbableWafflePlayer | undefined {
  if (!(scene instanceof BaseScene)) throw new Error("scene is not instanceof BaseScene");
  if (playerNumber === undefined) {
    playerNumber = scene.baseGameData.user.playerNumber!;
  }
  return scene.baseGameData.gameInstance.getPlayerByNumber(playerNumber);
}

export function getAllPlayers(scene: Scene): ProbableWafflePlayer[] {
  if (!(scene instanceof BaseScene)) throw new Error("scene is not instanceof BaseScene");
  return scene.baseGameData.gameInstance.players;
}

/**
 * Returns the current player number of the human player
 * @param scene
 * @returns {number | undefined}
 */
export function getCurrentPlayerNumber(scene: Scene): number | undefined {
  if (!(scene instanceof BaseScene)) throw new Error("scene is not instanceof BaseScene");
  return scene.player.playerNumber;
}

export function getCommunicator(scene: Scene): ProbableWaffleCommunicatorService {
  if (!(scene instanceof BaseScene)) throw new Error("scene is not instanceof BaseScene");

  return scene.baseGameData.communicator;
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
  payloadIn: ProbableWafflePlayerDataChangeEventPayload
): void {
  if (!(scene instanceof BaseScene)) throw new Error("Scene is not of type BaseScene");

  const communicator = getCommunicator(scene);
  const data = {
    playerNumber: scene.player.playerNumber!, // todo this is incorrect, as AI player will not be able to get resources
    ...payloadIn
  } satisfies ProbableWafflePlayerDataChangeEventPayload;

  communicator.playerChanged?.send({
    property,
    data,
    gameInstanceId: scene.gameInstanceId,
    emitterUserId: scene.userId
  });
}

export function emitEventSelection(
  scene: Phaser.Scene,
  property: "selection.set" | "selection.added" | "selection.removed" | "selection.cleared",
  actorIds?: string[]
) {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleScene");
  const player = getPlayer(scene);
  scene.communicator.playerChanged!.send({
    property,
    data: {
      playerNumber: player?.playerNumber,
      playerStateData: {
        selection: actorIds
      }
    },
    gameInstanceId: scene.gameInstanceId,
    emitterUserId: scene.userId
  });
}

export function listenToResourceChanged(scene: Scene) {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleScene");
  const player = getPlayer(scene);
  return scene.communicator.playerChanged?.onWithFilter(
    (p) => p.data.playerNumber === player?.playerNumber && p.property.startsWith("resource.")
  );
}

export function emitResource(
  scene: Scene,
  action: "resource.added" | "resource.removed",
  resources: Partial<PlayerStateResources>
) {
  sendPlayerStateEvent(scene, action, {
    playerStateData: {
      resources: resources as PlayerStateResources
    }
  });
}

export function listenToSelectionEvents(scene: Scene): Observable<ProbableWafflePlayerDataChangeEvent> | undefined {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleScene");
  const player = getPlayer(scene);
  return scene.communicator.playerChanged?.onWithFilter(
    (p) => p.data.playerNumber === player?.playerNumber && p.property.startsWith("selection.")
  );
}

export function emitEventIssueMoveCommandToSelectedActors(
  scene: Phaser.Scene,
  tileVec3: Vector3Simple,
  worldVec3: Vector3Simple,
  selectedActorObjectIds: string[]
) {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleScene");
  scene.communicator.playerChanged!.send({
    property: "command.issued.move",
    data: {
      playerNumber: getPlayer(scene)?.playerNumber,
      data: {
        tileVec3,
        worldVec3,
        selectedActorObjectIds
      }
    },
    gameInstanceId: scene.gameInstanceId,
    emitterUserId: scene.userId
  });
}

export function emitEventIssueActorCommandToSelectedActors(scene: Phaser.Scene, objectIds: string[]) {
  if (!(scene instanceof ProbableWaffleScene)) throw new Error("Scene is not of type ProbableWaffleScene");
  scene.communicator.playerChanged!.send({
    property: "command.issued.actor",
    data: {
      playerNumber: getPlayer(scene)?.playerNumber,
      data: {
        objectIds
      }
    },
    gameInstanceId: scene.gameInstanceId,
    emitterUserId: scene.userId
  });
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
    (actor) => !!getActorComponent(actor, SelectableComponent) && !!getActorComponent(actor, IdComponent)
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
