import { ProbableWaffleGameInstance } from "../../game-instance/probable-waffle/game-instance";
import {
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
  ProbableWaffleGameStateDataChangeEvent,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWafflePlayerDataChangeEventProperty,
  ProbableWaffleSpectatorDataChangeEvent
} from "./communicators";
import {
  ProbableWafflePlayer,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerType
} from "../../game-instance/probable-waffle/player";
import { ProbableWaffleSpectatorData } from "../../game-instance/probable-waffle/spectator";
import { ProbableWaffleGameMode, ProbableWaffleGameModeData } from "../../game-instance/probable-waffle/game-mode";
import { GameSessionState } from "../../game-instance/session";
import { GameSetupHelpers } from "../../probable-waffle/game-setup.helpers";
import { ActorDefinition } from "../../game-instance/probable-waffle/game-state";

export class ProbableWaffleListeners {
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
      case "winConditions.timeLimit":
        gameInstance.gameMode!.data.winConditions.timeLimit = payload.data.winConditions!.timeLimit;
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
        case "playerController.data.playerDefinition.factionType" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          player.playerController.data.playerDefinition!.factionType =
            payload.data.playerControllerData!.playerDefinition!.factionType;
          console.log(
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
          console.log(
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
          console.log(
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
          console.log(
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
          console.log(
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
          console.log(
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
          console.log("selection cleared for player", player.playerNumber);
          break;

        case "command.issued.move" as ProbableWafflePlayerDataChangeEventProperty:
          player = gameInstance.getPlayerByNumber(payload.data.playerNumber!);
          if (!player) throw new Error("Player not found with number " + payload.data.playerNumber);
          const vec3 = payload.data.data!["vec3"];

          // get selected actors and issue move command to them
          const selectedActors = player.getSelection();
          // find actors in game state by id
          const actors = gameInstance.gameState!.data.actors.filter((a) => a.id && selectedActors.includes(a.id));
          actors.forEach((actor) => {
            if (!actor.blackboardCommands) actor.blackboardCommands = [];
            actor.blackboardCommands.push(actor.blackboardCurrentCommand!);
            console.log(
              `move command issued for player ${player!.playerNumber} to actor ${actor.id} at x: ${vec3.x} y: ${vec3.y} z: ${vec3.z}`
            );
          });
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

  static gameStateDataChanged(
    gameInstance: ProbableWaffleGameInstance,
    gameStateData: ProbableWaffleGameStateDataChangeEvent
  ) {
    switch (gameStateData.property) {
      case "health":
        const actor = this.getActorById(gameStateData.data.actorDefinition!.id!, gameInstance);
        if (!actor) throw new Error("Actor not found with id " + gameStateData.data.actorDefinition!.id);
        applyPropertiesIfNotExist(actor.health, gameStateData.data.actorDefinition?.health);
        console.log(
          "health changed for actor",
          actor.id,
          "to health:",
          actor.health?.health + " armor:",
          actor.health?.armor
        );
        break;

      case "health.health":
        const actorHealth = this.getActorById(gameStateData.data.actorDefinition!.id!, gameInstance)?.health;
        if (!actorHealth) throw new Error("Actor health not found with id " + gameStateData.data.actorDefinition!.id);
        actorHealth.health = gameStateData.data.actorDefinition?.health?.health;
        console.log(
          "health changed for actor",
          gameStateData.data.actorDefinition!.id!,
          "to health:",
          actorHealth.health
        );
        break;

      case "health.armor":
        const actorArmor = this.getActorById(gameStateData.data.actorDefinition!.id!, gameInstance)?.health;
        if (!actorArmor) throw new Error("Actor health not found with id " + gameStateData.data.actorDefinition!.id);
        actorArmor.armor = gameStateData.data.actorDefinition?.health?.armor;
        console.log("armor changed for actor", gameStateData.data.actorDefinition!.id!, "to armor:", actorArmor.armor);
        break;

      default:
        throw new Error("Unknown communicator for gameStateDataChange: " + gameStateData.property);
    }
  }

  private static getActorById(id: string, gameInstance: ProbableWaffleGameInstance): ActorDefinition | undefined {
    return gameInstance.gameState!.data.actors.find((a) => a.id === id);
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
