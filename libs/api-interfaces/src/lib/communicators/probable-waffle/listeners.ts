import { ProbableWaffleGameInstance } from "../../game-instance/probable-waffle/game-instance";
import type {
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
  ProbableWaffleGameStateDataChangeEvent,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWafflePlayerDataChangeEventProperty,
  ProbableWaffleSpectatorDataChangeEvent
} from "./communicators";
import {
  ProbableWafflePlayer,
  type ProbableWafflePlayerControllerData,
  ProbableWafflePlayerType
} from "../../game-instance/probable-waffle/player";
import { type ProbableWaffleSpectatorData } from "../../game-instance/probable-waffle/spectator";
import { ProbableWaffleGameMode, type ProbableWaffleGameModeData } from "../../game-instance/probable-waffle/game-mode";
import { GameSessionState } from "../../game-instance/session";
import { GameSetupHelpers } from "../../probable-waffle/game-setup.helpers";
import type { ActorDefinition } from "../../game-instance/probable-waffle/game-state";

export class ProbableWaffleListeners {
  private static readonly debug = false;
  static gameInstanceMetadataChanged(
    gameInstance: ProbableWaffleGameInstance | undefined,
    payload: ProbableWaffleGameInstanceMetadataChangeEvent
  ) {
    if (!gameInstance) throw new Error("Game instance empty");
    switch (payload.property) {
      case "sessionState":
        gameInstance.gameInstanceMetadata!.data.sessionState = payload.data.sessionState;
        switch (payload.data.sessionState) {
          case GameSessionState.NotStarted:
          case GameSessionState.MovingPlayersToGame:
          case GameSessionState.StartingTheGame:
          case GameSessionState.InProgress:
          case GameSessionState.ToScoreScreen:
          case GameSessionState.Stopped:
            // none of these need any additional handling here
            break;
          default:
            throw new Error("Unknown session state: " + payload.data.sessionState);
        }
        break;
      default:
        throw new Error("Unknown communicator for gameInstanceMetadataDataChange: " + payload.property);
    }
  }

  static gameModeChanged(
    gameInstance: ProbableWaffleGameInstance | undefined,
    payload: ProbableWaffleGameModeDataChangeEvent
  ) {
    if (!gameInstance) throw new Error("Game instance empty");
    switch (payload.property) {
      case "all":
        gameInstance.gameMode = new ProbableWaffleGameMode(payload.data as ProbableWaffleGameModeData);
        break;
      case "map":
        gameInstance.gameMode!.data.map = payload.data.map;
        break;
      case "tieConditions.maximumTimeLimitInMinutes":
        gameInstance.gameMode!.data.tieConditions.maximumTimeLimitInMinutes =
          payload.data.tieConditions!.maximumTimeLimitInMinutes;
        break;
      case "mapTuning.unitCap":
        gameInstance.gameMode!.data.mapTuning.unitCap = payload.data.mapTuning!.unitCap;
        break;
      case "difficultyModifiers.aiAdvantageResources":
        gameInstance.gameMode!.data.difficultyModifiers.aiAdvantageResources =
          payload.data.difficultyModifiers!.aiAdvantageResources;
        break;
      case "difficultyModifiers.reducedIncome":
        gameInstance.gameMode!.data.difficultyModifiers.reducedIncome = payload.data.difficultyModifiers!.reducedIncome;
        break;
      default:
        throw new Error("Unknown communicator for gameModeDataChange: " + payload.property);
    }
  }

  static playerChanged(
    gameInstance: ProbableWaffleGameInstance | undefined,
    payload: ProbableWafflePlayerDataChangeEvent
  ) {
    {
      if (!gameInstance) throw new Error("Game instance empty");
      let controllerData: ProbableWafflePlayerControllerData;
      let player: ProbableWafflePlayer | undefined;
      switch (payload.property) {
        case "joined":
          // check if player with this player number doesn't exist
          controllerData = payload.data.playerControllerData as ProbableWafflePlayerControllerData;
          const playerNumber = controllerData.playerDefinition!.player.playerNumber;
          const exists = gameInstance.players.find((p) => p.playerNumber === playerNumber);
          if (exists) throw new Error("Player already exists in this game instance with number " + playerNumber);
          player = gameInstance.initPlayer(controllerData);
          gameInstance.addPlayer(player);
          break;
        case "joinedFromNetwork":
          const firstNetworkOpenPlayer = GameSetupHelpers.getFirstNetworkOpenPlayer(gameInstance.players);
          if (!firstNetworkOpenPlayer) throw new Error("No network open player found");
          controllerData = payload.data.playerControllerData as ProbableWafflePlayerControllerData;
          firstNetworkOpenPlayer.playerController.data.userId = controllerData.userId;
          firstNetworkOpenPlayer.playerController.data.playerDefinition!.playerType = ProbableWafflePlayerType.Human;
          firstNetworkOpenPlayer.playerController.data.playerDefinition!.player.joined = true;
          break;
        case "left":
          controllerData = payload.data.playerControllerData as ProbableWafflePlayerControllerData;
          gameInstance.removePlayerByData(controllerData);
          break;
        case "playerController.data.playerDefinition.player.playerPosition" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.playerController.data.playerDefinition!.player.playerPosition =
            payload.data.playerControllerData!.playerDefinition!.player.playerPosition;
          break;
        case "playerController.data.playerDefinition.player.ready" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.playerController.data.playerDefinition!.player.ready =
            payload.data.playerControllerData!.playerDefinition!.player.ready;
          break;
        case "playerController.data.playerDefinition.factionType" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.playerController.data.playerDefinition!.factionType =
            payload.data.playerControllerData!.playerDefinition!.factionType;
          ProbableWaffleListeners.logDebugInfo(
            "faction type changed",
            player.playerController.data.playerDefinition!.factionType,
            "for player",
            player.playerNumber
          );
          break;
        case "playerController.data.playerDefinition.team" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.playerController.data.playerDefinition!.team =
            payload.data.playerControllerData!.playerDefinition!.team;
          ProbableWaffleListeners.logDebugInfo(
            "team changed",
            player.playerController.data.playerDefinition!.team,
            "for player",
            player.playerNumber
          );
          break;
        case "playerController.data.playerDefinition.difficulty" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.playerController.data.playerDefinition!.difficulty =
            payload.data.playerControllerData!.playerDefinition!.difficulty;
          ProbableWaffleListeners.logDebugInfo(
            "difficulty changed",
            player.playerController.data.playerDefinition!.difficulty,
            "for player",
            player.playerNumber
          );
          break;

        case "selection.added" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          payload.data.playerStateData!.selection!.forEach((id) => player!.setSelectedActor(id));
          ProbableWaffleListeners.logDebugInfo(
            "selection added",
            payload.data.playerStateData!.selection!.length,
            "for player",
            player.playerNumber
          );
          break;

        case "selection.removed" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          payload.data.playerStateData!.selection!.forEach((id) => player!.removeSelectedActor(id));
          ProbableWaffleListeners.logDebugInfo(
            "selection removed",
            payload.data.playerStateData!.selection!.length,
            "for player",
            player.playerNumber
          );
          break;

        case "selection.set" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!)!;
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.clearSelection();
          payload.data.playerStateData!.selection!.forEach((id) => player!.setSelectedActor(id));
          ProbableWaffleListeners.logDebugInfo(
            "selection set",
            payload.data.playerStateData!.selection!.length,
            "for player",
            player.playerNumber
          );
          break;

        case "selection.cleared" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.clearSelection();
          ProbableWaffleListeners.logDebugInfo("selection cleared for player", player.playerNumber);
          break;

        case "command.issued.move" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          const tileVec3 = payload.data.data!["tileVec3"];

          // get selected actors and issue move command to them
          const selectedActors = player.getSelection();
          // find actors in game state by id
          const actors = gameInstance.gameState!.data.actors.filter(
            (a) => a.id?.id && selectedActors.includes(a.id.id)
          );
          actors.forEach((actor) => {
            // todo handle storing to game state
            ProbableWaffleListeners.logDebugInfo(
              `move command issued for player ${player!.playerNumber} to actor ${actor.id} at x: ${tileVec3.x}, y: ${tileVec3.y}, z: ${tileVec3.z}`
            );
          });
          break;

        case "command.issued.actor" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          const objectIds = payload.data.data!["objectIds"];
          // todo store commands to game state?
          break;

        case "resource.added" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          // noinspection JSDeprecatedSymbols
          player.addResources(payload.data.playerStateData!.resources!);
          ProbableWaffleListeners.logDebugInfo("resources added for player", player.playerNumber);
          break;
        case "resource.removed" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          // noinspection JSDeprecatedSymbols
          player.payAllResources(payload.data.playerStateData!.resources!);
          ProbableWaffleListeners.logDebugInfo("resources removed for player", player.playerNumber);
          break;
        case "housing.added" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.playerState.data.housing.maxHousing += payload.data.playerStateData!.housing!.maxHousing;
          ProbableWaffleListeners.logDebugInfo("housing added for player", player.playerNumber);
          break;
        case "housing.removed" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.playerState.data.housing.maxHousing -= payload.data.playerStateData!.housing!.maxHousing;
          if (player.playerState.data.housing.maxHousing < 0) player.playerState.data.housing.maxHousing = 0;
          if (player.playerState.data.housing.currentHousing > player.playerState.data.housing.maxHousing) {
            player.playerState.data.housing.currentHousing = player.playerState.data.housing.maxHousing;
          }

          ProbableWaffleListeners.logDebugInfo("housing removed for player", player.playerNumber);
          break;
        case "housing.current.increased" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.playerState.data.housing.currentHousing += payload.data.playerStateData!.housing!.currentHousing;
          if (player.playerState.data.housing.currentHousing > player.playerState.data.housing.maxHousing) {
            player.playerState.data.housing.currentHousing = player.playerState.data.housing.maxHousing;
          }
          ProbableWaffleListeners.logDebugInfo("housing current increased for player", player.playerNumber);
          break;
        case "housing.current.decreased" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.playerState.data.housing.currentHousing -= payload.data.playerStateData!.housing!.currentHousing;
          if (player.playerState.data.housing.currentHousing < 0) {
            player.playerState.data.housing.currentHousing = 0;
          }
          ProbableWaffleListeners.logDebugInfo("housing current decreased for player", player.playerNumber);
          break;
        default:
          throw new Error("Unknown communicator for playerDataChange: " + payload.property);
      }
    }
  }

  static spectatorChanged(
    gameInstance: ProbableWaffleGameInstance | undefined,
    payload: ProbableWaffleSpectatorDataChangeEvent
  ) {
    if (!gameInstance) throw new Error("Game instance empty");
    switch (payload.property) {
      case "joined":
        const spectator = gameInstance!.initSpectator(payload.data as ProbableWaffleSpectatorData);
        gameInstance.addSpectator(spectator);
        break;
      case "left":
        gameInstance.removeSpectator(payload.data.userId!);
        break;
      default:
        throw new Error("Unknown communicator for spectatorDataChange: " + payload.property);
    }
  }

  static gameStateDataChanged(gameInstance: ProbableWaffleGameInstance, event: ProbableWaffleGameStateDataChangeEvent) {
    switch (event.property) {
      case "all": {
        gameInstance.gameState!.data = event.data.gameState as any;
        ProbableWaffleListeners.logDebugInfo("game state changed to", gameInstance.gameState!.data);
        break;
      }
      case "health.health":
        const actorHealth = this.getActorById(event.data.actorDefinition!.id!, gameInstance);
        if (!actorHealth) throw new Error("Actor not found with id " + event.data.actorDefinition!.id);
        if (!actorHealth.health) actorHealth.health = {};
        actorHealth.health.health = event.data.actorDefinition?.health!.health;
        ProbableWaffleListeners.logDebugInfo(
          "health changed for actor",
          event.data.actorDefinition!.id!,
          "to health:",
          actorHealth.health.health
        );
        break;

      case "health.armor":
        const actorArmor = this.getActorById(event.data.actorDefinition!.id!, gameInstance);
        if (!actorArmor) throw new Error("Actor not found with id " + event.data.actorDefinition!.id);
        if (!actorArmor.health) actorArmor.health = {};
        actorArmor.health.armour = event.data.actorDefinition?.health!.armour;
        ProbableWaffleListeners.logDebugInfo(
          "armor changed for actor",
          event.data.actorDefinition!.id!,
          "to armor:",
          actorArmor.health.armour
        );
        break;

      default:
        throw new Error("Unknown communicator for gameStateDataChange: " + event.property);
    }
  }

  private static getActorById(id: string, gameInstance: ProbableWaffleGameInstance): ActorDefinition | undefined {
    return gameInstance.gameState!.data.actors.find((a) => a.id === id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static logDebugInfo(message?: any, ...optionalParams: any[]) {
    if (!ProbableWaffleListeners.debug) return;
    console.log(message, ...optionalParams);
  }
}

function applyPropertiesIfNotExist(target: Record<string, any> | any, source: Record<string, any> | undefined) {
  if (!source) return;
  for (const key in source) {
    if (source[key] !== undefined && target[key] === undefined) {
      target[key] = source[key];
    }
  }
  return target;
}
