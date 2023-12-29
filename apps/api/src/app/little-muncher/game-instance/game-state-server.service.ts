import { Injectable } from "@nestjs/common";
import {
  CommunicatorEvent,
  LittleMuncherCommunicatorClimbingEvent,
  LittleMuncherCommunicatorPauseEvent,
  LittleMuncherCommunicatorScoreEvent,
  LittleMuncherCommunicatorType,
  LittleMuncherPosition
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceService } from "./game-instance.service";
import { User } from "@supabase/supabase-js";

@Injectable()
export class GameStateServerService {
  constructor(private readonly gameInstanceService: GameInstanceService) {}

  updateGameState(body: CommunicatorEvent<any, LittleMuncherCommunicatorType>, user: User): boolean {
    const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId);
    if (!gameInstance) {
      console.log("game instance not found");
      return false;
    }
    if (!gameInstance.players.length) {
      console.log("game instance has no players");
      return false;
    }
    gameInstance.gameInstanceMetadata.data.updatedOn = new Date();

    // get player from gameInstance:
    const authUserPlayer = gameInstance.isPlayer(user.id);
    const player = gameInstance.players[0];
    switch (body.communicator) {
      case "timeClimbing":
        if (!authUserPlayer) {
          console.log("User is not a player in this game instance");
          return false;
        }
        gameInstance.gameState.data.climbedHeight = (body.data as LittleMuncherCommunicatorClimbingEvent).timeClimbing;
        console.log("updating time climbing", body.data);
        break;
      case "pause":
        if (!authUserPlayer) {
          console.log("User is not a player in this game instance");
          return false;
        }
        gameInstance.gameState.data.pause = (body.data as LittleMuncherCommunicatorPauseEvent).pause;
        console.log("updating pause", body.data);
        console.log("pausing game");
        break;
      case "reset":
        if (!authUserPlayer) {
          console.log("User is not a player in this game instance");
          return false;
        }
        gameInstance.gameState.data.climbedHeight = 0;
        gameInstance.gameState.data.score = 0;
        console.log("resetting game");
        break;
      case "score":
        if (!authUserPlayer) {
          console.log("User is not a player in this game instance");
          return false;
        }
        player.playerState.data.score = (body.data as LittleMuncherCommunicatorScoreEvent).score;
        console.log("updating score", body.data);
        break;
      case "move":
        if (!authUserPlayer) {
          console.log("User is not a player in this game instance");
          return false;
        }
        player.playerState.data.position = body.data as LittleMuncherPosition;
        console.log("updating position", body.data);
        break;
      default:
        throw new Error("Unknown communicator");
    }
    return true;
  }
}
