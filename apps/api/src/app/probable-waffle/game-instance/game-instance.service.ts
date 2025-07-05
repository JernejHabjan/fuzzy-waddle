import { Injectable } from "@nestjs/common";
import { User } from "@supabase/supabase-js";
import {
  DifficultyModifiers,
  MapTuning,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameModeData,
  ProbableWaffleGameStateData
} from "@fuzzy-waddle/api-interfaces";
import { Cron, CronExpression } from "@nestjs/schedule";
import { GameInstanceServiceInterface } from "./game-instance.service.interface";
import { TextSanitizationService } from "../../../core/content-filters/text-sanitization.service";
import { RoomServerService } from "../game-room/room-server.service";
import { GameInstanceHolderService } from "./game-instance-holder.service";

@Injectable()
export class GameInstanceService implements GameInstanceServiceInterface {
  constructor(
    private readonly roomServerService: RoomServerService,
    private readonly gameInstanceHolderService: GameInstanceHolderService,
    private readonly textSanitizationService: TextSanitizationService
  ) {}

  addGameInstance(gameInstance: ProbableWaffleGameInstance, user: User): void {
    this.gameInstanceHolderService.addGameInstance(gameInstance);
    this.roomServerService.roomEvent("added", gameInstance, user);
    console.log(
      "Probable Waffle - Game instance added. Open instances: " +
        this.gameInstanceHolderService.openGameInstances.length
    );
  }

  async createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User) {
    if (gameInstanceMetadataData.createdBy !== user.id)
      throw new Error("Probable Waffle - createGameInstance - createdBy must be the same as user id");
    const newGameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: this.sanitizeGameInstanceMetadataData(gameInstanceMetadataData),
      gameModeData: {
        tieConditions: {
          maximumTimeLimitInMinutes: 60
        },
        winConditions: {
          noEnemyPlayersLeft: true
        },
        loseConditions: {
          allBuildingsMustBeEliminated: true
        },
        mapTuning: { unitCap: 100 } satisfies MapTuning,
        difficultyModifiers: {} satisfies DifficultyModifiers
      } satisfies ProbableWaffleGameModeData,
      gameStateData: {} as ProbableWaffleGameStateData
    });
    this.addGameInstance(newGameInstance, user);

    console.log(
      "Probable Waffle - game instance created. Open instances: " +
        this.gameInstanceHolderService.openGameInstances.length
    );
  }

  stopGameInstance(gameInstanceId: string, user: User) {
    const gameInstance = this.findGameInstance(gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    this.gameInstanceHolderService.removeGameInstance(gameInstanceId);
    this.roomServerService.roomEvent("removed", gameInstance, user);
    console.log(
      "Probable Waffle - game instance deleted. Remaining: " + this.gameInstanceHolderService.openGameInstances.length
    );
  }

  /**
   * remove game instances that have been started more than N time ago
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  handleCron() {
    const toRemove = this.gameInstanceHolderService.openGameInstances.filter((gi) => {
      const minutesAgo = 1000 * 60 * 15; // 15 minutes
      const started = gi.gameInstanceMetadata.data.createdOn;
      const lastUpdated = gi.gameInstanceMetadata.data.updatedOn;
      const now = new Date();
      // is old if started is more than N minutes ago and lastUpdated is null or more than N minutes ago
      const startedMoreThanNMinutesAgo = started.getTime() + minutesAgo < now.getTime();
      const lastUpdatedMoreThanNMinutesAgo = !lastUpdated || lastUpdated.getTime() + minutesAgo < now.getTime();
      const isOld = startedMoreThanNMinutesAgo && lastUpdatedMoreThanNMinutesAgo;
      if (isOld) {
        this.roomServerService.roomEvent("removed", gi, null);
        console.log("Probable Waffle - Cron - Game instance removed");
      }
      return !isOld;
    });
    toRemove.forEach((gi) =>
      this.gameInstanceHolderService.removeGameInstance(gi.gameInstanceMetadata.data.gameInstanceId)
    );
  }

  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
    return this.gameInstanceHolderService.findGameInstance(gameInstanceId);
  }

  private checkIfPlayerIsCreator(gameInstance: ProbableWaffleGameInstance, user: User) {
    return gameInstance.gameInstanceMetadata.data.createdBy === user.id;
  }

  getGameInstanceData(gameInstanceId: string): ProbableWaffleGameInstanceData | null {
    const gameInstance = this.findGameInstance(gameInstanceId);
    if (!gameInstance) return;
    return gameInstance.data;
  }

  private sanitizeGameInstanceMetadataData(
    gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData
  ): ProbableWaffleGameInstanceMetadataData {
    return {
      ...gameInstanceMetadataData,
      name: this.textSanitizationService.cleanBadWords(gameInstanceMetadataData.name)
    };
  }
}
