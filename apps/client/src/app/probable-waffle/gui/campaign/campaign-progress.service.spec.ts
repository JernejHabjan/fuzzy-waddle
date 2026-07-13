import { TestBed } from "@angular/core/testing";
import { CampaignProgressService } from "./campaign-progress.service";
import { provideHttpClient } from "@angular/common/http";
import { AuthService } from "../../../auth/auth.service";

describe("CampaignProgressService", () => {
  let service: CampaignProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), { provide: AuthService, useValue: { isAuthenticated: false } }]
    });
    service = TestBed.inject(CampaignProgressService);
  });

  it("unlocks all missions in development for campaign iteration", () => {
    expect(service.getMissionProgress("dreams")?.state).toBe("available");
    expect(service.getMissionProgress("cyclops-and-sheep")?.state).toBe("available");
    expect(service.recommendedMission()?.mission.id).toBe("dreams");
  });

  it("unlocks the first Chapter I mission after Dreams is completed", () => {
    service.setProgress({ completedMissions: [{ missionId: "dreams", completedAt: "2026-07-12T10:00:00.000Z" }] });

    expect(service.getMissionProgress("dreams")?.state).toBe("completed");
    expect(service.getMissionProgress("cyclops-and-sheep")?.state).toBe("available");
  });

  it("unlocks planned roadmap entries in development", () => {
    service.setProgress({
      completedMissions: [
        { missionId: "dreams", completedAt: "2026-07-12T10:00:00.000Z" },
        { missionId: "cyclops-and-sheep", completedAt: "2026-07-12T10:01:00.000Z" },
        { missionId: "snow-wendigo-and-fire", completedAt: "2026-07-12T10:02:00.000Z" },
        { missionId: "slingshooters-and-wolves", completedAt: "2026-07-12T10:03:00.000Z" },
        { missionId: "owl-and-skaduwee-crystal", completedAt: "2026-07-12T10:04:00.000Z" },
        { missionId: "sand-dunes-and-tivara-crystal", completedAt: "2026-07-12T10:05:00.000Z" },
        { missionId: "we-had-enough", completedAt: "2026-07-12T10:06:00.000Z" }
      ]
    });

    expect(service.getMissionProgress("sailing-towards-the-new-future")?.state).toBe("available");
  });
});
