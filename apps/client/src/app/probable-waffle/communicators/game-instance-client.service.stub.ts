import {
  DifficultyModifiers,
  MapTuning,
  PositionPlayerDefinition,
  ProbableWaffleDataChangeEventProperty,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceSaveData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameModeData,
  ProbableWaffleGameStateData
} from "@fuzzy-waddle/api-interfaces";
import { Observable, Subject } from "rxjs";
import { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";

export const gameInstanceClientServiceStub = {
  gameInstance: undefined as ProbableWaffleGameInstance | undefined,
  gameInstanceToGameComponentCommunicator: new Subject<"refresh">(),
  get currentGameInstanceId(): string | null {
    return null;
  },
  async createGameInstance(
    name: string,
    visibility: ProbableWaffleGameInstanceVisibility,
    type: ProbableWaffleGameInstanceType
  ): Promise<void> {
    this.gameInstance = new ProbableWaffleGameInstance({
      gameInstanceMetadataData: {
        name,
        createdBy: "1",
        type,
        visibility,
        startOptions: {}
      } satisfies ProbableWaffleGameInstanceMetadataData,
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
  },
  async stopGameInstance(): Promise<void> {
    return Promise.resolve();
  },
  async startGame(): Promise<void> {
    return Promise.resolve();
  },
  async joinGameInstanceAsSpectator(): Promise<void> {
    return Promise.resolve();
  },
  async joinGameInstanceAsPlayerForMatchmaking(gameInstanceId: string): Promise<void> {
    return Promise.resolve();
  },
  async joinGameInstanceAsPlayer(): Promise<void> {
    return Promise.resolve();
  },
  async gameModeChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameModeData>,
    gameModeData: ProbableWaffleGameModeData
  ): Promise<void> {
    return Promise.resolve();
  },
  async playerSlotOpened(playerDefinition: PositionPlayerDefinition): Promise<void> {
    return Promise.resolve();
  },
  async removePlayer(playerNumber: number): Promise<void> {
    return Promise.resolve();
  },
  async addSelfAsSpectator(): Promise<void> {
    return Promise.resolve();
  },
  getGameFoundListener(): Promise<Observable<ProbableWaffleGameFoundEvent>> {
    return Promise.resolve(new Observable<ProbableWaffleGameFoundEvent>());
  },
  async requestGameSearchForMatchmaking(matchmakingOptions: MatchmakingOptions): Promise<void> {
    return Promise.resolve();
  },
  async stopRequestGameSearchForMatchmaking(): Promise<void> {
    return Promise.resolve();
  },
  async navigateToLobbyOrDirectlyToGame(): Promise<void> {
    return Promise.resolve();
  },
  async getGameInstanceData(gameInstanceId: string): Promise<ProbableWaffleGameInstanceData | null> {
    return Promise.resolve(null);
  },
  async addAiPlayer(): Promise<PositionPlayerDefinition> {
    this.gameInstance?.addPlayer(this.gameInstance?.initPlayer({} as any));
    return Promise.resolve({} as PositionPlayerDefinition);
  },
  async addSelfAsPlayer(): Promise<PositionPlayerDefinition> {
    this.gameInstance?.addPlayer(this.gameInstance?.initPlayer({} as any));
    return Promise.resolve({} as PositionPlayerDefinition);
  },
  async gameInstanceMetadataChanged(
    property: ProbableWaffleDataChangeEventProperty<ProbableWaffleGameInstanceMetadataData>,
    data: Partial<ProbableWaffleGameInstanceMetadataData>
  ): Promise<void> {
    return Promise.resolve();
  },
  async loadGameInstance(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    return Promise.resolve();
  },
  async saveGameInstance(data: Record<string, any>): Promise<void> {
    return Promise.resolve();
  },
  async startReplay(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    return Promise.resolve();
  }
} satisfies GameInstanceClientServiceInterface;
