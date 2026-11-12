import { Injectable } from "@angular/core";
import { filter, firstValueFrom, Observable } from "rxjs";
import { environment } from "@fuzzy-waddle/environments/environment";
import {
  createPlayerLobbyDefinition,
  GameSetupHelpers,
  getRandomFactionType,
  type PlayerLobbyDefinition,
  type PositionPlayerDefinition,
  ProbableWaffleAiDifficulty,
  type ProbableWaffleDataChangeEventProperty,
  type ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceEvent,
  type ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceType,
  type ProbableWaffleGameModeData,
  type ProbableWafflePlayerDataChangeEventPayload,
  type ProbableWafflePlayerDataChangeEventProperty,
  ProbableWafflePlayerType,
  type ProbableWaffleSpectatorData,
  type ProbableWaffleSpectatorDataChangeEventProperty,
  type RequestGameSearchForMatchMakingDto
} from "@fuzzy-waddle/probable-waffle-protocol";
import { type GameInstanceId, GameSessionState, type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { map } from "rxjs/operators";
import type { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking-options";
import { GameInstanceEventClient } from "./game-instance-event-client";
/** Owns lobby membership, matchmaking and navigation over the same subscribed client instance. */
@Injectable()
export abstract class GameInstanceLobbyClient extends GameInstanceEventClient {
  async startGame(): Promise<void> {
    await this.assignMissingFactionTypes();
    await this.assignMissingTeams();

    await this.gameInstanceMetadataChanged("sessionState", { sessionState: GameSessionState.MovingPlayersToGame });
  }

  protected async assignMissingFactionTypes() {
    const players = this.gameInstance!.players;
    for (const player of players) {
      if (!player.playerController.data.playerDefinition!.factionType) {
        const factionType = getRandomFactionType();
        await this.playerChanged(
          "playerController.data.playerDefinition.factionType" as ProbableWafflePlayerDataChangeEventProperty,
          {
            playerNumber: player.playerNumber,
            playerControllerData: { playerDefinition: { factionType } as PositionPlayerDefinition }
          }
        );
      }
    }
  }

  protected async assignMissingTeams() {
    const players = this.gameInstance!.players;
    const teamsSet = new Set(players.map((p) => p.playerController.data.playerDefinition!.team));
    for (const player of players) {
      if (player.playerController.data.playerDefinition!.team === undefined) {
        // assign first free team
        let team = 1;
        while (teamsSet.has(team)) {
          team++;
        }
        teamsSet.add(team);
        await this.playerChanged(
          "playerController.data.playerDefinition.team" as ProbableWafflePlayerDataChangeEventProperty,
          {
            playerNumber: player.playerNumber,
            playerControllerData: { playerDefinition: { team } as PositionPlayerDefinition }
          }
        );
      }
    }
  }

  async gameInstanceMetadataChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameInstanceMetadataData>,
    data: Partial<ProbableWaffleGameInstanceMetadataData>
  ): Promise<void> {
    if (!this.currentGameInstanceId) return;

    this.probableWaffleCommunicatorService.gameInstanceMetadataChanged?.send({
      property: property,
      gameInstanceId: this.currentGameInstanceId,
      emitterUserId: this.authService.userId,
      data
    });
  }

  async gameModeChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameModeData>,
    gameModeData: Partial<ProbableWaffleGameModeData>
  ): Promise<void> {
    if (!this.currentGameInstanceId) return;

    this.probableWaffleCommunicatorService.gameModeChanged?.send({
      property: property,
      gameInstanceId: this.currentGameInstanceId,
      emitterUserId: this.authService.userId,
      data: gameModeData
    });
  }

  async playerChanged(
    property: ProbableWafflePlayerDataChangeEventProperty,
    data: ProbableWafflePlayerDataChangeEventPayload
  ) {
    if (!this.currentGameInstanceId) return;

    const payload = {
      property: property,
      gameInstanceId: this.currentGameInstanceId,
      emitterUserId: this.authService.userId,
      data
    };

    if (property === "joinedFromNetwork") {
      this.probableWaffleCommunicatorService.playerChanged?.sendToServer(payload);
      return;
    }

    this.probableWaffleCommunicatorService.playerChanged?.send(payload);
  }

  protected async spectatorChanged(
    property: ProbableWaffleSpectatorDataChangeEventProperty,
    data: Partial<ProbableWaffleSpectatorData>
  ) {
    if (!this.currentGameInstanceId) return;

    this.probableWaffleCommunicatorService.spectatorChanged?.send({
      property: property,
      gameInstanceId: this.currentGameInstanceId,
      emitterUserId: this.authService.userId,
      data
    });
  }

  /**
   * game instance is fully prepared on server, we're just joining it
   */
  async joinGameInstanceAsPlayerForMatchmaking(gameInstanceId: GameInstanceId): Promise<void> {
    const gameInstanceData = (await this.getGameInstanceData(gameInstanceId))!;
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    this.syncCurrentPlayerNumberFromGameInstance();
    await this.startListeningToGameInstanceEvents();
  }

  /**
   * owner only
   */
  async joinGameInstanceAsPlayer(gameInstanceId: GameInstanceId): Promise<void> {
    if (this.currentGameInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const gameInstanceData = await this.getGameInstanceData(gameInstanceId);
    if (!gameInstanceData)
      throw new Error("Game instance not found in joinGameInstanceAsPlayer in GameInstanceClientService");
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    this.syncCurrentPlayerNumberFromGameInstance();
    await this.startListeningToGameInstanceEvents();

    const userId = this.authService.userId;

    await this.playerChanged("joinedFromNetwork", {
      playerControllerData: { userId },
      playerName: await this.getCurrentPlayerName()
    });
    console.log("joined game instance as player");
  }

  async addSelfAsPlayer(overrides: Partial<PositionPlayerDefinition> = {}): Promise<PositionPlayerDefinition> {
    const gameInstance = this.gameInstance;
    if (!gameInstance) throw new Error("Game instance not found in addSelfAsPlayer in GameInstanceClientService");
    const firstFreePlayerNumber = GameSetupHelpers.getFirstFreePlayerNumber(gameInstance.players);
    const firstFreePosition = GameSetupHelpers.getFirstFreePosition(gameInstance.players);
    const playerDefinition = {
      ...overrides,
      player: createPlayerLobbyDefinition(firstFreePlayerNumber, firstFreePosition, await this.getCurrentPlayerName()),
      playerType: ProbableWafflePlayerType.Human
    } satisfies PositionPlayerDefinition;

    await this.addSelfOrAiPlayer(playerDefinition);
    return playerDefinition;
  }

  async addAiPlayer(
    position?: number,
    overrides: Partial<PositionPlayerDefinition> = {}
  ): Promise<PositionPlayerDefinition> {
    const gameInstance = this.gameInstance;
    if (!gameInstance) throw new Error("Game instance not found in addAiPlayer in GameInstanceClientService");
    const firstFreePlayerNumber = GameSetupHelpers.getFirstFreePlayerNumber(gameInstance.players);
    const firstFreePosition = GameSetupHelpers.getFirstFreePosition(gameInstance.players);
    const playerDefinition = {
      ...overrides,
      player: createPlayerLobbyDefinition(firstFreePlayerNumber, position ?? firstFreePosition),
      playerType: ProbableWafflePlayerType.AI,
      difficulty: ProbableWaffleAiDifficulty.Medium
    } satisfies PositionPlayerDefinition;

    await this.addSelfOrAiPlayer(playerDefinition);

    return playerDefinition;
  }

  async joinGameInstanceAsSpectator(gameInstanceId: GameInstanceId): Promise<void> {
    if (this.currentGameInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const gameInstanceData = await this.getGameInstanceData(gameInstanceId);
    if (!gameInstanceData)
      throw new Error("Game instance not found in joinGameInstanceAsSpectator in GameInstanceClientService");
    this.gameInstance = new ProbableWaffleGameInstance(gameInstanceData);
    this.syncCurrentPlayerNumberFromGameInstance();
    await this.startListeningToGameInstanceEvents();
    await this.addSelfAsSpectator();
  }

  async getGameInstanceData(gameInstanceId: GameInstanceId): Promise<ProbableWaffleGameInstanceData | null> {
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable)
      throw new Error("Not authenticated or server not available");

    const url = environment.api + "api/probable-waffle/get-game-instance";
    return await firstValueFrom(
      this.httpClient.get<ProbableWaffleGameInstanceData | null>(url, { params: { gameInstanceId } })
    );
  }

  async navigateToLobbyOrDirectlyToGame(): Promise<void> {
    if (!this.gameInstance)
      throw new Error("Game instance not found in navigateToLobbyOrDirectlyToGame in GameInstanceClientService");
    const sessionState = this.gameInstance.gameInstanceMetadata.data.sessionState;
    const isSpectator = this.gameInstance.spectators.some(
      (spectator) => spectator.data.userId === this.authService.userId
    );
    switch (this.getNormalizedGameInstanceType()) {
      case ProbableWaffleGameInstanceType.SelfHosted:
        if (isSpectator && sessionState !== GameSessionState.NotStarted) {
          await this.router.navigate(["aota/game"]);
          break;
        }
        // join lobby
        await this.router.navigate(["aota/lobby"]);
        break;
      case ProbableWaffleGameInstanceType.Skirmish:
        // replaceUrl: true - we don't want to go back to skirmish page
        await this.router.navigate(["aota/lobby"], { replaceUrl: true });
        break;
      case ProbableWaffleGameInstanceType.Matchmaking:
      case ProbableWaffleGameInstanceType.InstantGame:
      case ProbableWaffleGameInstanceType.Replay:
        // directly to game
        await this.router.navigate(["aota/game"]);
        break;
      default:
        console.warn(
          "[GameInstanceClientService] Unknown game instance type, defaulting to direct game navigation:",
          this.gameInstance.gameInstanceMetadata!.data.type
        );
        await this.router.navigate(["aota/game"]);
        break;
    }
  }

  async navigateDirectlyToGame(): Promise<void> {
    if (!this.gameInstance)
      throw new Error("Game instance not found in navigateDirectlyToGame in GameInstanceClientService");
    await this.router.navigate(["aota/game"]);
  }

  async playerSlotOpened(): Promise<void> {
    const firstFreePlayerNumber = GameSetupHelpers.getFirstFreePlayerNumber(this.gameInstance!.players);
    const firstFreePosition = GameSetupHelpers.getFirstFreePosition(this.gameInstance!.players);
    await this.playerChanged("joined", {
      playerControllerData: {
        playerDefinition: {
          player: {
            playerNumber: firstFreePlayerNumber,
            playerName: "Player " + firstFreePlayerNumber,
            playerPosition: firstFreePosition,
            joined: false
          } satisfies PlayerLobbyDefinition,
          playerType: ProbableWafflePlayerType.NetworkOpen
        } satisfies PositionPlayerDefinition
      }
    });
  }

  async removePlayer(playerNumber: PlayerNumber): Promise<void> {
    await this.playerChanged("left", {
      playerControllerData: {
        playerDefinition: {
          player: {
            playerNumber
          } as PlayerLobbyDefinition
        } as PositionPlayerDefinition
      }
    });
  }

  async disconnectSelfFromCurrentGame(): Promise<void> {
    if (!this.gameInstance || this.selfExitInProgress) {
      return;
    }

    this.selfExitInProgress = true;
    if (this.currentPlayerNumber !== undefined) {
      await this.removePlayer(this.currentPlayerNumber);
      return;
    }

    const isSpectator = this.gameInstance.spectators.some((s) => s.data.userId === this.authService.userId);
    if (isSpectator && this.authService.userId) {
      await this.spectatorChanged("left", { userId: this.authService.userId });
    }
  }

  protected async addSelfOrAiPlayer(playerDefinition: PositionPlayerDefinition): Promise<void> {
    if (!this.currentGameInstanceId) return;

    const playerNumber = playerDefinition.player.playerNumber;
    const player = this.gameInstance!.players.find((p) => p.playerNumber === playerNumber);
    if (player) throw new Error("Player already exists");
    const userId = playerDefinition.playerType === ProbableWafflePlayerType.Human ? this.authService.userId : null;
    await this.playerChanged("joined", {
      playerControllerData: {
        playerDefinition,
        userId
      }
    });
  }

  protected async getCurrentPlayerName(): Promise<string> {
    try {
      const profile = await this.currentUserProfileService.getCurrentUserProfile();
      return profile?.displayName || this.authService.fullName || "Player";
    } catch {
      // A profile refresh must not prevent an authenticated player from joining a lobby.
      return this.authService.fullName || "Player";
    }
  }

  async addSelfAsSpectator(): Promise<void> {
    await this.spectatorChanged("joined", {
      userId: this.authService.userId!,
      displayName: await this.getCurrentPlayerName()
    });
  }

  async getGameFoundListener(): Promise<Observable<ProbableWaffleGameFoundEvent>> {
    const socket = await this.authenticatedSocketService.getSocket();
    return socket!.fromEvent<ProbableWaffleGameFoundEvent, any>(ProbableWaffleGameInstanceEvent.GameFound).pipe(
      filter((data) => data.userIds.includes(this.authService.userId!)),
      map((data) => data)
    );
  }

  async requestGameSearchForMatchmaking(matchmakingOptions: MatchmakingOptions): Promise<void> {
    if (this.currentGameInstanceId) throw new Error("Game instance already exists");
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable) return;
    const url = environment.api + "api/probable-waffle/matchmaking/request-game-search-for-matchmaking";
    const body: RequestGameSearchForMatchMakingDto = {
      mapPoolIds: matchmakingOptions.levels.filter((l) => l.checked).map((l) => l.id),
      factionType: matchmakingOptions.factionType,
      teamConfiguration: matchmakingOptions.teamConfiguration
    };
    await firstValueFrom(this.httpClient.post<void>(url, body));
  }

  async stopRequestGameSearchForMatchmaking(): Promise<void> {
    if (!this.authService.isAuthenticated || !this.serverHealthService.serverAvailable) return;
    const url = environment.api + "api/probable-waffle/matchmaking/stop-request-game-search-for-matchmaking";
    await firstValueFrom(this.httpClient.delete<void>(url, {}));
  }

}
