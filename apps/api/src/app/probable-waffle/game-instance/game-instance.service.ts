import { Injectable } from "@nestjs/common";
import { User } from "@supabase/supabase-js";
import {
  GameInstanceDataDto,
  GameSessionState,
  PlayerAction,
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleAddPlayerDto,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceDataDto,
  ProbableWaffleGetRoomsDto,
  ProbableWaffleJoinDto,
  ProbableWafflePlayer,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerEvent,
  ProbableWafflePlayerLeftDto,
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerType,
  ProbableWaffleRoom,
  ProbableWaffleRoomEvent,
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

  openGameInstances: ProbableWaffleGameInstance[] = [];

  async createGameInstance(body: ProbableWaffleGameInstanceDataDto, user: User) {
    const newGameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: { gameInstanceId: body.gameInstanceId, createdBy: user.id, joinable: body.joinable },
      players: [{ userId: user.id }]
    });
    this.openGameInstances.push(newGameInstance);
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(newGameInstance, "added"));
    console.log("Probable Waffle - game instance created on server", this.openGameInstances.length);
  }

  async stopGameInstance(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    this.openGameInstances = this.openGameInstances.filter(
      (gameInstance) => gameInstance.gameInstanceMetadata.data.gameInstanceId !== body.gameInstanceId
    );
    console.log("Probable Waffle - game instance deleted on server", this.openGameInstances.length);
  }

  async startLevel(body: ProbableWaffleStartLevelDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.gameInstanceMetadata.data.sessionState = GameSessionState.InProgress;
    console.log("Probable waffle - game instance started on server" + body.gameInstanceId);
    this.gameInstanceGateway.emitLevelStateChange({
      sessionState: gameInstance.gameInstanceMetadata.data.sessionState,
      gameInstanceId: body.gameInstanceId
    });
  }

  async joinRoom(body: ProbableWaffleJoinDto, user: User): Promise<ProbableWaffleGameInstanceData> {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    switch (body.type) {
      case "player":
        const playerDefinition = new PositionPlayerDefinition( // todo
          new PlayerLobbyDefinition(1, null, null, false),
          null,
          null,
          ProbableWafflePlayerType.Human,
          "ff00ff",
          null
        );
        const player = gameInstance.initPlayer(
          user.id,
          {
            score: 0
          } satisfies ProbableWafflePlayerStateData,
          {
            playerDefinition
          } satisfies ProbableWafflePlayerControllerData
        );
        this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(user, player, body.gameInstanceId, "joined"));
        break;
      case "spectator":
        gameInstance.initSpectator({
          userId: user.id
        });
        this.gameInstanceGateway.emitSpectator(this.getSpectatorEvent(user, body.gameInstanceId, "joined"));
        break;
      default:
        throw new Error("Probable Waffle - Join Room - Unknown join type");
    }

    return gameInstance.data;
  }

  async leaveRoom(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    gameInstance.removeSpectator(user.id);
    console.log("Probable Waffle - Spectator left", user.id);
    this.gameInstanceGateway.emitSpectator(this.getSpectatorEvent(user, body.gameInstanceId, "left"));
  }

  async stopLevel(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    gameInstance.stopLevel();
    console.log("Probable Waffle - Game mode deleted on server");

    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "removed"));
  }

  async getJoinableRooms(user: User, body: ProbableWaffleGetRoomsDto): Promise<ProbableWaffleRoom[]> {
    return this.openGameInstances
      .filter(
        (gi) =>
          (gi.gameInstanceMetadata.data.sessionState === GameSessionState.NotStarted &&
            gi.gameInstanceMetadata.data.createdBy !== user.id &&
            gi.gameInstanceMetadata.data.joinable &&
            body.maps === null) ||
          body.maps?.includes(gi.gameMode.data.map)
      )
      .map((gameInstance) => this.getGameInstanceToRoom(gameInstance));
  }

  getGameInstanceToRoom(gameInstance: ProbableWaffleGameInstance): ProbableWaffleRoom {
    return {
      gameInstanceMetadataData: gameInstance.gameInstanceMetadata.data,
      gameMode: gameInstance.gameMode,
      players: gameInstance.players.map((player) => ({ userId: player.userId })),
      spectators: gameInstance.spectators.map((spectator) => ({ userId: spectator.data.userId }))
    };
  }

  getRoomEvent(gameInstance: ProbableWaffleGameInstance, action: RoomAction): ProbableWaffleRoomEvent {
    return {
      room: this.getGameInstanceToRoom(gameInstance),
      action
    };
  }

  getSpectatorEvent(user: User, gameInstanceId: string, action: SpectatorAction): ProbableWaffleSpectatorEvent {
    return {
      user_id: user.id,
      gameInstanceId,
      action
    };
  }

  getPlayerEvent(
    user: User,
    player: ProbableWafflePlayer,
    gameInstanceId: string,
    action: PlayerAction
  ): ProbableWafflePlayerEvent {
    return {
      user_id: user.id,
      player,
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
    console.log("Probable Waffle - game mode changed on server");
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "changed"));
  }

  async openPlayerSlot(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    // todo gameInstance.players.push({ userId: null });
    console.log("Probable Waffle - player slot opened on server");
    this.gameInstanceGateway.emitRoom(this.getRoomEvent(gameInstance, "changed")); // todo
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
    console.log("Probable Waffle - player left on server");
    this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(user, player, body.gameInstanceId, "left"));
  }

  async addPlayer(body: ProbableWaffleAddPlayerDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    if (!this.checkIfPlayerIsCreator(gameInstance, user)) return;
    const playerDefinition = body.playerDefinition;

    const player = gameInstance.initPlayer(
      user.id,
      {
        score: 0
      } satisfies ProbableWafflePlayerStateData,
      {
        playerDefinition
      } satisfies ProbableWafflePlayerControllerData
    );
    console.log("Probable Waffle - player added on server");
    this.gameInstanceGateway.emitPlayer(this.getPlayerEvent(user, player, body.gameInstanceId, "joined"));
  }

  async addSpectator(body: GameInstanceDataDto, user: User) {
    const gameInstance = this.findGameInstance(body.gameInstanceId);
    if (!gameInstance) return;
    gameInstance.initSpectator({
      userId: user.id
    });
  }
}
