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
    if (!gameInstance.players.length) throw new Error('No players in game instance');
    gameInstance.gameInstanceMetadata.data.updatedOn = new Date();

    // get player from gameInstance:
    const authUserPlayer = gameInstance.isPlayer(user.id);
    const player = gameInstance.players[0];
    switch (body.communicator) {
      case 'pause':
        if (!authUserPlayer) throw new Error('User is not a player in this game instance');
        gameInstance.gameState.data.pause = (body.data as CommunicatorPauseEvent).pause;
        console.log('pausing game');
        break;
      case 'score':
        if (!authUserPlayer) throw new Error('User is not a player in this game instance');
        // todo
        console.log('updating score');
        break;
      case 'key':
        if (!authUserPlayer) throw new Error('User is not a player in this game instance');
        player.playerState.data.position = body.data.position;
        break;
      default:
        throw new Error('Unknown communicator');
    }
    return true;
  }
}
