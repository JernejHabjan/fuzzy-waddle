import { TestBed } from "@angular/core/testing";

import { GameInstanceClientService } from "./game-instance-client.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import {
  PositionPlayerDefinition,
  ProbableWaffleDataChangeEventProperty,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceSaveData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameModeData
} from "@fuzzy-waddle/api-interfaces";
import { Observable, Subject } from "rxjs";
import { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";
import { gameInstanceLocalStorageServiceStub } from "./storage/game-instance-local-storage.service.spec";
import { GameInstanceStorageServiceInterface } from "./storage/game-instance-storage.service.interface";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";

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
    this.gameInstance = new ProbableWaffleGameInstance();
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
describe("GameInstanceClientService", () => {
  let service: GameInstanceClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: GameInstanceStorageServiceInterface, useValue: gameInstanceLocalStorageServiceStub }
      ]
    });
    service = TestBed.inject(GameInstanceClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
