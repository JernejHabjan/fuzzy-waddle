import { ProbableWaffleGameInstance } from "../../game-instance/probable-waffle/game-instance";
import {
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWaffleSpectatorDataChangeEvent
} from "./communicators";
import { ProbableWafflePlayerControllerData } from "../../game-instance/probable-waffle/player";
import { ProbableWaffleSpectatorData } from "../../game-instance/probable-waffle/spectator";
import { ProbableWaffleGameMode, ProbableWaffleGameModeData } from "../../game-instance/probable-waffle/game-mode";
import { GameSessionState } from "../../game-instance/session";

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
      switch (payload.property) {
        case "joined":
          // check if player with this player number doesn't exist
          controllerData = payload.data.playerControllerData as ProbableWafflePlayerControllerData;
          const playerNumber = controllerData.playerDefinition!.player.playerNumber;
          const exists = gameInstance.players.find(
            (p) => p.playerController.data.playerDefinition!.player.playerNumber === playerNumber
          );
          if (exists) throw new Error("Player already exists in this game instance with number " + playerNumber);
          const player = gameInstance.initPlayer(controllerData);
          gameInstance.addPlayer(player);
          break;
        case "left":
          controllerData = payload.data.playerControllerData as ProbableWafflePlayerControllerData;
          gameInstance.removePlayerByData(controllerData);
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
