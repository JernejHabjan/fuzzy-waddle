import { Injectable } from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { GameInstanceServer } from './game-instance-server';
import {
  GameCreateDto,
  GameDestroyDto,
  LittleMuncherGameCreateDto,
  LittleMuncherGameInstance,
  LittleMuncherGameMode,
  LittleMuncherGameSessionInstance,
  LittleMuncherGameState,
  LittleMuncherPlayerController,
  LittleMuncherPlayerState,
  LittleMuncherSessionState,
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

  openGameInstances: GameInstanceServer[] = [];

  async startGame(body: GameCreateDto, user: User) {
    const newGameInstanceShared = new LittleMuncherGameSessionInstance();
    newGameInstanceShared.gameInstance = new LittleMuncherGameInstance(body.gameInstanceId);

    const newGameInstance = new GameInstanceServer(body, user);
    this.openGameInstances.push(newGameInstance);
    console.log('game instance created on server', this.openGameInstances.length);
  }

  async stopGame(body: GameCreateDto, user: User) {
    const gameInstance = this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceId === body.gameInstanceId
    );
    if (!gameInstance) return;
    // check that we're the creator
    if (gameInstance.createdBy !== user.id) return;
    this.openGameInstances = this.openGameInstances.filter(
      (gameInstance) => gameInstance.gameInstanceId !== body.gameInstanceId
    );
    console.log('game instance deleted on server', this.openGameInstances.length);
  }

  async startLevel(body: LittleMuncherGameCreateDto, user: User) {
    const gameInstance = this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceId === body.gameInstanceId
    );
    if (!gameInstance) return;
    // check that we're the creator
    if (gameInstance.createdBy !== user.id) return;
    gameInstance.gameMode = new LittleMuncherGameMode(body.level.hillName);
    gameInstance.gameState = new LittleMuncherGameState();
    gameInstance.playerStates = body.player_ids.map((playerId) => new LittleMuncherPlayerState(playerId));
    gameInstance.playerControllers = body.player_ids.map((playerId) => new LittleMuncherPlayerController(playerId));
    gameInstance.sessionState = LittleMuncherSessionState.StartingLevel;
    gameInstance.spectators = [];
    console.log('game mode set on server', body.level.hillName);
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, 'added'));
  }

  async spectatorJoined(body: LittleMuncherGameInstance, user: User) {
    const gameInstance = this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceId === body.gameInstanceId
    );
    if (!gameInstance) return;
    gameInstance.spectators.push(new LittleMuncherSpectator(user.id));
    console.log('spectator joined', user.id);
    this.gameInstanceGateway.emitSpectator(
      this.getSpectatorEvent(user, this.getGameInstanceToRoom(gameInstance), 'joined')
    );
  }

  async spectatorLeft(body: LittleMuncherGameInstance, user: User) {
    const gameInstance = this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceId === body.gameInstanceId
    );
    if (!gameInstance) return;
    gameInstance.spectators = gameInstance.spectators.filter((spectator) => spectator.userId !== user.id);
    console.log('spectator left', user.id);
    this.gameInstanceGateway.emitSpectator(
      this.getSpectatorEvent(user, this.getGameInstanceToRoom(gameInstance), 'left')
    );
  }

  async stopLevel(body: GameDestroyDto, user: User) {
    const gameInstance = this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceId === body.gameInstanceId
    );
    if (!gameInstance) return;
    // check that we're the creator
    if (gameInstance.createdBy !== user.id) return;
    gameInstance.gameMode = null;
    gameInstance.gameState = null;
    gameInstance.playerStates = [];
    gameInstance.playerControllers = [];
    gameInstance.spectators = [];
    gameInstance.sessionState = LittleMuncherSessionState.EndingLevel;
    console.log('game mode deleted on server');

    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, 'removed'));
  }

  async getSpectatorRooms(user: User): Promise<Room[]> {
    return this.openGameInstances
      .filter((gi) => gi.gameMode)
      .map((gameInstance) => this.getGameInstanceToRoom(gameInstance));
  }

  getGameInstanceToRoom(gameInstance: GameInstanceServer): Room {
    return {
      gameInstanceId: gameInstance.gameInstanceId
    };
  }

  getRoomEvent(gameInstance: GameInstanceServer, action: RoomAction): RoomEvent {
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
      const timeInMs = 1000 * 60 * 60 * 2; // 2 hours
      const started = gi.createdOn;
      const now = new Date();
      const isOld = now.getTime() - started.getTime() > timeInMs;
      if (isOld) {
        this.gameInstanceGateway.emitRoom(this.getRoomEvent(gi, 'removed'));
      }
      return !isOld;
    });
  }
}
