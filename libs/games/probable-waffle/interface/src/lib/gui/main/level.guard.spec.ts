import { TestBed } from "@angular/core/testing";
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from "@angular/router";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { LevelGuard } from "./level.guard";

describe("LevelGuard", () => {
  const router = { navigate: jest.fn().mockResolvedValue(true) };
  const gameInstanceClientService = {
    gameInstance: undefined as { gameMode?: { data: { map?: number } } } | undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
    gameInstanceClientService.gameInstance = undefined;
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: GameInstanceClientService, useValue: gameInstanceClientService }
      ]
    });
  });

  it("allows navigation when a map is selected", () => {
    gameInstanceClientService.gameInstance = { gameMode: { data: { map: 1 } } };

    expect(TestBed.inject(LevelGuard).canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)).toBe(true);
  });

  it("redirects when no map is selected", () => {
    jest.spyOn(console, "error").mockImplementation();

    expect(TestBed.inject(LevelGuard).canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(["/aota"]);
  });
});
