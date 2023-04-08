import { Injectable } from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { GameInstanceServer } from './game-instance-server';
import {
  LittleMuncherGameInstanceCreateDto,
  LittleMuncherGameMode,
  LittleMuncherGameModeCreateDto,
  SpectatorRoom
} from '@fuzzy-waddle/api-interfaces';
import { Cron, CronExpression } from "@nestjs/schedule";
import { GameInstanceGateway } from './game-instance.gateway';

@Injectable()
export class GameInstanceService {
  constructor(private readonly gameInstanceGateway: GameInstanceGateway) {}

  openGameInstances: GameInstanceServer[] = [];

  async create(body: LittleMuncherGameInstanceCreateDto, user: User) {
    const newGameInstance = new GameInstanceServer(body, user);
    this.openGameInstances.push(newGameInstance);
    console.log('game instance created on server', this.openGameInstances.length);
  }

  async delete(body: LittleMuncherGameInstanceCreateDto, user: User) {
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

  async setGameMode(body: LittleMuncherGameModeCreateDto, user: User) {
    const gameInstance = this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceId === body.gameInstanceId
    );
    if (!gameInstance) return;
    // check that we're the creator
    if (gameInstance.createdBy !== user.id) return;
    gameInstance.gameMode = new LittleMuncherGameMode(body.hillName);
    console.log('game mode set on server', body.hillName);
    this.gameInstanceGateway.emit(this.getGameInstanceToSpectatorRoom(gameInstance, 'added'));
  }

  async deleteGameMode(body: LittleMuncherGameModeCreateDto, user: User) {
    const gameInstance = this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceId === body.gameInstanceId
    );
    if (!gameInstance) return;
    // check that we're the creator
    if (gameInstance.createdBy !== user.id) return;
    gameInstance.gameMode = null;
    console.log('game mode deleted on server');

    this.gameInstanceGateway.emit(this.getGameInstanceToSpectatorRoom(gameInstance, 'removed'));
  }

  async getSpectatorRooms(user: User): Promise<SpectatorRoom[]> {
    return this.openGameInstances
      .filter((gi) => gi.gameMode)
      .map((gameInstance) => this.getGameInstanceToSpectatorRoom(gameInstance, 'existing'));
  }

  getGameInstanceToSpectatorRoom(
    gameInstance: GameInstanceServer,
    action: 'added' | 'existing' | 'removed'
  ): SpectatorRoom {
    return {
      id: gameInstance.gameInstanceId,
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
        this.gameInstanceGateway.emit(this.getGameInstanceToSpectatorRoom(gi, 'removed'));
      }
      return !isOld;
    });
  }
}
