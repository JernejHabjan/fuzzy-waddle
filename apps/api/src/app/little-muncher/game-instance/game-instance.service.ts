import { Injectable } from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { GameInstanceServer } from './game-instance-server';
import { LittleMuncherGameInstanceCreateDto, LittleMuncherGameModeCreateDto } from '@fuzzy-waddle/api-interfaces';

@Injectable()
export class GameInstanceService {
  openGameInstances: GameInstanceServer[] = []; // todo don't forget to clean them after

  async create(body: LittleMuncherGameInstanceCreateDto, user: User) {
    this.openGameInstances.push(new GameInstanceServer(body, user));
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

  async createGameMode(body: LittleMuncherGameModeCreateDto, user: User) {
    throw new Error('Method not implemented.'); // todo
  }
}
