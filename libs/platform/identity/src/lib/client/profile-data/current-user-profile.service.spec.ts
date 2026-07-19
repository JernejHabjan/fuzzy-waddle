import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { environment } from "@fuzzy-waddle/environments/environment";
import { AuthService } from "../auth/auth.service";
import type { CurrentUserProfileDto } from "../../current-user-profile";
import { CurrentUserProfileService } from "./current-user-profile.service";

describe("CurrentUserProfileService", () => {
  let service: CurrentUserProfileService;
  let httpTesting: HttpTestingController;
  const authService = {
    userId: "user-1" as string | null,
    ensureAuthReady: jest.fn().mockResolvedValue(null)
  };

  beforeEach(() => {
    authService.userId = "user-1";
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: authService }]
    });
    service = TestBed.inject(CurrentUserProfileService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it("reuses the in-flight current-profile request", async () => {
    const first = service.getCurrentUserProfile();
    const second = service.getCurrentUserProfile();
    const profile = { id: "user-1", displayName: "Player" } as CurrentUserProfileDto;
    await Promise.resolve();

    httpTesting.expectOne(`${environment.api}api/profile/me`).flush(profile);

    await expect(first).resolves.toEqual(profile);
    await expect(second).resolves.toEqual(profile);
  });

  it("returns null without requesting when no user is authenticated", async () => {
    authService.userId = null;

    await expect(service.getCurrentUserProfile()).resolves.toBeNull();
    httpTesting.expectNone(`${environment.api}api/profile/me`);
  });
});
