import { TestBed } from "@angular/core/testing";

import { GameInstanceClientService } from "./game-instance-client.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import {
  PositionPlayerDefinition,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleGameModeData,
  ProbableWaffleLevelStateChangeEvent
} from "@fuzzy-waddle/api-interfaces";
import { RouterTestingModule } from "@angular/router/testing";
import { Observable } from "rxjs";
import { MatchmakingOptions } from "../gui/online/matchmaking/matchmaking.component";

export const gameInstanceClientServiceStub = {
  get gameLocalInstanceId(): string | null {
    return null;
  },
  createGameInstance(
    name: string,
    visibility: ProbableWaffleGameInstanceVisibility,
    type: ProbableWaffleGameInstanceType
  ): Promise<void> {
    return Promise.resolve();
  },
  stopGameInstance(): Promise<void> {
    return Promise.resolve();
  },
  startGame(): Promise<void> {
    return Promise.resolve();
  },
  joinToLobbyAsSpectator(): Promise<void> {
    return Promise.resolve();
  },
  joinToLobbyAsPlayer(): Promise<void> {
    return Promise.resolve();
  },
  stopGame(): Promise<void> {
    return Promise.resolve();
  },
  async gameModeChanged(gameModeData: ProbableWaffleGameModeData): Promise<void> {
    return Promise.resolve();
  },
  get listenToLevelStateChangeEvents(): Observable<ProbableWaffleLevelStateChangeEvent> | undefined {
    return undefined;
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
