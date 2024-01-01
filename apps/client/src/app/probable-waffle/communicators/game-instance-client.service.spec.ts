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
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameModeData
} from "@fuzzy-waddle/api-interfaces";
import { RouterTestingModule } from "@angular/router/testing";
import { Observable } from "rxjs";
import { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";

export const gameInstanceClientServiceStub = {
  get currentGameInstanceId(): string | null {
    return null;
  },
  async createGameInstance(
    name: string,
    visibility: ProbableWaffleGameInstanceVisibility,
    type: ProbableWaffleGameInstanceType
  ): Promise<void> {
    return Promise.resolve();
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
  async playerLeftOrSlotClosed(playerNumber: number): Promise<void> {
    return Promise.resolve();
  },
  async addSelfOrAiPlayer(playerDefinition: PositionPlayerDefinition): Promise<void> {
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
    return Promise.resolve();
  },
  async addSelfAsPlayer(): Promise<void> {
    return Promise.resolve();
  }
} satisfies GameInstanceClientServiceInterface;
describe("GameInstanceClientService", () => {
  let service: GameInstanceClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(GameInstanceClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
