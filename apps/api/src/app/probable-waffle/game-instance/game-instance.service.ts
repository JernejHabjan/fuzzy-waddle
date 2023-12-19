import { Injectable } from "@nestjs/common";
import { User } from "@supabase/supabase-js";
import {
  GameInstanceDataDto,
  GameSessionState,
  ProbableWaffleGameCreateDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  Room,
  RoomAction,
  RoomEvent,
  SpectatorAction,
  SpectatorEvent
} from "@fuzzy-waddle/api-interfaces";
import { Cron, CronExpression } from "@nestjs/schedule";
import { GameInstanceGateway } from "./game-instance.gateway";
import { GameInstanceServiceInterface } from "./game-instance.service.interface";

@Injectable()
export class GameInstanceService implements GameInstanceServiceInterface {
  constructor(private readonly gameInstanceGateway: GameInstanceGateway) {}

  openGameInstances: ProbableWaffleGameInstance[] = [];

  async startGame(body: GameInstanceDataDto, user: User) {
    const newGameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: { gameInstanceId: body.gameInstanceId, createdBy: user.id },
      players: [{ userId: user.id }]
    });
    this.openGameInstances.push(newGameInstance);
    console.log("game instance created on server", this.openGameInstances.length);
  }

  async stopGame(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    this.openGameInstances = this.openGameInstances.filter(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId !== body.gameInstanceId
    );
    console.log("game instance deleted on server", this.openGameInstances.length);
  }

  async startLevel(body: ProbableWaffleGameCreateDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.initGame({
      level: body.level
    });
    gameInstance.gameInstanceMetadata.data.sessionState = GameSessionState.Playing;
    console.log("game mode set on server", body.level);
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "added"));
  }

  async spectatorJoined(body: GameInstanceDataDto, user: User): Promise<ProbableWaffleGameInstanceData> {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    gameInstance.initSpectator({
      userId: user.id
    });
    console.log("spectator joined", user.id);
    this.gameInstanceGateway.emitSpectator(
      this.getSpectatorEvent(user, this.getGameInstanceToRoom(gameInstance), "joined")
    );
    return gameInstance.data;
  }

  async spectatorLeft(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    gameInstance.removeSpectator(user.id);
    console.log("spectator left", user.id);
    this.gameInstanceGateway.emitSpectator(
      this.getSpectatorEvent(user, this.getGameInstanceToRoom(gameInstance), "left")
    );
  }

  async stopLevel(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.stopLevel();
    console.log("game mode deleted on server");

    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "removed"));
  }

  async getSpectatorRooms(user: User): Promise<Room[]> {
    return this.openGameInstances
      .filter(
        (gi) =>
          gi.gameInstanceMetadata.data.sessionState === GameSessionState.Playing &&
          gi.gameInstanceMetadata.data.createdBy !== user.id
      )
      .map((gameInstance) => this.getGameInstanceToRoom(gameInstance));
  }

  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): Room {
    return {
      gameInstanceId: gameInstance.gameInstanceMetadata.data.gameInstanceId
    };
  }

  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): RoomEvent {
    return {
      room: this.getGameInstanceToRoom(gameInstance),
      action,
      gameInstanceMetadataData: gameInstance.gameInstanceMetadata.data
    };
  }

  getSpectatorEvent(user: User, room: Room, action: SpectatorAction): SpectatorEvent {
    return {
      user_id: user.id,
      room,
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
