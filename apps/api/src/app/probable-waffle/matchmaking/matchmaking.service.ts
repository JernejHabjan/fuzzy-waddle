import { Injectable } from "@nestjs/common";
import {
  DifficultyModifiers,
  FactionType,
  GameSessionState,
  GameSetupHelpers,
  MapTuning,
  PendingMatchmakingGameInstance,
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameMode,
  ProbableWaffleGameModeData,
  ProbableWaffleGameStateData,
  ProbableWaffleLevels,
  ProbableWaffleMapEnum,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerType,
  RequestGameSearchForMatchMakingDto,
  WinConditions
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";
import { Cron, CronExpression } from "@nestjs/schedule";
import { MatchmakingServiceInterface } from "./matchmaking.service.interface";
import { GameInstanceService } from "../game-instance/game-instance.service";
import { RoomServerService } from "../game-room/room-server.service";
import { GameInstanceGateway } from "../game-instance/game-instance.gateway";

@Injectable()
export class MatchmakingService implements MatchmakingServiceInterface {
  private pendingMatchmakingGameInstances: PendingMatchmakingGameInstance[] = [];

  constructor(
    private readonly gameInstanceService: GameInstanceService,
    private readonly roomServerService: RoomServerService,
    private readonly gameInstanceGateway: GameInstanceGateway
  ) {}
  /**
   * remove game instances that have been started more than N time ago
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  handleCron() {
    this.pendingMatchmakingGameInstances = this.pendingMatchmakingGameInstances.filter((gi) => {
      const minutesAgo = 1000 * 60 * 15; // 15 minutes
      const started = gi.gameInstance.gameInstanceMetadata.data.createdOn;
      const lastUpdated = gi.gameInstance.gameInstanceMetadata.data.updatedOn;
      const now = new Date();
      // is old if started is more than N minutes ago and lastUpdated is null or more than N minutes ago
      const startedMoreThanNMinutesAgo = started.getTime() + minutesAgo < now.getTime();
      const lastUpdatedMoreThanNMinutesAgo = !lastUpdated || lastUpdated.getTime() + minutesAgo < now.getTime();
      const isOld = startedMoreThanNMinutesAgo && lastUpdatedMoreThanNMinutesAgo;
      if (isOld) {
        this.roomServerService.roomEvent("removed", gi.gameInstance, null);
        console.log("Probable Waffle - Cron - Pending matchmaking instance removed");
      }
      return !isOld;
    });
  }

  async requestGameSearchForMatchMaking(matchMakingDto: RequestGameSearchForMatchMakingDto, user: User): Promise<void> {
    const pendingMatchmakingGameInstance = this.findGameInstanceForMatchMaking(matchMakingDto);
    if (pendingMatchmakingGameInstance) {
      await this.joinGameInstanceForMatchmaking(pendingMatchmakingGameInstance, matchMakingDto, user);
      return;
    } else {
      this.createGameInstanceForMatchmaking(matchMakingDto, user);
    }
  }

  private promoteGameInstanceToLoaded(gameInstance: ProbableWaffleGameInstance, user: User) {
    const gameInstanceId = gameInstance.gameInstanceMetadata.data.gameInstanceId;
    this.pendingMatchmakingGameInstances = this.pendingMatchmakingGameInstances.filter(
      (gi) =>
        gi.gameInstance.gameInstanceMetadata.data.gameInstanceId !==
        gameInstance.gameInstanceMetadata.data.gameInstanceId
    );
    gameInstance.gameInstanceMetadata.data.sessionState = GameSessionState.Starting;
    this.gameInstanceGateway.emitGameFound({
      userIds: gameInstance.players.map((p) => p.playerController.data.userId),
      gameInstanceId
    });
    this.roomServerService.roomEvent("game_instance_metadata", gameInstance, user);
    console.log("Probable Waffle - Matchmaking game fully loaded", gameInstanceId);
  }

  private async joinGameInstanceForMatchmaking(
    pendingMatchmakingGameInstance: PendingMatchmakingGameInstance,
    matchMakingDto: RequestGameSearchForMatchMakingDto,
    user: User
  ) {
    const gameInstance = pendingMatchmakingGameInstance.gameInstance;
    // PLAYER:
    const player = this.getNewPlayer(gameInstance, user.id, matchMakingDto.factionType);
    gameInstance.addPlayer(player);
    this.roomServerService.roomEvent("player.joined", gameInstance, user);

    // GAME MODE
    const mapPoolIds = pendingMatchmakingGameInstance.commonMapPoolIds;
    const randomMapId = mapPoolIds[Math.floor(Math.random() * mapPoolIds.length)];
    gameInstance.gameMode = this.getNewMatchmakingGameMode(randomMapId);
    this.roomServerService.roomEvent("game_mode", gameInstance, user);

    // emit game found event when all players have joined
    const maxPlayers = ProbableWaffleLevels[randomMapId].mapInfo.startPositionsOnTile.length;
    if (gameInstance.players.length === maxPlayers) {
      // GAME METADATA
      this.promoteGameInstanceToLoaded(gameInstance, user);
    }
  }
  private createGameInstanceForMatchmaking(matchMakingDto: RequestGameSearchForMatchMakingDto, user: User) {
    // create new one
    const newGameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: {
        name: "Matchmaking",
        createdBy: user.id,
        type: ProbableWaffleGameInstanceType.Matchmaking,
        visibility: ProbableWaffleGameInstanceVisibility.Public
      },
      gameModeData: {
        winConditions: {} satisfies WinConditions,
        mapTuning: {} satisfies MapTuning,
        difficultyModifiers: {} satisfies DifficultyModifiers
      } satisfies ProbableWaffleGameModeData,
      gameStateData: {} as ProbableWaffleGameStateData
    });

    const player = this.getNewPlayer(newGameInstance, user.id, matchMakingDto.factionType);
    newGameInstance.addPlayer(player);

    this.pendingMatchmakingGameInstances.push({
      gameInstance: newGameInstance,
      commonMapPoolIds: matchMakingDto.mapPoolIds
    });
    this.gameInstanceService.addGameInstance(newGameInstance, user);

    console.log("Probable Waffle - Game instance created for matchmaking", this.pendingMatchmakingGameInstances.length);
  }

  private findGameInstanceForMatchMaking(
    matchMakingDto: RequestGameSearchForMatchMakingDto
  ): PendingMatchmakingGameInstance | null {
    const availableMatchmakingGameInstances = this.pendingMatchmakingGameInstances.filter(
      (gi) =>
        gi.gameInstance.gameInstanceMetadata.data.sessionState === GameSessionState.NotStarted &&
        gi.gameInstance.gameInstanceMetadata.data.type === ProbableWaffleGameInstanceType.Matchmaking
    );

    // find game instance that has at least 1 map in common
    // noinspection UnnecessaryLocalVariableJS
    const foundGameInstanceWithCommonMap = availableMatchmakingGameInstances.find((gi) => {
      const mapPoolIds = gi.commonMapPoolIds;
      // noinspection UnnecessaryLocalVariableJS
      const hasCommonMap = matchMakingDto.mapPoolIds.some((mapId) => mapPoolIds.includes(mapId));
      return hasCommonMap;
    });

    // if found, then remove commonMapPoolIds that are not in matchMakingDto.mapPoolIds
    if (foundGameInstanceWithCommonMap) {
      foundGameInstanceWithCommonMap.commonMapPoolIds = foundGameInstanceWithCommonMap.commonMapPoolIds.filter(
        (mapId) => matchMakingDto.mapPoolIds.includes(mapId)
      );
    }

    return foundGameInstanceWithCommonMap ?? null;
  }

  private getNewPlayer(gameInstance: ProbableWaffleGameInstance, userId: string, factionType: FactionType | null) {
    const allFactions = Object.values(FactionType);
    const randomFactionType = allFactions[Math.floor(Math.random() * allFactions.length)] as FactionType;

    const playerDefinition = {
      player: {
        playerNumber: gameInstance.players.length,
        playerName: "Player " + (gameInstance.players.length + 1),
        playerPosition: gameInstance.players.length,
        joined: true
      } satisfies PlayerLobbyDefinition, // TODO THIS IS DUPLICATED EVERYWHERE
      factionType: factionType ?? randomFactionType,
      playerType: ProbableWafflePlayerType.Human
    } satisfies PositionPlayerDefinition;
    // noinspection UnnecessaryLocalVariableJS
    const player = gameInstance.initPlayer({
      userId,
      playerDefinition
    } satisfies ProbableWafflePlayerControllerData);
    return player;
  }

  private getNewMatchmakingGameMode(mapId: ProbableWaffleMapEnum): ProbableWaffleGameMode {
    const gameModeData = {
      map: mapId,
      difficultyModifiers: {} satisfies DifficultyModifiers,
      winConditions: {
        timeLimit: 60
      } satisfies WinConditions,
      mapTuning: {
        unitCap: 20
      } satisfies MapTuning
    } satisfies ProbableWaffleGameModeData;
    return new ProbableWaffleGameMode(gameModeData);
  }

  async stopRequestGameSearchForMatchmaking(user: User): Promise<void> {
    // remove self as player from pending matchmaking game instances
    // if game instance has no players left, then remove it
    const pendingMatchMakingGameInstance = this.pendingMatchmakingGameInstances.find((gi) =>
      gi.gameInstance.players.some((p) => p.playerController.data.userId === user.id)
    );
    if (!pendingMatchMakingGameInstance) return;
    const gameInstanceId = pendingMatchMakingGameInstance.gameInstance.gameInstanceMetadata.data.gameInstanceId;
    const player = pendingMatchMakingGameInstance.gameInstance.players.find(
      (p) => p.playerController.data.userId === user.id
    );
    if (!player) return;

    this.roomServerService.roomEvent("player.left", pendingMatchMakingGameInstance.gameInstance, user);
    pendingMatchMakingGameInstance.gameInstance.players = pendingMatchMakingGameInstance.gameInstance.players.filter(
      (p) => p.playerController.data.userId !== user.id
    );
    console.log("Probable Waffle - Player left pending matchmaking instance", user.id);

    if (pendingMatchMakingGameInstance.gameInstance.players.length === 0) {
      this.removePendingMatchmakingGameInstance(gameInstanceId);
      this.gameInstanceService.stopGameInstance(gameInstanceId, user);
    }
  }

  private removePendingMatchmakingGameInstance(gameInstanceId: string) {
    this.pendingMatchmakingGameInstances = this.pendingMatchmakingGameInstances.filter(
      (gi) => gi.gameInstance.gameInstanceMetadata.data.gameInstanceId !== gameInstanceId
    );
  }
}
