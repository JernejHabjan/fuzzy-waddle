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

@Injectable()
export class GameInstanceService implements GameInstanceServiceInterface {
  constructor(private readonly gameInstanceGateway: GameInstanceGateway) {}

  private openGameInstances: ProbableWaffleGameInstance[] = [];

  addGameInstance(gameInstance: ProbableWaffleGameInstance) {
    this.openGameInstances.push(gameInstance);
  }

  async createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User) {
    if (gameInstanceMetadataData.createdBy !== user.id)
      throw new Error("Probable Waffle - createGameInstance - createdBy must be the same as user id");
    const newGameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData
    });
    this.openGameInstances.push(newGameInstance);
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(newGameInstance, "added"));
    console.log("Probable Waffle - game instance created", this.openGameInstances.length);
  }

  async stopGameInstance(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    this.openGameInstances = this.openGameInstances.filter(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId !== body.gameInstanceId
    );
    console.log("Probable Waffle - game instance deleted", this.openGameInstances.length);
  }

  async startLevel(body: ProbableWaffleStartLevelDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.gameInstanceMetadata.data.sessionState = GameSessionState.EnteringMap;
    console.log("Probable waffle - game instance started" + body.gameInstanceId);
    this.gameInstanceGateway.emitLevelStateChange({
      sessionState: gameInstance.gameInstanceMetadata.data.sessionState,
      gameInstanceId: body.gameInstanceId
    });
  }

  getPlayerLobbyDefinitionForNewPlayer(gameInstance: ProbableWaffleGameInstance): PlayerLobbyDefinition {
    return new PlayerLobbyDefinition(
      gameInstance.players.length + 1,
      "Player " + (gameInstance.players.length + 1),
      gameInstance.players.length,
      true
    );
  }

  getPlayerColorForNewPlayer(gameInstance: ProbableWaffleGameInstance): string {
    return GameSetupHelpers.getColorForPlayer(gameInstance.players.length, gameInstance.gameMode.data.maxPlayers);
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
            score: 0
          } satisfies ProbableWafflePlayerStateData,
          {
            userId: user.id,
            playerDefinition
          } satisfies ProbableWafflePlayerControllerData
        );
        this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(player, body.gameInstanceId, "joined"));
        console.log("Probable Waffle - Player joined", user.id);
        break;
      case "spectator":
        const spectator = gameInstance.initSpectator({
          userId: user.id
        });
        this.gameInstanceGateway.emitSpectator(this.getSpectatorEvent(spectator, body.gameInstanceId, "joined"));
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
      this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(player, body.gameInstanceId, "left"));
      return;
    }
    const spectator = gameInstance.getSpectator(user.id);
    if (spectator) {
      gameInstance.removeSpectator(user.id);
      console.log("Probable Waffle - Spectator left", user.id);
      this.gameInstanceGateway.emitSpectator(this.getSpectatorEvent(spectator, body.gameInstanceId, "left"));
      return;
    }

    console.log("Probable Waffle - User left but was not a player or spectator", user.id);
  }

  async stopLevel(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.stopLevel();
    console.log("Probable Waffle - Game mode deleted");

    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "removed"));
  }

  async getJoinableRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]> {
    const notStarted = this.openGameInstances.filter(
      (gi) => gi.gameInstanceMetadata.data.sessionState === GameSessionState.NotStarted
    );
    const joinable = notStarted.filter((gi) => gi.gameInstanceMetadata.data.joinable);
    const notCreatedByUser = joinable.filter((gi) => gi.gameInstanceMetadata.data.createdBy !== user.id);
    const filteredByMap = notCreatedByUser.filter((gi) => body.maps?.includes(gi.gameMode.data.map) ?? true);
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
    action: SpectatorAction
  ): ProbableWaffleSpectatorEvent {
    return {
      gameInstanceId,
      action,
      spectator
    };
  }

  getPlayerEvent(
    player: ProbableWafflePlayer,
    gameInstanceId: string,
    action: PlayerAction
  ): ProbableWafflePlayerEvent {
    return {
      player: {
        controllerData: player.playerController.data,
        stateData: player.playerState.data
      },
      gameInstanceId,
      action
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

  async changeGameMode(user: User, body: ProbableWaffleChangeGameModeDto) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.gameMode.data = body.gameModeData;
    console.log("Probable Waffle - Game Mode changed on map " + this.getMapName(gameInstance));
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "changed"));
  }

  async openPlayerSlot(body: ProbableWaffleAddPlayerDto, user: User) {
    await this.addPlayer(body, user);
  }

  async playerLeft(body: ProbableWafflePlayerLeftDto, user: User) {
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
    this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(player, body.gameInstanceId, "left"));
  }

  async addPlayer(body: ProbableWaffleAddPlayerDto, user: User) {
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

    this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(player, body.gameInstanceId, "joined"));
  }

  async addSpectator(body: ProbableWaffleAddSpectatorDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    const spectator = gameInstance.initSpectator(body.spectator.data);
    gameInstance.addSpectator(spectator);
    console.log(
      "Probable Waffle - Spectator " + gameInstance.spectators.length + " added on map " + this.getMapName(gameInstance)
    );
    this.gameInstanceGateway.emitSpectator(this.getSpectatorEvent(spectator, body.gameInstanceId, "joined"));
  }

  private getMapName(gameInstance: ProbableWaffleGameInstance): string {
    return ProbableWaffleLevels[gameInstance.gameMode.data.map].name;
  }

  async getGameInstance(gameInstanceId: string, user: User) {
    const gameInstance = this.findGameInstance(gameInstanceId);
    if (!gameInstance) return;
    return gameInstance.data;
  }
}
