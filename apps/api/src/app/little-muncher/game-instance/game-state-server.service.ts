import { Injectable } from '@nestjs/common';
import { CommunicatorEvent, CommunicatorPauseEvent, LittleMuncherPosition } from '@fuzzy-waddle/api-interfaces';
import { GameInstanceService } from './game-instance.service';
import { User } from '@supabase/supabase-js';

@Injectable()
export class GameStateServerService {
  constructor(private readonly gameInstanceService: GameInstanceService) {}

  updateGameState(body: CommunicatorEvent<any>, user: User): boolean {
    const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId);
    if (!gameInstance) {
      console.log('game instance not found');
      return false;
    }
    if (!gameInstance.players.length) {
      console.log('game instance has no players');
      return false;
    }
    gameInstance.gameInstanceMetadata.data.updatedOn = new Date();

    // get player from gameInstance:
    const authUserPlayer = gameInstance.isPlayer(user.id);
    const player = gameInstance.players[0];
    switch (body.communicator) {
      case 'pause':
        if (!authUserPlayer) {
          console.log('User is not a player in this game instance');
          return false;
        }
        gameInstance.gameState.data.pause = (body.data as CommunicatorPauseEvent).pause;
        console.log('updating pause', body.data);
        console.log('pausing game');
        break;
      case 'score':
        if (!authUserPlayer) {
          console.log('User is not a player in this game instance');
          return false;
        }
        // todo
        console.log('updating score');
        break;
      case 'key':
        if (!authUserPlayer) {
          console.log('User is not a player in this game instance');
          return false;
        }
        player.playerState.data.position = body.data as LittleMuncherPosition;
        console.log('updating position', body.data);
        break;
      default:
        throw new Error('Unknown communicator');
    }
    return true;
  }
}
