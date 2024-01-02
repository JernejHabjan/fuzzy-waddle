import { ProbableWaffleGameInstance } from "../../game-instance/probable-waffle/game-instance";
import {
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
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
          case GameSessionState.Starting:
            // anything to do? // todo
            break;
          case GameSessionState.Stopped:
            // handled individually
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
          const exists = gameInstance.players.find(
            (p) => p.playerController.data.playerDefinition!.player.playerNumber === playerNumber
          );
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
            player.playerController.data.playerDefinition!.player.playerNumber
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
            player.playerController.data.playerDefinition!.player.playerNumber
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
            player.playerController.data.playerDefinition!.player.playerNumber
          );
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
}
