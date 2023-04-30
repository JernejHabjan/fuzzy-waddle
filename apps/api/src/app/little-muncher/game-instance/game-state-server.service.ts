import { Injectable } from '@nestjs/common';
import { CommunicatorEvent, CommunicatorPauseEvent } from '@fuzzy-waddle/api-interfaces';
import { GameInstanceService } from './game-instance.service';

@Injectable()
export class GameStateServerService {
  constructor(private readonly gameInstanceService: GameInstanceService) {}

  updateGameState(body: CommunicatorEvent<any>): boolean {
    const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId);
    if (!gameInstance) throw new Error('Game instance not found');
    gameInstance.gameInstanceMetadata.updatedOn = new Date();

    switch (body.communicator) {
      case 'pause':
        gameInstance.gameState.pause = (body.data as CommunicatorPauseEvent).pause;
        console.log('pausing game');
        break;
      case 'score':
        // todo
        console.log('updating score');
        break;
      case 'key':
        // todo
        console.log('updating key');
        break;
      default:
        throw new Error('Unknown communicator');
    }
    return true;
  }
}
