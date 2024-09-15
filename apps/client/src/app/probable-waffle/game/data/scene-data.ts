import {
  ProbableWaffleGameStateDataChangeEvent,
  ProbableWaffleGameStateDataChangeEventProperty,
  ProbableWaffleGameStateDataPayload,
  ProbableWafflePlayer,
  ProbableWafflePlayerDataChangeEventPayload,
  ProbableWafflePlayerDataChangeEventProperty
} from "@fuzzy-waddle/api-interfaces";
import { Scene } from "phaser";
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";
import { getActorComponent } from "./actor-component";
import { IdComponent } from "../entity/actor/components/id-component";
import { Observable } from "rxjs";
import GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import { BaseScene } from "../../../shared/game/phaser/scene/base.scene";

export function getPlayer(scene: Scene, playerNumber?: number): ProbableWafflePlayer | undefined {
  if (!(scene instanceof BaseScene)) throw new Error("scene is not instanceof BaseScene");
  if (playerNumber === undefined) {
    playerNumber = scene.baseGameData.user.playerNumber!;
  }
  return scene.baseGameData.gameInstance.getPlayerByNumber(playerNumber);
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
  if (!id) throw new Error("actorId is not defined");
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
    playerNumber: scene.player.playerNumber!,
    ...payloadIn
  } satisfies ProbableWafflePlayerDataChangeEventPayload;

  communicator.playerChanged?.send({
    property,
    data,
    gameInstanceId: scene.gameInstanceId,
    emitterUserId: scene.userId
  });
}
