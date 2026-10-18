import type { GameInstanceId, Room, RoomEvent } from "@fuzzy-waddle/platform-game-sessions";
import type { ProbableWaffleGameModeData } from "./game-mode";
import type { ProbableWaffleGameInstanceMetadataData } from "./game-instance-medatada";
import type { ProbableWafflePlayerControllerData } from "./player";
import { ProbableWafflePlayerType } from "./player";
import type { ProbableWaffleSpectatorData } from "./spectator";

export enum ProbableWaffleGameInstanceEvent {
  GameFound = "game-found"
}

export interface ProbableWaffleRoomPlayer {
  controllerData: ProbableWafflePlayerControllerData;
}

export interface ProbableWaffleRoom extends Room<ProbableWaffleGameInstanceMetadataData, ProbableWaffleGameModeData> {
  players: ProbableWaffleRoomPlayer[];
  spectators: ProbableWaffleSpectatorData[];
}

export interface ProbableWaffleRoomEvent extends RoomEvent<ProbableWaffleRoom> {}

export interface ProbableWaffleGameFoundEvent {
  userIds: string[];
  gameInstanceId: GameInstanceId;
}

export class ProbableWaffleRoomHelper {
  public static getActivatedPlayersInRoom(room: ProbableWaffleRoom): ProbableWaffleRoomPlayer[] {
    return room.players.filter(
      (player) => player.controllerData.playerDefinition?.playerType !== ProbableWafflePlayerType.NetworkOpen
    );
  }
}
