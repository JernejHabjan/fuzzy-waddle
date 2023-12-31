import { Injectable } from "@nestjs/common";
import { User } from "@supabase/supabase-js";
import {
  GameInstanceDataDto,
  GameSessionState,
  GameSetupHelpers,
  PlayerAction,
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleAddPlayerDto,
  ProbableWaffleAddSpectatorDto,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGetRoomsDto,
  ProbableWaffleJoinDto,
  ProbableWaffleLevels,
  ProbableWafflePlayer,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerEvent,
  ProbableWafflePlayerLeftDto,
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerType,
  ProbableWaffleRoom,
  ProbableWaffleRoomEvent,
  ProbableWaffleSpectator,
  ProbableWaffleSpectatorEvent,
  ProbableWaffleStartLevelDto,
  RoomAction,
  SpectatorAction
} from "@fuzzy-waddle/api-interfaces";
import { Cron, CronExpression } from "@nestjs/schedule";
import { GameInstanceGateway } from "./game-instance.gateway";
import { GameInstanceServiceInterface } from "./game-instance.service.interface";
import { TextSanitizationService } from "../../../core/content-filters/text-sanitization.service";

@Injectable()
export class GameInstanceService implements GameInstanceServiceInterface {
  constructor(
    private readonly gameInstanceGateway: GameInstanceGateway,
    private textSanitizationService: TextSanitizationService
  ) {}

  private openGameInstances: ProbableWaffleGameInstance[] = [];

  addGameInstance(gameInstance: ProbableWaffleGameInstance): void {
    this.openGameInstances.push(gameInstance);
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "added"));
    console.log("Probable Waffle - game instance added. Open instances: " + this.openGameInstances.length);
  }

  async createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User) {
    if (gameInstanceMetadataData.createdBy !== user.id)
      throw new Error("Probable Waffle - createGameInstance - createdBy must be the same as user id");
    const newGameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: this.sanitizeGameInstanceMetadataData(gameInstanceMetadataData)
    });
    this.addGameInstance(newGameInstance);
    console.log("Probable Waffle - game instance created. Open instances: " + this.openGameInstances.length);
  }

  async stopGameInstance(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    this.openGameInstances = this.openGameInstances.filter(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId !== body.gameInstanceId
    );
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "removed"));
    console.log("Probable Waffle - game instance deleted. Remaining: " + this.openGameInstances.length);
  }

  async startLevel(body: ProbableWaffleStartLevelDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.gameInstanceMetadata.data.sessionState = GameSessionState.EnteringMap;
    console.log("Probable waffle - game instance started" + body.gameInstanceId);
    this.gameInstanceGateway.emitLevelStateChange({
      sessionState: gameInstance.gameInstanceMetadata.data.sessionState,
      gameInstanceId: body.gameInstanceId,
      emittingUserId: user.id
    });
  }

  getPlayerLobbyDefinitionForNewPlayer(gameInstance: ProbableWaffleGameInstance): PlayerLobbyDefinition {
    return new PlayerLobbyDefinition(
      gameInstance.players.length,
      "Player " + (gameInstance.players.length + 1),
      gameInstance.players.length,
      true
    );
  }

  getPlayerColorForNewPlayer(gameInstance: ProbableWaffleGameInstance): string {
    return GameSetupHelpers.getColorForPlayer(gameInstance.players.length, gameInstance.gameMode?.data.maxPlayers);
  }

  async joinRoom(body: ProbableWaffleJoinDto, user: User): Promise<ProbableWaffleGameInstanceData> {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    switch (body.type) {
      case "player":
        const playerDefinition = new PositionPlayerDefinition(
          this.getPlayerLobbyDefinitionForNewPlayer(gameInstance),
          null,
          null,
          ProbableWafflePlayerType.Human,
          this.getPlayerColorForNewPlayer(gameInstance),
          null
        );
        const player = gameInstance.initPlayer(
          {
            scoreProbableWaffle: 0
          } satisfies ProbableWafflePlayerStateData,
          {
            userId: user.id,
            playerDefinition
          } satisfies ProbableWafflePlayerControllerData
        );
        this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(player, body.gameInstanceId, "joined", user));
        console.log("Probable Waffle - Player joined", user.id);
        break;
      case "spectator":
        const spectator = gameInstance.initSpectator({
          userId: user.id
        });
        this.gameInstanceGateway.emitSpectator(this.getSpectatorEvent(spectator, body.gameInstanceId, "joined", user));
        console.log("Probable Waffle - Spectator joined", user.id);
        break;
      default:
        throw new Error("Probable Waffle - Join Room - Unknown join type");
    }

    return gameInstance.data;
  }

  async leaveRoom(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;

    // find if current user is player or spectator
    const player = gameInstance.getPlayer(user.id);
    if (player) {
      gameInstance.removePlayer(user.id);
      console.log("Probable Waffle - Player left", user.id);
      this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(player, body.gameInstanceId, "left", user));
      return;
    }
    const spectator = gameInstance.getSpectator(user.id);
    if (spectator) {
      gameInstance.removeSpectator(user.id);
      console.log("Probable Waffle - Spectator left", user.id);
      this.gameInstanceGateway.emitSpectator(this.getSpectatorEvent(spectator, body.gameInstanceId, "left", user));
      return;
    }

    console.log("Probable Waffle - User left but was not a player or spectator", user.id);
  }

  async getVisibleRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]> {
    const notStarted = this.openGameInstances.filter(
      (gi) => gi.gameInstanceMetadata.data.sessionState === GameSessionState.NotStarted
    );
    const visible = notStarted.filter(
      (gi) => gi.gameInstanceMetadata.data.visibility === ProbableWaffleGameInstanceVisibility.Public
    );
    const notCreatedByUser = visible.filter((gi) => gi.gameInstanceMetadata.data.createdBy !== user.id);
    const filteredByMap = notCreatedByUser.filter(
      (gi) => !gi.gameMode || (body.maps?.includes(gi.gameMode.data.map) ?? true)
    );
    // noinspection UnnecessaryLocalVariableJS
    const gameInstanceToRoom = filteredByMap.map((gameInstance) => this.getGameInstanceToRoom(gameInstance));
    return gameInstanceToRoom;
  }

  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): ProbableWaffleRoom {
    return {
      gameInstanceMetadataData: gameInstance.gameInstanceMetadata.data,
      gameMode: gameInstance.gameMode,
      players: gameInstance.players.map((player) => ({
        controllerData: player.playerController.data
      })),
      spectators: gameInstance.spectators.map((spectator) => spectator.data)
    };
  }

  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): ProbableWaffleRoomEvent {
    return {
      room: this.getGameInstanceToRoom(gameInstance),
      action
    };
  }

  getSpectatorEvent(
    spectator: ProbableWaffleSpectator,
    gameInstanceId: string,
    action: SpectatorAction,
    user: User
  ): ProbableWaffleSpectatorEvent {
    return {
      gameInstanceId,
      action,
      spectator,
      emittingUserId: user.id
    };
  }

  getPlayerEvent(
    player: ProbableWafflePlayer,
    gameInstanceId: string,
    action: PlayerAction,
    user: User
  ): ProbableWafflePlayerEvent {
    return {
      player: {
        controllerData: player.playerController.data,
        stateData: player.playerState.data
      },
      gameInstanceId,
      action,
      emittingUserId: user.id
    };
  }

  /**
   * remove game instances that have been started more than N time ago
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  handleCron() {
    this.openGameInstances = this.openGameInstances.filter((gi) => {
      const minutesAgo = 1000 * 60 * 15; // 15 minutes
      const started = gi.gameInstanceMetadata.data.createdOn;
      const lastUpdated = gi.gameInstanceMetadata.data.updatedOn;
      const now = new Date();
      // is old if started is more than N minutes ago and lastUpdated is null or more than N minutes ago
      const startedMoreThanNMinutesAgo = started.getTime() + minutesAgo < now.getTime();
      const lastUpdatedMoreThanNMinutesAgo = !lastUpdated || lastUpdated.getTime() + minutesAgo < now.getTime();
      const isOld = startedMoreThanNMinutesAgo && lastUpdatedMoreThanNMinutesAgo;
      if (isOld) {
        this.gameInstanceGateway.emitRoom(this.getRoomEvent(gi, "removed"));
        console.log("Probable Waffle - Cron - Game instance removed");
      }
      return !isOld;
    });
  }

  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
    return this.openGameInstances.find(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId === gameInstanceId
    );
  }

  private checkIfPlayerIsCreator(gameInstance: ProbableWaffleGameInstance, user: User) {
    return gameInstance.gameInstanceMetadata.data.createdBy === user.id;
  }

  async changeGameMode(user: User, body: ProbableWaffleChangeGameModeDto): Promise<void> {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    if (!gameInstance.gameMode) {
      throw new Error("Probable Waffle - changeGameMode - gameInstance.gameMode is null");
    }
    gameInstance.gameMode.data = body.gameModeData;
    console.log("Probable Waffle - Game Mode changed on map " + this.getMapName(gameInstance));
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "changed"));
  }

  async openPlayerSlot(body: ProbableWaffleAddPlayerDto, user: User): Promise<void> {
    await this.addPlayer(body, user);
  }

  async playerLeft(body: ProbableWafflePlayerLeftDto, user: User): Promise<void> {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    const playerNumber = body.playerNumber;
    const player = gameInstance.players.find(
      (player) => player.playerController.data.playerDefinition.player.playerNumber === playerNumber
    );
    if (!player) return;
    gameInstance.players = gameInstance.players.filter(
      (player) => player.playerController.data.playerDefinition.player.playerNumber !== playerNumber
    );
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
    this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(player, body.gameInstanceId, "left", user));
  }

  async addPlayer(body: ProbableWaffleAddPlayerDto, user: User): Promise<void> {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    const player = gameInstance.initPlayer(body.player.stateData, body.player.controllerData);
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

    this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(player, body.gameInstanceId, "joined", user));
  }

  async addSpectator(body: ProbableWaffleAddSpectatorDto, user: User): Promise<void> {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    const spectator = gameInstance.initSpectator(body.spectator.data);
    gameInstance.addSpectator(spectator);
    console.log(
      "Probable Waffle - Spectator " + gameInstance.spectators.length + " added on map " + this.getMapName(gameInstance)
    );
    this.gameInstanceGateway.emitSpectator(this.getSpectatorEvent(spectator, body.gameInstanceId, "joined", user));
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
