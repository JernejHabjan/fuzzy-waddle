import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import {
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  createInitialCampaignProfile
} from "@fuzzy-waddle/probable-waffle-campaign";
import { CampaignProfileService } from "./campaign-profile.service";

describe("CampaignProfileService", () => {
  const auth = { isAuthenticated: false };
  let service: CampaignProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    auth.isAuthenticated = false;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("migrates completion-only guest progress without losing the original record", async () => {
    localStorage.setItem(
      "aota-campaign-progress-v1",
      JSON.stringify({ completedMissions: [{ missionId: "dreams", completedAt: "2026-07-20T10:00:00.000Z" }] })
    );
    service = TestBed.inject(CampaignProfileService);

    await service.load();

    expect(service.profileData().completedMissions).toEqual([
      { missionId: "dreams", completedAt: "2026-07-20T10:00:00.000Z" }
    ]);
    expect(localStorage.getItem("aota-campaign-progress-v1")).not.toBeNull();
  });

  it("loads, merges, and starts an authenticated run with profile/loadout identity", async () => {
    auth.isAuthenticated = true;
    service = TestBed.inject(CampaignProfileService);
    const profile = createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    const loading = service.load();
    http.expectOne((request) => request.url.endsWith("/campaign/profile")).flush({ profile, completedMissions: [] });
    http.expectOne((request) => request.url.endsWith("/campaign/merge")).flush({ profile, completedMissions: [] });
    await loading;

    const starting = service.startRun("dreams", "hard");
    const request = http.expectOne((candidate) => candidate.url.endsWith("/campaign/runs"));
    expect(request.request.body).toMatchObject({
      missionId: "dreams",
      difficulty: "hard",
      baseProfileRevision: 0,
      selectedLoadoutIds: []
    });
    expect(request.request.body.loadoutSnapshotHash).toMatch(/^[0-9a-f]{8}$/);
    request.flush({});
    expect((await starting).missionRevision).toBeGreaterThan(0);
  });

  it("rejects replay reward commits locally without mutating the profile or calling the API", async () => {
    service = TestBed.inject(CampaignProfileService);
    const before = service.profile();
    const result = await service.commitVictory({
      runId: "run-1",
      missionId: "dreams",
      missionRevision: 1,
      baseProfileRevision: 0,
      discoveredRewardIds: ["story"],
      completedObjectiveIds: [],
      difficulty: "normal",
      outcome: "victory",
      replayPlayback: true,
      integrity: { eligibleForRewards: false, invalidationReasons: ["replay-playback"] }
    });

    expect(result?.status).toBe("rejected");
    expect(service.profile()).toEqual(before);
  });
});
