import { TestBed } from "@angular/core/testing";
import type { ActivatedRouteSnapshot, RouterStateSnapshot, Routes } from "@angular/router";
import { GameInstanceGuard } from "./gui/online/lobby-page/game-instance.guard";
import { lazyGameInstanceGuard, probableWaffleRoutes } from "./probable-waffle.routes";

describe("probableWaffleRoutes", () => {
  const gameInstanceGuard = {
    canActivate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: GameInstanceGuard, useValue: gameInstanceGuard }]
    });
  });

  it.each(["lobby", "score-screen", "game"])("lazily guards the %s route", (path) => {
    const routes: Routes = probableWaffleRoutes;
    const gameRoutes = routes
      .find((route) => route.path === "aota")
      ?.children?.find((route) => route.path === "")?.children;

    expect(gameRoutes?.find((route) => route.path === path)?.canActivate).toEqual([lazyGameInstanceGuard]);
  });

  it.each([true, false])("forwards a %s result from GameInstanceGuard", async (allowed) => {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    gameInstanceGuard.canActivate.mockResolvedValue(allowed);

    const result = TestBed.runInInjectionContext(() => lazyGameInstanceGuard(route, state));

    await expect(result).resolves.toBe(allowed);
    expect(gameInstanceGuard.canActivate).toHaveBeenCalledWith(route, state);
  });
});
