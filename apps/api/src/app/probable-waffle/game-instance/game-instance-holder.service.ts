import { Injectable } from "@nestjs/common";
import { ProbableWaffleGameInstance } from "@fuzzy-waddle/api-interfaces";

@Injectable()
export class GameInstanceHolderService {
  private _openGameInstances: ProbableWaffleGameInstance[] = [];

  get openGameInstances(): ProbableWaffleGameInstance[] {
    return this._openGameInstances;
  }

  removeGameInstance(gameInstanceId: string) {
    this._openGameInstances = this.openGameInstances.filter(
      (gi) => gi.gameInstanceMetadata.data.gameInstanceId !== gameInstanceId
    );
  }

  addGameInstance(gameInstance: ProbableWaffleGameInstance) {
    this._openGameInstances.push(gameInstance);
  }

  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
    return this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId === gameInstanceId
    );
  }
}
