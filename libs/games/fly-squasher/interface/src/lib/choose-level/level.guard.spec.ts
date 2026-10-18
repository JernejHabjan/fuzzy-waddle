import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, convertToParamMap, Router, type RouterStateSnapshot } from "@angular/router";
import { FlySquasherLevelEnum } from "@fuzzy-waddle/fly-squasher-protocol";
import { LevelGuard } from "./level.guard";

describe("LevelGuard", () => {
  const router = { navigate: jest.fn().mockResolvedValue(true) };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [LevelGuard, { provide: Router, useValue: router }]
    });
  });

  function routeWithLevel(level: string | null): ActivatedRouteSnapshot {
    return { paramMap: convertToParamMap(level ? { level } : {}) } as ActivatedRouteSnapshot;
  }

  it("allows a known level", () => {
    const guard = TestBed.inject(LevelGuard);

    expect(
      guard.canActivate(routeWithLevel(String(FlySquasherLevelEnum.StartSquashing)), {} as RouterStateSnapshot)
    ).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("redirects an unknown level", () => {
    const guard = TestBed.inject(LevelGuard);

    expect(guard.canActivate(routeWithLevel("999"), {} as RouterStateSnapshot)).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(["/fly-squasher/choose-level"]);
  });
});
