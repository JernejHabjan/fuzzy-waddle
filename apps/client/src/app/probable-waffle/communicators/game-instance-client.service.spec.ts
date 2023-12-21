import { TestBed } from "@angular/core/testing";

import { GameInstanceClientService } from "./game-instance-client.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";

export const gameInstanceClientServiceStub = {
  get gameInstanceId(): string | null {
    return null;
  },
  createGameInstance(joinable: boolean): Promise<void> {
    return Promise.resolve();
  },
  stopGameInstance() {
    //
  },
  startGame() {
    //
  },
  joinToLobbyAsSpectator() {
    //
  },
  joinToLobbyAsPlayer() {
    //
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
