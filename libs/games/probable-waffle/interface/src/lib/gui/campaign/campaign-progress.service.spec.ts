import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { CampaignProfileData } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  createInitialCampaignProfile
} from "@fuzzy-waddle/probable-waffle-campaign";
import { CampaignProfileService } from "./campaign-profile.service";
import { CampaignProgressService } from "./campaign-progress.service";

describe("CampaignProgressService", () => {
  const profileData = signal<CampaignProfileData>({
    profile: createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY),
    completedMissions: []
  });
  const profileService = {
    profileData,
    load: jest.fn().mockResolvedValue(undefined),
    startRun: jest.fn().mockResolvedValue({ runId: "run-1" }),
    commitVictory: jest.fn().mockResolvedValue(undefined)
  };
  let service: CampaignProgressService;

  beforeEach(() => {
    profileData.set({
      profile: createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY),
      completedMissions: []
    });
    TestBed.configureTestingModule({
      providers: [{ provide: CampaignProfileService, useValue: profileService }]
    });
    service = TestBed.inject(CampaignProgressService);
  });

  it("uses the profile service as the only mutable completion authority", async () => {
    await service.load();
    expect(profileService.load).toHaveBeenCalled();
    expect(service.getMissionProgress("dreams")?.state).toBe("available");

    profileData.update((data) => ({
      ...data,
      completedMissions: [{ missionId: "dreams", completedAt: "2026-07-12T10:00:00.000Z" }]
    }));

    expect(service.getMissionProgress("dreams")?.state).toBe("completed");
    expect(service.getMissionProgress("cyclops-and-sheep")?.state).toBe("available");
  });

  it("keeps completed missions replayable while recommending the next mission", () => {
    profileData.update((data) => ({
      ...data,
      completedMissions: [{ missionId: "dreams", completedAt: "2026-07-12T10:00:00.000Z" }]
    }));

    expect(service.getMissionProgress("dreams")?.state).toBe("completed");
    expect(service.recommendedMission()?.mission.id).toBe("cyclops-and-sheep");
  });
});
