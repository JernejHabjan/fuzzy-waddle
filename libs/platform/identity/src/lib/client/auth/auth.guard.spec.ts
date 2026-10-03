import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./auth.guard";

describe("AuthGuard", () => {
  const authService = {
    isAuthenticated: false,
    ensureAuthReady: jest.fn().mockResolvedValue(null)
  };
  const router = { navigate: jest.fn().mockResolvedValue(true) };

  beforeEach(() => {
    jest.clearAllMocks();
    authService.isAuthenticated = false;
    TestBed.configureTestingModule({
      providers: [AuthGuard, { provide: AuthService, useValue: authService }, { provide: Router, useValue: router }]
    });
  });

  it("allows authenticated users", async () => {
    authService.isAuthenticated = true;

    await expect(TestBed.inject(AuthGuard).canActivate()).resolves.toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users", async () => {
    await expect(TestBed.inject(AuthGuard).canActivate()).resolves.toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(["/"]);
  });
});
