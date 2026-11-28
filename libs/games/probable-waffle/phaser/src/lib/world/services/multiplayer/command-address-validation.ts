import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import {
  type GameCommand,
  type GameCommandInput,
  type GameCommandOutcomeReason,
  ProbableWaffleGameCommandTypes,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/probable-waffle-protocol";

import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";

import { getSceneService } from "../scene-component-helpers";
import { ActorIndexSystem } from "../ActorIndexSystem";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../../../entity/components/owner-component";

import type { CommandLockstep } from "./command-lockstep";

export function normalizeCommand(
  scene: ProbableWaffleScene,
  transport: CommandLockstep,
  command: GameCommandInput
): GameCommandInput | null {
  if (!scene) {
    return command;
  }

  const actorIndex = getSceneService(scene, ActorIndexSystem);
  if (!actorIndex) {
    return command;
  }

  if (command.type === ProbableWaffleGameCommandTypes.Concede) {
    const playerExists = scene.players.some((player) => player.playerNumber === command.playerNumber);
    return playerExists ? { ...command, actorIds: [] } : null;
  }

  const actorIds = [...new Set(command.actorIds)];

  if (actorIds.length === 0) {
    transport.diagnostics.debugLog(
      `dropping command type=${command.type} because no valid owned actors remained after sanitization`
    );
    return null;
  }

  if (command.type === ProbableWaffleGameCommandTypes.ActorAction) {
    const targetObjectIds = command.targetObjectIds?.filter((targetId, index, ids) => {
      if (ids.indexOf(targetId) !== index) {
        return false;
      }
      return !!actorIndex.getActorById(targetId);
    });

    return {
      ...command,
      actorIds,
      targetObjectIds
    };
  }

  return {
    ...command,
    actorIds
  };
}

export function getInputAddressError(
  scene: ProbableWaffleScene,
  transport: CommandLockstep,
  command: GameCommandInput
): GameCommandOutcomeReason | null {
  const player = scene.players.find((candidate) => candidate.playerNumber === command.playerNumber);
  if (!player) return "invalid_owner";
  const isAi = player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.AI;
  if (transport.isMultiplayer && isAi && !scene.isHost) return "invalid_owner";
  if (
    transport.isMultiplayer &&
    !isAi &&
    transport.localPlayerNumber !== null &&
    command.playerNumber !== transport.localPlayerNumber
  ) {
    return "invalid_owner";
  }
  if (command.type === ProbableWaffleGameCommandTypes.Concede) return null;
  const actorIndex = getSceneService(scene, ActorIndexSystem);
  if (!actorIndex) return "application_failed";
  for (const actorId of command.actorIds) {
    const actor = actorIndex.getActorById(actorId);
    if (!actor) return "missing_actor";
    if (!actor.active) return "inactive_actor";
    if (actor.getData("campaign.controllable") === false) return "invalid_owner";
    if (getActorComponent(actor, OwnerComponent)?.getOwner() !== command.playerNumber) return "invalid_owner";
  }
  if (command.type === ProbableWaffleGameCommandTypes.ActorAction) {
    if (command.targetObjectIds?.some((targetId) => !actorIndex.getActorById(targetId))) return "invalid_target";
  }
  if (
    command.type === ProbableWaffleGameCommandTypes.CastSpell &&
    command.targetObjectId &&
    !actorIndex.getActorById(command.targetObjectId)
  ) {
    return "invalid_target";
  }
  if (
    command.type === ProbableWaffleGameCommandTypes.SetRallyPoint &&
    command.targetObjectId &&
    !actorIndex.getActorById(command.targetObjectId)
  ) {
    return "invalid_target";
  }
  return null;
}

export function getApplicationAddressError(
  scene: ProbableWaffleScene,
  command: GameCommand
): GameCommandOutcomeReason | null {
  if (command.type === ProbableWaffleGameCommandTypes.Concede) return null;
  const actorIndex = getSceneService(scene, ActorIndexSystem);
  if (!actorIndex) return "application_failed";
  for (const actorId of command.actorIds) {
    const actor = actorIndex.getActorById(actorId);
    if (!actor) return "missing_actor";
    if (!actor.active) return "inactive_actor";
    if (getActorComponent(actor, OwnerComponent)?.getOwner() !== command.playerNumber) return "invalid_owner";
  }
  if (command.type === ProbableWaffleGameCommandTypes.ActorAction) {
    if (command.targetObjectIds?.some((targetId) => !actorIndex.getActorById(targetId))) return "invalid_target";
  }
  if (
    command.type === ProbableWaffleGameCommandTypes.CastSpell &&
    command.targetObjectId &&
    !actorIndex.getActorById(command.targetObjectId)
  ) {
    return "invalid_target";
  }
  if (
    command.type === ProbableWaffleGameCommandTypes.SetRallyPoint &&
    command.targetObjectId &&
    !actorIndex.getActorById(command.targetObjectId)
  ) {
    return "invalid_target";
  }
  return null;
}

export function resolveLocalPlayerNumber(scene: ProbableWaffleScene): PlayerNumber | null {
  const scenePlayerNumber = scene.playerOrNull?.playerNumber;
  if (scenePlayerNumber !== undefined && scenePlayerNumber !== null) {
    return scenePlayerNumber;
  }

  const basePlayerNumber = scene.baseGameData.user.playerNumber;
  if (basePlayerNumber !== undefined && basePlayerNumber !== null) {
    return basePlayerNumber;
  }

  const userId = scene.userId;
  if (userId) {
    const matchingPlayer = scene.baseGameData.gameInstance.players.find(
      (player) => player.playerController.data.userId === userId
    );
    if (matchingPlayer?.playerNumber !== undefined) {
      return matchingPlayer.playerNumber;
    }
  }

  return null;
}
