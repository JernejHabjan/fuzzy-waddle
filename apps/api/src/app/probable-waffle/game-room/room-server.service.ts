import { Injectable } from "@nestjs/common";
import { RoomGateway } from "./room.gateway";
import {
  GameSessionState,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGetRoomsDto,
  ProbableWaffleRoom,
  ProbableWaffleRoomEvent,
  RoomAction
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";
import { GameInstanceHolderService } from "../game-instance/game-instance-holder.service";

@Injectable()
export class RoomServerService {
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
      (gi) => !gi.gameMode || (body.maps?.includes(gi.gameMode.data.map) ?? true)
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

  // findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
  //   return this.gameInstanceHolderService.findGameInstance(gameInstanceId);
  // }

  // async joinRoom(body: ProbableWaffleJoinDto, user: User): Promise<ProbableWaffleGameInstanceData> {
  //   const gameInstance = this.findGameInstance(body.gameInstanceId);
  //   if (!gameInstance) return;
  //   switch (body.type) {
  //     case "player":
  //       const playerDefinition = {
  //         player: {
  //           playerNumber: gameInstance.players.length,
  //           playerName: "Player " + (gameInstance.players.length + 1),
  //           playerPosition: gameInstance.players.length,
  //           joined: true
  //         } satisfies PlayerLobbyDefinition, // TODO THIS IS DUPLICATED EVERYWHERE
  //         playerType: ProbableWafflePlayerType.Human,
  //         playerColor: GameSetupHelpers.getColorForPlayer(
  //           gameInstance.players.length,
  //           gameInstance.gameMode?.data.maxPlayers
  //         ) // TODO THIS IS DUPLICATED EVERYWHERE
  //       } satisfies PositionPlayerDefinition;
  //       const player = gameInstance.initPlayer({
  //         userId: user.id,
  //         playerDefinition
  //       } satisfies ProbableWafflePlayerControllerData);
  //       this.roomEvent("player.joined", gameInstance, user);
  //       console.log("Probable Waffle - Player joined", user.id);
  //       break;
  //     case "spectator":
  //       const spectator = gameInstance.initSpectator({
  //         userId: user.id
  //       });
  //       this.roomEvent("spectator.joined", gameInstance, user);
  //       console.log("Probable Waffle - Spectator joined", user.id);
  //       break;
  //     default:
  //       throw new Error("Probable Waffle - Join Room - Unknown join type");
  //   }
  //
  //   return gameInstance.data;
  // }
}
