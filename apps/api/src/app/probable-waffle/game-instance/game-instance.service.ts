import { Injectable } from "@nestjs/common";
import { User } from "@supabase/supabase-js";
import {
  GameInstanceDataDto,
  GameSessionState,
  PlayerAction,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceDataDto,
  ProbableWaffleJoinDto,
  ProbableWafflePlayer,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerEvent,
  ProbableWafflePlayerStateData,
  ProbableWaffleRoom,
  ProbableWaffleRoomEvent,
  ProbableWaffleSpectatorEvent,
  ProbableWaffleStartLevelDto,
  RoomAction,
  SpectatorAction
} from "@fuzzy-waddle/api-interfaces";
import { Cron, CronExpression } from "@nestjs/schedule";
import { GameInstanceGateway } from "./game-instance.gateway";
import { GameInstanceServiceInterface } from "./game-instance.service.interface";

@Injectable()
export class GameInstanceService implements GameInstanceServiceInterface {
  constructor(private readonly gameInstanceGateway: GameInstanceGateway) {}

  openGameInstances: ProbableWaffleGameInstance[] = [];

  async startGame(body: ProbableWaffleGameInstanceDataDto, user: User) {
    const newGameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: { gameInstanceId: body.gameInstanceId, createdBy: user.id, joinable: body.joinable },
      players: [{ userId: user.id }]
    });
    this.openGameInstances.push(newGameInstance);
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(newGameInstance, "added"));
    console.log("Probable Waffle - game instance created on server", this.openGameInstances.length);
  }

  async stopGame(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    this.openGameInstances = this.openGameInstances.filter(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId !== body.gameInstanceId
    );
    console.log("Probable Waffle - game instance deleted on server", this.openGameInstances.length);
  }

  async startLevel(body: ProbableWaffleStartLevelDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.gameInstanceMetadata.data.sessionState = GameSessionState.InProgress;
    console.log("Probable waffle - game instance started on server" + body.gameInstanceId);
    this.gameInstanceGateway.emitLevelStateChange({
      sessionState: gameInstance.gameInstanceMetadata.data.sessionState,
      gameInstanceId: body.gameInstanceId
    });
  }

  async joinRoom(body: ProbableWaffleJoinDto, user: User): Promise<ProbableWaffleGameInstanceData> {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    switch (body.type) {
      case "player":
        const player = gameInstance.initPlayer(
          user.id,
          {
            score: 0
          } satisfies ProbableWafflePlayerStateData,
          {} satisfies ProbableWafflePlayerControllerData
        );
        this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(user, player, body.gameInstanceId, "joined"));
        break;
      case "spectator":
        gameInstance.initSpectator({
          userId: user.id
        });
        this.gameInstanceGateway.emitSpectator(this.getSpectatorEvent(user, body.gameInstanceId, "joined"));
        break;
      default:
        throw new Error("Unknown join type");
    }

    return gameInstance.data;
  }

  async leaveRoom(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    gameInstance.removeSpectator(user.id);
    console.log("spectator left", user.id);
    this.gameInstanceGateway.emitSpectator(this.getSpectatorEvent(user, body.gameInstanceId, "left"));
  }

  async stopLevel(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.stopLevel();
    console.log("game mode deleted on server");

    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "removed"));
  }

  async getJoinableRooms(user: User): Promise<ProbableWaffleRoom[]> {
    return this.openGameInstances
      .filter(
        (gi) =>
          gi.gameInstanceMetadata.data.sessionState === GameSessionState.NotStarted &&
          gi.gameInstanceMetadata.data.createdBy !== user.id &&
          gi.gameInstanceMetadata.data.joinable
      )
      .map((gameInstance) => this.getGameInstanceToRoom(gameInstance));
  }

  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): ProbableWaffleRoom {
    return {
      gameInstanceMetadataData: gameInstance.gameInstanceMetadata.data,
      gameMode: gameInstance.gameMode,
      players: gameInstance.players.map((player) => ({ userId: player.userId })),
      spectators: gameInstance.spectators.map((spectator) => ({ userId: spectator.data.userId }))
    };
  }

  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): ProbableWaffleRoomEvent {
    return {
      room: this.getGameInstanceToRoom(gameInstance),
      action
    };
  }

  getSpectatorEvent(user: User, gameInstanceId: string, action: SpectatorAction): ProbableWaffleSpectatorEvent {
    return {
      user_id: user.id,
      gameInstanceId,
      action
    };
  }

  getPlayerEvent(
    user: User,
    player: ProbableWafflePlayer,
    gameInstanceId: string,
    action: PlayerAction
  ): ProbableWafflePlayerEvent {
    return {
      user_id: user.id,
      player,
      gameInstanceId,
      action
    };
  }

  /**
   * remove game instances that have been started more than N time ago
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  handleCron() {
    this.openGameInstances = this.openGameInstances.filter((gi) => {
      const minutesAgo = 1000 * 60 * 15; // 15 minutes
      const started = gi.gameInstanceMetadata.data.createdOn;
      const lastUpdated = gi.gameInstanceMetadata.data.updatedOn;
      const now = new Date();
      // is old if started is more than N minutes ago and lastUpdated is null or more than N minutes ago
      const startedMoreThanNMinutesAgo = started.getTime() + minutesAgo < now.getTime();
      const lastUpdatedMoreThanNMinutesAgo = !lastUpdated || lastUpdated.getTime() + minutesAgo < now.getTime();
      const isOld = startedMoreThanNMinutesAgo && lastUpdatedMoreThanNMinutesAgo;
      if (isOld) {
        this.gameInstanceGateway.emitRoom(this.getRoomEvent(gi, "removed"));
      }
      return !isOld;
    });
  }

  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
    return this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId === gameInstanceId
    );
  }

  private checkIfPlayerIsCreator(gameInstance: ProbableWaffleGameInstance, user: User) {
    return gameInstance.gameInstanceMetadata.data.createdBy === user.id;
  }
}
