import {
  ObjectNames,
  type PlayerNumber,
  ProbableWaffleGameCommandTypes,
  type ResearchType
} from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../actor-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { IdComponent } from "../../entity/components/id-component";
import { findProductionBuildingGameObjectWithLeastRemainingTime } from "../../entity/components/production/production-helpers";

function getCommandBus(scene: Phaser.Scene): CommandBusService | null {
  return getSceneService(scene, CommandBusService) ?? null;
}

export function dispatchProductionCommand(
  scene: Phaser.Scene,
  actors: Phaser.GameObjects.GameObject[],
  playerNumber: PlayerNumber,
  actorName: ObjectNames
): boolean {
  const targetBuilding = findProductionBuildingGameObjectWithLeastRemainingTime(actors);
  const actorId = targetBuilding ? getActorComponent(targetBuilding, IdComponent)?.id : undefined;
  const commandBus = getCommandBus(scene);
  if (!actorId || !commandBus) {
    return false;
  }

  commandBus.dispatch({
    type: ProbableWaffleGameCommandTypes.Production,
    playerNumber,
    actorIds: [actorId],
    actorName
  });
  return true;
}

export function dispatchResearchCommand(
  scene: Phaser.Scene,
  building: Phaser.GameObjects.GameObject,
  playerNumber: PlayerNumber,
  researchType: ResearchType
): boolean {
  const actorId = getActorComponent(building, IdComponent)?.id;
  const commandBus = getCommandBus(scene);
  if (!actorId || !commandBus) {
    return false;
  }

  commandBus.dispatch({
    type: ProbableWaffleGameCommandTypes.Research,
    playerNumber,
    actorIds: [actorId],
    researchType
  });
  return true;
}

export function dispatchCancelProductionCommand(
  scene: Phaser.Scene,
  building: Phaser.GameObjects.GameObject,
  playerNumber: PlayerNumber,
  queueIndex: number
): boolean {
  const actorId = getActorComponent(building, IdComponent)?.id;
  const commandBus = getCommandBus(scene);
  if (!actorId || !commandBus) {
    return false;
  }

  commandBus.dispatch({
    type: ProbableWaffleGameCommandTypes.CancelProduction,
    playerNumber,
    actorIds: [actorId],
    queueIndex
  });
  return true;
}

export function dispatchCancelResearchCommand(
  scene: Phaser.Scene,
  building: Phaser.GameObjects.GameObject,
  playerNumber: PlayerNumber
): boolean {
  const actorId = getActorComponent(building, IdComponent)?.id;
  const commandBus = getCommandBus(scene);
  if (!actorId || !commandBus) {
    return false;
  }

  commandBus.dispatch({
    type: ProbableWaffleGameCommandTypes.CancelResearch,
    playerNumber,
    actorIds: [actorId]
  });
  return true;
}
