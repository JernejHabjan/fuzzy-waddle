import { Injectable } from '@nestjs/common';
import { CommunicatorEvent, CommunicatorPauseEvent } from '@fuzzy-waddle/api-interfaces';
import { GameInstanceService } from './game-instance.service';
import { User } from '@supabase/supabase-js';

@Injectable()
export class GameStateServerService {
  constructor(private readonly gameInstanceService: GameInstanceService) {}

  updateGameState(body: CommunicatorEvent<any>, user: User): boolean {
    const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId);
    if (!gameInstance) throw new Error('Game instance not found');
    gameInstance.gameInstanceMetadata.updatedOn = new Date();

    // get player from gameInstance:
    const player = gameInstance.isPlayer(user.id);
    switch (body.communicator) {
      case 'pause':
        if (!player) throw new Error('User is not a player in this game instance');
        gameInstance.gameState.pause = (body.data as CommunicatorPauseEvent).pause;
        console.log('pausing game');
        break;
      case 'score':
        if (!player) throw new Error('User is not a player in this game instance');
        // todo
        console.log('updating score');
        break;
      case 'key':
        if (!player) throw new Error('User is not a player in this game instance');
        // todo
        console.log('updating key');
        break;
      default:
        throw new Error('Unknown communicator');
    }
    return true;
  }
}
