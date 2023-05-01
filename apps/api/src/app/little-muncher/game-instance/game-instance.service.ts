import { Injectable } from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import {
  GameInstanceDataDto,
  GameSessionState,
  LittleMuncherGameCreateDto,
  LittleMuncherGameInstance,
  LittleMuncherGameMode,
  LittleMuncherGameState,
  LittleMuncherSpectator,
  Room,
  RoomAction,
  RoomEvent,
  SpectatorAction,
  SpectatorEvent
} from '@fuzzy-waddle/api-interfaces';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GameInstanceGateway } from './game-instance.gateway';

@Injectable()
export class GameInstanceService {
  constructor(private readonly gameInstanceGateway: GameInstanceGateway) {}

  openGameInstances: LittleMuncherGameInstance[] = [];

  async startGame(body: GameInstanceDataDto, user: User) {
    const newGameInstance = new LittleMuncherGameInstance();
    newGameInstance.init(body.gameInstanceId, user.id);
    this.openGameInstances.push(newGameInstance);
    console.log('game instance created on server', this.openGameInstances.length);
  }

  async stopGame(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    this.openGameInstances = this.openGameInstances.filter(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId !== body.gameInstanceId
    );
    console.log('game instance deleted on server', this.openGameInstances.length);
  }

  async startLevel(body: LittleMuncherGameCreateDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.initGame(
      new LittleMuncherGameMode({
        hillToClimbOn: body.level.hillName
      }),
      new LittleMuncherGameState()
    );
    gameInstance.gameInstanceMetadata.data.sessionState = GameSessionState.StartingLevel;
    console.log('game mode set on server', body.level.hillName);
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, 'added'));
  }

  async spectatorJoined(body: GameInstanceDataDto, user: User): Promise<LittleMuncherGameInstance> {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    gameInstance.initSpectator(new LittleMuncherSpectator(user.id));
    console.log('spectator joined', user.id);
    this.gameInstanceGateway.emitSpectator(
      this.getSpectatorEvent(user, this.getGameInstanceToRoom(gameInstance), 'joined')
    );
    return gameInstance;
  }

  async spectatorLeft(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    gameInstance.removeSpectator(user.id);
    console.log('spectator left', user.id);
    this.gameInstanceGateway.emitSpectator(
      this.getSpectatorEvent(user, this.getGameInstanceToRoom(gameInstance), 'left')
    );
  }

  async stopLevel(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.stopLevel();
    console.log('game mode deleted on server');

    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, 'removed'));
  }

  async getSpectatorRooms(user: User): Promise<Room[]> {
    return this.openGameInstances
      .filter((gi) => gi.gameMode)
      .map((gameInstance) => this.getGameInstanceToRoom(gameInstance));
  }

  getGameInstanceToRoom(gameInstance: LittleMuncherGameInstance): Room {
    return {
      gameInstanceId: gameInstance.gameInstanceMetadata.data.gameInstanceId
    };
  }

  getRoomEvent(gameInstance: LittleMuncherGameInstance, action: RoomAction): RoomEvent {
    return {
      room: this.getGameInstanceToRoom(gameInstance),
      action
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
        this.gameInstanceGateway.emitRoom(this.getRoomEvent(gi, 'removed'));
      }
      return !isOld;
    });
  }

  findGameInstance(gameInstanceId: string): LittleMuncherGameInstance | undefined {
    return this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId === gameInstanceId
    );
  }

  private checkIfPlayerIsCreator(gameInstance: LittleMuncherGameInstance, user: User) {
    return gameInstance.gameInstanceMetadata.data.createdBy === user.id;
  }
}
