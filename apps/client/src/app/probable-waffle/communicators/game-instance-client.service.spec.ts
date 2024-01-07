import { TestBed } from "@angular/core/testing";

import { GameInstanceClientService } from "./game-instance-client.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
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
import { RouterTestingModule } from "@angular/router/testing";
import { Observable } from "rxjs";
import { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";
import { GameInstanceStorageService } from "./storage/game-instance-storage.service";
import { gameInstanceStorageServiceStub } from "./storage/game-instance-storage.service.spec";

export const gameInstanceClientServiceStub = {
  gameInstance: undefined as ProbableWaffleGameInstance | undefined,
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
  listenToGameFound(): Observable<ProbableWaffleGameFoundEvent> {
    return new Observable<ProbableWaffleGameFoundEvent>();
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
  async addAiPlayer(): Promise<void> {
    this.gameInstance?.addPlayer(this.gameInstance?.initPlayer({} as any));
  },
  async addSelfAsPlayer(): Promise<void> {
    return Promise.resolve();
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
  async saveGameInstance(saveName: string): Promise<void> {
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
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: GameInstanceStorageService, useValue: gameInstanceStorageServiceStub }
      ]
    });
    service = TestBed.inject(GameInstanceClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
