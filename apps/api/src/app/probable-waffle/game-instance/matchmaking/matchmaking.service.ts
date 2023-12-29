import { Injectable } from "@nestjs/common";
import {
  DifficultyModifiers,
  FactionType,
  GameSessionState,
  MapTuning,
  PendingMatchmakingGameInstance,
  PositionPlayerDefinition,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameMode,
  ProbableWaffleGameModeData,
  ProbableWaffleLevels,
  ProbableWaffleMapEnum,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerType,
  RequestGameSearchForMatchMakingDto,
  WinConditions
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";
import { Cron, CronExpression } from "@nestjs/schedule";
import { GameInstanceService } from "../game-instance.service";
import { GameInstanceGateway } from "../game-instance.gateway";
import { MatchmakingServiceInterface } from "./matchmaking.service.interface";

@Injectable()
export class MatchmakingService implements MatchmakingServiceInterface {
  private pendingMatchmakingGameInstances: PendingMatchmakingGameInstance[] = [];

  constructor(
    private readonly gameInstanceService: GameInstanceService,
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
        // todo needed? this.gameInstanceGateway.emitRoom(this.getRoomEvent(gi, "removed"));
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

  private promoteGameInstanceToLoaded(gameInstance: ProbableWaffleGameInstance) {
    this.pendingMatchmakingGameInstances = this.pendingMatchmakingGameInstances.filter(
      (gi) =>
        gi.gameInstance.gameInstanceMetadata.data.gameInstanceId !==
        gameInstance.gameInstanceMetadata.data.gameInstanceId
    );
    gameInstance.gameInstanceMetadata.data.sessionState = GameSessionState.EnteringMap;
    this.gameInstanceService.addGameInstance(gameInstance);
    this.gameInstanceGateway.emitGameFound({
      userIds: gameInstance.players.map((p) => p.playerController.data.userId),
      gameInstanceId: gameInstance.gameInstanceMetadata.data.gameInstanceId
    });
    console.log(
      "Probable Waffle - Matchmaking game fully loaded",
      gameInstance.gameInstanceMetadata.data.gameInstanceId
    );
  }

  private async joinGameInstanceForMatchmaking(
    pendingMatchmakingGameInstance: PendingMatchmakingGameInstance,
    matchMakingDto: RequestGameSearchForMatchMakingDto,
    user: User
  ) {
    const gameInstance = pendingMatchmakingGameInstance.gameInstance;
    // join it
    const player = this.getNewPlayer(gameInstance, user.id, matchMakingDto.factionType);
    gameInstance.players.push(player);

    const mapPoolIds = pendingMatchmakingGameInstance.commonMapPoolIds;
    const randomMapId = mapPoolIds[Math.floor(Math.random() * mapPoolIds.length)];
    gameInstance.gameMode = this.getNewGameMode(randomMapId);

    // emit game found event when all players have joined
    const maxPlayers = gameInstance.gameMode.data.maxPlayers;
    if (gameInstance.players.length === maxPlayers) {
      this.promoteGameInstanceToLoaded(gameInstance);
    }
  }
  private createGameInstanceForMatchmaking(matchMakingDto: RequestGameSearchForMatchMakingDto, user: User) {
    // create new one
    const newGameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: {
        createdBy: user.id,
        type: ProbableWaffleGameInstanceType.Matchmaking,
        joinable: true
      }
    });

    const player = this.getNewPlayer(newGameInstance, user.id, matchMakingDto.factionType);
    newGameInstance.players.push(player);
    this.pendingMatchmakingGameInstances.push({
      gameInstance: newGameInstance,
      commonMapPoolIds: matchMakingDto.mapPoolIds
    });
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

  getNewPlayer(gameInstance: ProbableWaffleGameInstance, userId: string, factionType: FactionType | null) {
    const allFactions = Object.values(FactionType);
    const randomFactionType = allFactions[Math.floor(Math.random() * allFactions.length)] as FactionType;

    const playerDefinition = new PositionPlayerDefinition(
      this.gameInstanceService.getPlayerLobbyDefinitionForNewPlayer(gameInstance),
      null,
      factionType ?? randomFactionType,
      ProbableWafflePlayerType.Human,
      this.gameInstanceService.getPlayerColorForNewPlayer(gameInstance),
      null
    );
    const player = gameInstance.initPlayer(
      {
        scoreProbableWaffle: 0
      } satisfies ProbableWafflePlayerStateData,
      {
        userId,
        playerDefinition
      } satisfies ProbableWafflePlayerControllerData
    );
    return player;
  }

  getNewGameMode(mapId: ProbableWaffleMapEnum): ProbableWaffleGameMode {
    const mapData = ProbableWaffleLevels[mapId];
    const gameModeData = {
      map: mapId,
      maxPlayers: mapData.mapInfo.startPositionsOnTile.length,
      difficultyModifiers: new DifficultyModifiers(),
      winConditions: new WinConditions(),
      mapTuning: new MapTuning()
    } satisfies ProbableWaffleGameModeData;
    return new ProbableWaffleGameMode(gameModeData);
  }
}
