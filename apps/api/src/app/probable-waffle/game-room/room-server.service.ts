import { Injectable } from "@nestjs/common";
import { RoomGateway } from "./room.gateway";
import {
  type CommunicatorEvent,
  GameSessionState,
  type ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceVisibility,
  type ProbableWaffleGetRoomsDto,
  type ProbableWafflePlayerDataChangeEvent,
  type ProbableWaffleRoom,
  type ProbableWaffleRoomEvent,
  type ProbableWaffleSpectatorDataChangeEvent,
  type RoomAction
} from "@fuzzy-waddle/api-interfaces";
import { type User } from "@supabase/supabase-js";
import { GameInstanceHolderService } from "../game-instance/game-instance-holder.service";
import { type RoomServerServiceInterface } from "./room-server.service.interface";

@Injectable()
export class RoomServerService implements RoomServerServiceInterface {
  constructor(
    private readonly roomGateway: RoomGateway,
    private readonly gameInstanceHolderService: GameInstanceHolderService
  ) {}

  async getVisibleRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]> {
    const notStarted = this.gameInstanceHolderService.openGameInstances.filter(
      (gi) => gi.gameInstanceMetadata.data.sessionState === GameSessionState.NotStarted
    );
    const visible = notStarted.filter(
      (gi) => gi.gameInstanceMetadata.data.visibility === ProbableWaffleGameInstanceVisibility.Public
    );
    const notCreatedByUser = visible.filter((gi) => gi.gameInstanceMetadata.data.createdBy !== user.id);
    const filteredByMap = notCreatedByUser.filter(
      (gi) => !gi.gameMode || (body.maps?.includes(gi.gameMode.data.map!) ?? true)
    );
    // noinspection UnnecessaryLocalVariableJS
    const gameInstanceToRoom = filteredByMap.map((gameInstance) => this.getGameInstanceToRoom(gameInstance));
    return gameInstanceToRoom;
  }

  roomEvent(type: RoomAction, gameInstance: ProbableWaffleGameInstance, user: User | null) {
    this.roomGateway.emitRoom({
      room: this.getGameInstanceToRoom(gameInstance),
      action: type
    } satisfies ProbableWaffleRoomEvent);
  }

  private getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): ProbableWaffleRoom {
    return {
      gameInstanceMetadataData: gameInstance.gameInstanceMetadata.data,
      gameModeData: gameInstance.gameMode?.data,
      players: gameInstance.players.map((player) => ({
        controllerData: player.playerController.data
      })),
      spectators: gameInstance.spectators.map((spectator) => spectator.data)
    };
  }

  emitCertainGameInstanceEventsToAllUsers(body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>, user: User) {
    const gameInstance = this.gameInstanceHolderService.findGameInstance(body.gameInstanceId!);
    if (!gameInstance) {
      console.log("game instance not found in emitCertainGameInstanceEventsToAllUsers in RoomServerService");
      return false;
    }
    switch (body.communicator) {
      case "gameInstanceMetadataDataChange":
        this.roomEvent("game_instance_metadata", gameInstance, user);
        break;
      case "gameModeDataChange":
        this.roomEvent("game_mode", gameInstance, user);
        break;
      case "playerDataChange":
        const playerData = body.payload as ProbableWafflePlayerDataChangeEvent;
        switch (playerData.property) {
          case "joined":
            this.roomEvent("player.joined", gameInstance, user);
            break;
          case "left":
            this.roomEvent("player.left", gameInstance, user);
            break;
        }
        break;
      case "spectatorDataChange":
        const spectatorData = body.payload as ProbableWaffleSpectatorDataChangeEvent;
        switch (spectatorData.property) {
          case "joined":
            this.roomEvent("spectator.joined", gameInstance, user);
            break;
          case "left":
            this.roomEvent("spectator.left", gameInstance, user);
            break;
        }
        break;
    }
    return true;
  }
}
