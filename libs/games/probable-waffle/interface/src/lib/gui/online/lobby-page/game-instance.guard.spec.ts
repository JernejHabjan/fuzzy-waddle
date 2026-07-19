import { TestBed } from "@angular/core/testing";
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from "@angular/router";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { GameInstanceGuard } from "./game-instance.guard";

describe("GameInstanceGuard", () => {
  const router = { navigate: jest.fn().mockResolvedValue(true) };
  const gameInstanceClientService = { gameInstance: undefined as object | undefined };
  const serverHealthService = {
    serverAvailable: true,
    checkHealth: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    gameInstanceClientService.gameInstance = undefined;
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: GameInstanceClientService, useValue: gameInstanceClientService },
        { provide: ServerHealthService, useValue: serverHealthService }
      ]
    });
  });

  it("allows navigation when a game instance exists", async () => {
    gameInstanceClientService.gameInstance = {};

    await expect(
      TestBed.inject(GameInstanceGuard).canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ).resolves.toBe(true);
  });

  it("redirects when no game instance exists", async () => {
    jest.spyOn(console, "error").mockImplementation();

    await expect(
      TestBed.inject(GameInstanceGuard).canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ).resolves.toBe(false);
    expect(router.navigate).toHaveBeenCalled();
  });
});
