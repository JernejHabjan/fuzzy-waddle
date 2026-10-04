import { Injectable } from "@nestjs/common";
import type { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";
import { ProbableWaffleGameInstance } from "@fuzzy-waddle/probable-waffle-protocol";
import { type GameInstanceHolderServiceInterface } from "./game-instance-holder.service.interface";

@Injectable()
export class GameInstanceHolderService implements GameInstanceHolderServiceInterface {
  private _openGameInstances: ProbableWaffleGameInstance[] = [];

  get openGameInstances(): ProbableWaffleGameInstance[] {
    return this._openGameInstances;
  }

  removeGameInstance(gameInstanceId: GameInstanceId) {
    this._openGameInstances = this.openGameInstances.filter(
      (gi) => gi.gameInstanceMetadata.data.gameInstanceId !== gameInstanceId
    );
  }

  addGameInstance(gameInstance: ProbableWaffleGameInstance) {
    this._openGameInstances.push(gameInstance);
  }

  findGameInstance(gameInstanceId: GameInstanceId): ProbableWaffleGameInstance | undefined {
    return this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId === gameInstanceId
    );
  }

  getOpenGameInstanceIds(): GameInstanceId[] {
    return this.openGameInstances
      .map((gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId)
      .filter((gameInstanceId): gameInstanceId is GameInstanceId => !!gameInstanceId);
  }
}
