import { ForbiddenException, Injectable } from "@nestjs/common";
import { type User } from "@supabase/supabase-js";
import {
  type CommunicatorEvent,
  type DifficultyModifiers,
  GameInstanceId,
  type MapTuning,
  ProbableWaffleCommunicators,
  type ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceVisibility,
  type ProbableWafflePlayerDataChangeEvent,
  type ProbableWaffleGameInstanceMetadataData,
  type ProbableWaffleGameModeData,
  type ProbableWaffleGameStateData,
  ProbableWafflePlayerType,
  type UserId
} from "@fuzzy-waddle/api-interfaces";
import { Cron, CronExpression } from "@nestjs/schedule";
import { type GameInstanceServiceInterface } from "./game-instance.service.interface";
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
      "Ashes of the Ancients - Game instance added. Open instances: " +
        this.gameInstanceHolderService.openGameInstances.length
    );
  }

  async createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User) {
    if (gameInstanceMetadataData.createdBy !== user.id)
      throw new Error("Ashes of the Ancients - createGameInstance - createdBy must be the same as user id");
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
      "Ashes of the Ancients - game instance created. Open instances: " +
        this.gameInstanceHolderService.openGameInstances.length
    );
  }

  stopGameInstance(gameInstanceId: GameInstanceId, user: User) {
    const gameInstance = this.findGameInstance(gameInstanceId);
    if (!gameInstance) return;
    if (!gameInstance.isHost(user.id)) return;
    this.forceStopGameInstance(gameInstanceId, user);
  }

  forceStopGameInstance(gameInstanceId: GameInstanceId, user: User | null = null) {
    const gameInstance = this.findGameInstance(gameInstanceId);
    if (!gameInstance) return;
    this.gameInstanceHolderService.removeGameInstance(gameInstanceId);
    this.roomServerService.roomEvent("removed", gameInstance, user);
    console.log(
      "Ashes of the Ancients - game instance deleted. Remaining: " +
        this.gameInstanceHolderService.openGameInstances.length
    );
  }

  /**
   * remove game instances that have been started more than N time ago
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  handleCron() {
    const oldGameInstances = this.gameInstanceHolderService.openGameInstances.filter((gi) => {
      const minutesAgo = 1000 * 60 * 15; // 15 minutes
      const started = this.toDateOrNull(gi.gameInstanceMetadata.data.createdOn);
      const lastUpdated = this.toDateOrNull(gi.gameInstanceMetadata.data.updatedOn);
      const now = new Date();
      // is old if started is more than N minutes ago and lastUpdated is null or more than N minutes ago
      if (!started) {
        return false;
      }
      const startedMoreThanNMinutesAgo = started.getTime() + minutesAgo < now.getTime();
      const lastUpdatedMoreThanNMinutesAgo = !lastUpdated || lastUpdated.getTime() + minutesAgo < now.getTime();
      const isOld = startedMoreThanNMinutesAgo && lastUpdatedMoreThanNMinutesAgo;
      if (isOld) {
        this.roomServerService.roomEvent("removed", gi, null);
        console.log("Ashes of the Ancients - Cron - Game instance removed");
      }
      return isOld;
    });
    oldGameInstances.forEach((gi) =>
      this.gameInstanceHolderService.removeGameInstance(gi.gameInstanceMetadata.data.gameInstanceId!)
    );
  }

  findGameInstance(gameInstanceId: GameInstanceId): ProbableWaffleGameInstance | undefined {
    return this.gameInstanceHolderService.findGameInstance(gameInstanceId);
  }

  getOpenGameInstanceIds(): GameInstanceId[] {
    return this.gameInstanceHolderService.getOpenGameInstanceIds();
  }

  getGameInstanceData(gameInstanceId: GameInstanceId): ProbableWaffleGameInstanceData | null {
    const gameInstance = this.findGameInstance(gameInstanceId);
    if (!gameInstance) return null;
    return gameInstance.data;
  }

electReplacementHost(
  gameInstanceId: GameInstanceId,
  previousHostUserId: UserId,
  isUserDisconnected: (userId: UserId, gameInstanceId: GameInstanceId) => boolean
): { currentHostUserId: UserId; currentHostPlayerNumber: number } | null {
  const gameInstance = this.findGameInstance(gameInstanceId);
  if (!gameInstance) {
    return null;
  }

  const nextHost = gameInstance.players
    .filter(
      (player) =>
        player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human &&
        player.playerController.data.userId !== null &&
        player.playerController.data.userId !== previousHostUserId &&
        player.playerNumber !== undefined &&
        !isUserDisconnected(player.playerController.data.userId!, gameInstanceId)
    )
    .sort((a, b) => a.playerNumber! - b.playerNumber!)[0];

  if (!nextHost?.playerController.data.userId || nextHost.playerNumber === undefined) {
    return null;
  }

  gameInstance.gameInstanceMetadata.data.currentHostUserId = nextHost.playerController.data.userId;
  gameInstance.gameInstanceMetadata.data.updatedOn = new Date();

  return {
    currentHostUserId: nextHost.playerController.data.userId,
    currentHostPlayerNumber: nextHost.playerNumber
  };
}

getGameInstanceDataForUser(gameInstanceId: GameInstanceId, user: User): ProbableWaffleGameInstanceData | null {
  const gameInstance = this.findGameInstance(gameInstanceId);
  if (!gameInstance) return null;
  this.ensureCanAccessGameInstance(gameInstance, user);
  return gameInstance.data;
}

/**
 * Public lobbies can be observed by any authenticated user. Private lobbies
 * stay visible only to the host, current players, and current spectators.
 */
ensureCanAccessGameInstance(gameInstance: ProbableWaffleGameInstance, user: User): void {
  if (
    gameInstance.gameInstanceMetadata.data.visibility === ProbableWaffleGameInstanceVisibility.Public ||
    gameInstance.isHost(user.id) ||
    gameInstance.isPlayer(user.id) ||
    gameInstance.isSpectator(user.id)
  ) {
    return;
  }

  throw new ForbiddenException("Game instance access denied");
}

ensureCanJoinGameRoom(gameInstanceId: GameInstanceId, user: User): void {
  const gameInstance = this.requireGameInstance(gameInstanceId);
  this.ensureCanAccessGameInstance(gameInstance, user);
}

/**
 * Mutations are intentionally narrower than reads:
 * hosts manage lobby metadata, players manage active state, and join/leave
 * events can only target the authenticated caller.
 *
 * This auth gate runs before the deeper multiplayer validators. It must allow
 * authoritative lockstep transport events through to those validators, or the
 * gateway can reject a valid command relay before sequence/ownership checks run.
 */
ensureCanMutateGameInstance(body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>, user: User): void {
  const gameInstance = this.requireGameInstance(body.gameInstanceId!);

  switch (body.communicator) {
    case "gameInstanceMetadataDataChange":
      if (!gameInstance.isHost(user.id)) {
        throw new ForbiddenException("Only the host can update game metadata");
      }
      return;
    case "gameModeDataChange":
    case "gameStateDataChange":
    case ProbableWaffleCommunicators.GameCommand:
    case ProbableWaffleCommunicators.StateHash:
    case ProbableWaffleCommunicators.SnapshotRequest:
    case ProbableWaffleCommunicators.SnapshotResponse:
    case ProbableWaffleCommunicators.DesyncAlert:
    case ProbableWaffleCommunicators.PauseChanged:
      if (!gameInstance.isPlayer(user.id)) {
        throw new ForbiddenException("Only players can update active game state");
      }
      return;
    case "playerDataChange":
      this.ensureCanMutatePlayerData(gameInstance, body.payload as ProbableWafflePlayerDataChangeEvent, user);
      return;
    case "spectatorDataChange":
      this.ensureUserOwnsTarget(body.payload.data?.userId ?? null, user.id, "Spectator access denied");
      return;
    default:
      throw new ForbiddenException("Game instance mutation denied");
  }
}
  private requireGameInstance(gameInstanceId: GameInstanceId): ProbableWaffleGameInstance {
    const gameInstance = this.findGameInstance(gameInstanceId);
    if (!gameInstance) {
      throw new ForbiddenException("Game instance access denied");
    }

    return gameInstance;
  }

  private ensureCanMutatePlayerData(
    gameInstance: ProbableWaffleGameInstance,
    payload: ProbableWafflePlayerDataChangeEvent,
    user: User
  ): void {
    if (gameInstance.isHost(user.id)) {
      return;
    }

    switch (payload.property) {
      case "joined":
      case "joinedFromNetwork":
      case "left":
        this.ensureUserOwnsTarget(payload.data.playerControllerData?.userId ?? null, user.id, "Player access denied");
        return;
      default:
        // playerNumber-based events can target any slot, so non-host callers must
        // also own the addressed player and not just "be a player somewhere".
        if (!gameInstance.isPlayer(user.id)) {
          throw new ForbiddenException("Only players can update their game state");
        }

        const targetPlayerNumber = payload.data.playerNumber;
        if (targetPlayerNumber == null) {
          throw new ForbiddenException("Player mutation target missing");
        }

        const targetPlayer = gameInstance.getPlayerByNumber(targetPlayerNumber);
        if (!targetPlayer) {
          throw new ForbiddenException("Player access denied");
        }

        this.ensureUserOwnsTarget(targetPlayer.playerController.data.userId ?? null, user.id, "Player access denied");
        return;
    }
  }

  private ensureUserOwnsTarget(targetUserId: string | null, currentUserId: string, message: string): void {
    if (targetUserId === currentUserId) {
      return;
    }

    throw new ForbiddenException(message);
  }

  private sanitizeGameInstanceMetadataData(
    gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData
  ): ProbableWaffleGameInstanceMetadataData {
    return {
      ...gameInstanceMetadataData,
      currentHostUserId: gameInstanceMetadataData.currentHostUserId ?? gameInstanceMetadataData.createdBy,
      name: this.textSanitizationService.cleanBadWords(gameInstanceMetadataData.name)
    };
  }

  private toDateOrNull(value: Date | string | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
