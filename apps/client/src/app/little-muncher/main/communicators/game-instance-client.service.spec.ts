import { TestBed } from "@angular/core/testing";
import { GameInstanceClientService } from "./game-instance-client.service";
import { GameInstanceClientServiceInterface } from "./game-instance-client.service.interface";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.spec";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

export const gameInstanceClientServiceStub = {
  get gameInstanceId(): string | null {
    return null;
  },
  startGame(): Promise<void> {
    return Promise.resolve();
  },
  stopGame() {
    //
  },
  startLevel() {
    //
  },
  openLevelSpectator() {
    //
  },
  openLevel() {
    //
  },
  stopLevel(): Promise<void> {
    return Promise.resolve();
  }
} satisfies GameInstanceClientServiceInterface;
describe("GameInstanceClientService", () => {
  let service: GameInstanceClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: authServiceStub }]
    });
    service = TestBed.inject(GameInstanceClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
