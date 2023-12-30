import { TestBed } from "@angular/core/testing";

import { GameInstanceClientService } from "./game-instance-client.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import { ProbableWaffleGameInstanceType, ProbableWaffleGameInstanceVisibility } from "@fuzzy-waddle/api-interfaces";
import { RouterTestingModule } from "@angular/router/testing";
import {
  ProbableWaffleCommunicatorService,
  probableWaffleCommunicatorServiceStub
} from "./probable-waffle-communicator.service";

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
  }
} satisfies GameInstanceClientServiceInterface;
describe("GameInstanceClientService", () => {
  let service: GameInstanceClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: ProbableWaffleCommunicatorService, useValue: probableWaffleCommunicatorServiceStub }
      ]
    });
    service = TestBed.inject(GameInstanceClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
