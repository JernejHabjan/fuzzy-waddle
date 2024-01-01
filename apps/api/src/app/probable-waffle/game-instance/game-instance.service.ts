import { Injectable } from "@nestjs/common";
import { User } from "@supabase/supabase-js";
import {
  GameInstanceDataDto,
  GameSessionState,
  ProbableWaffleAddPlayerDto,
  ProbableWaffleAddSpectatorDto,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleLevels,
  ProbableWafflePlayerLeftDto,
  ProbableWafflePlayerType,
  ProbableWaffleStartLevelDto
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
      gameInstanceMetadataData: this.sanitizeGameInstanceMetadataData(gameInstanceMetadataData)
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

  async startLevel(body: ProbableWaffleStartLevelDto, user: User) {
    // TODO REMOVE THIS
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.gameInstanceMetadata.data.sessionState = GameSessionState.Starting;

    this.roomServerService.roomEvent("game_instance_metadata", gameInstance, user);
    console.log("Probable waffle - game instance started" + body.gameInstanceId);
  }

  async leaveRoom(body: GameInstanceDataDto, user: User) {
    // todo remove this
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;

    // find if current user is player or spectator
    const player = gameInstance.getPlayer(user.id);
    if (player) {
      gameInstance.removePlayerByPlayer(player);
      console.log("Probable Waffle - Player left", user.id);
      this.roomServerService.roomEvent("player.left", gameInstance, user);
      return;
    }
    const spectator = gameInstance.getSpectator(user.id);
    if (spectator) {
      gameInstance.removeSpectator(user.id);
      console.log("Probable Waffle - Spectator left", user.id);
      this.roomServerService.roomEvent("spectator.left", gameInstance, user);
      return;
    }

    console.log("Probable Waffle - User left but was not a player or spectator", user.id);
  }

  /**
   * remove game instances that have been started more than N time ago
   */
  @Cron(CronExpression.EVERY_2_HOURS)
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

  async changeGameMode(user: User, body: ProbableWaffleChangeGameModeDto): Promise<void> {
    // TODO REMOVE
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    if (!gameInstance.gameMode) {
      throw new Error("Probable Waffle - changeGameMode - gameInstance.gameMode is null");
    }
    gameInstance.gameMode.data = body.gameModeData;
    console.log("Probable Waffle - Game Mode changed on map " + this.getMapName(gameInstance));
    this.roomServerService.roomEvent("game_mode", gameInstance, user);
  }

  async openPlayerSlot(body: ProbableWaffleAddPlayerDto, user: User): Promise<void> {
    // TODO REMOVE
    await this.addPlayer(body, user);
  }

  async playerLeft(body: ProbableWafflePlayerLeftDto, user: User): Promise<void> {
    // todo remove
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    const player = gameInstance.getPlayerByNumber(body.playerNumber);
    if (!player) return;
    gameInstance.removePlayerByData(player.playerController.data);
    // check if player is empty mp slot
    const openSlot = player.playerController.data.playerDefinition.playerType === ProbableWafflePlayerType.NetworkOpen;
    if (openSlot) {
      console.log(
        "Probable Waffle - Closed open slot " +
          player.playerController.data.playerDefinition.player.playerPosition +
          " added on map " +
          this.getMapName(gameInstance)
      );
    } else {
      console.log(
        "Probable Waffle - Player " + gameInstance.players.length + " left from map " + this.getMapName(gameInstance)
      );
    }
    this.roomServerService.roomEvent("player.left", gameInstance, user);
  }

  async addPlayer(body: ProbableWaffleAddPlayerDto, user: User): Promise<void> {
    // todo remove
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    const player = gameInstance.initPlayer(body.player.controllerData, body.player.stateData);
    gameInstance.addPlayer(player);

    // check if player is empty mp slot
    const openSlot = player.playerController.data.playerDefinition.playerType === ProbableWafflePlayerType.NetworkOpen;
    if (openSlot) {
      console.log(
        "Probable Waffle - New open slot " +
          player.playerController.data.playerDefinition.player.playerPosition +
          " added on map " +
          this.getMapName(gameInstance)
      );
    } else {
      console.log(
        "Probable Waffle - Player " + gameInstance.players.length + " added on map " + this.getMapName(gameInstance)
      );
    }

    this.roomServerService.roomEvent("player.joined", gameInstance, user);
  }

  async addSpectator(body: ProbableWaffleAddSpectatorDto, user: User): Promise<void> {
    // todo remove
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    const spectator = gameInstance.initSpectator(body.spectator.data);
    gameInstance.addSpectator(spectator);
    console.log(
      "Probable Waffle - Spectator " + gameInstance.spectators.length + " added on map " + this.getMapName(gameInstance)
    );
    this.roomServerService.roomEvent("spectator.joined", gameInstance, user);
  }

  private getMapName(gameInstance: ProbableWaffleGameInstance): string | null {
    if (!gameInstance.gameMode?.data.map) return null;
    return ProbableWaffleLevels[gameInstance.gameMode.data.map].name;
  }

  async getGameInstance(gameInstanceId: string, user: User): Promise<ProbableWaffleGameInstanceData | null> {
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
