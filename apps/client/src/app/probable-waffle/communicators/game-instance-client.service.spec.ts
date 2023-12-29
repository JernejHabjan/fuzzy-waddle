import { TestBed } from "@angular/core/testing";

import { GameInstanceClientService } from "./game-instance-client.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import { ProbableWaffleGameInstanceType } from "@fuzzy-waddle/api-interfaces";

export const gameInstanceClientServiceStub = {
  get gameLocalInstanceId(): string | null {
    return null;
  },
  createGameInstance(joinable: boolean, type: ProbableWaffleGameInstanceType): Promise<void> {
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
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(GameInstanceClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
