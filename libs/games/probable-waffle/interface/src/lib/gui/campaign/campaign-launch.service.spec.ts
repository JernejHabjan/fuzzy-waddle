import { TestBed } from "@angular/core/testing";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { CampaignProgressService } from "./campaign-progress.service";
import { CampaignProfileService } from "./campaign-profile.service";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";
import { CampaignLaunchService } from "./campaign-launch.service";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  asCampaignContentId,
  createInitialCampaignProfile
} from "@fuzzy-waddle/probable-waffle-campaign";
import { signal } from "@angular/core";
import { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";

describe("CampaignLaunchService", () => {
  const gameInstanceClientService = {
    gameInstance: undefined,
    createGameInstance: jest.fn().mockResolvedValue(undefined),
    stopGameInstance: jest.fn().mockResolvedValue(undefined),
    addSelfAsPlayer: jest.fn().mockResolvedValue(undefined),
    addAiPlayer: jest.fn().mockResolvedValue(undefined),
    gameModeChanged: jest.fn().mockResolvedValue(undefined),
    startGame: jest.fn().mockResolvedValue(undefined),
    navigateDirectlyToGame: jest.fn().mockResolvedValue(undefined)
  };
  const campaignProgressService = {
    getMissionProgress: jest.fn(),
    startRun: jest.fn().mockResolvedValue("run-1")
  };
  const campaignProfile = createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
  const campaignProfileService = {
    profile: signal(campaignProfile),
    profileData: signal({ profile: campaignProfile, completedMissions: [] }),
    startRun: jest.fn().mockResolvedValue({
      runId: "run-1",
      missionId: "dreams",
      missionRevision: 1,
      difficulty: "normal",
      baseProfileRevision: 0,
      selectedLoadoutIds: [],
      loadoutSnapshotHash: "12345678",
      developerOverride: true
    })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    gameInstanceClientService.gameInstance = undefined;
    TestBed.configureTestingModule({
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientService },
        { provide: CampaignProgressService, useValue: campaignProgressService },
        { provide: CampaignProfileService, useValue: campaignProfileService }
      ]
    });
  });

  it("rejects a launch when the created instance has no metadata", async () => {
    const service = TestBed.inject(CampaignLaunchService);
    const mission = AOTA_CAMPAIGN_CATALOG.chapters[0]?.missions[0];
    expect(mission).toBeDefined();

    await expect(service.startMission(mission!)).rejects.toThrow("Campaign game metadata is required");
    expect(gameInstanceClientService.createGameInstance).toHaveBeenCalledTimes(1);
  });

  it("launches authored human, full AI, scripted AI, and passive participant slots", async () => {
    const mission = AOTA_CAMPAIGN_CATALOG.chapters[0]?.missions[0];
    const content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(mission!.id);
    jest.spyOn(AOTA_CAMPAIGN_CONTENT_REGISTRY, "getMission").mockReturnValue({
      ...content,
      participants: [
        participant("commander", "allies", "human"),
        participant("economy", "enemy", "full-ai"),
        participant("waves", "enemy", "scripted-ai"),
        participant("neutral", "neutral", "passive")
      ]
    });
    const metadataData: { campaignContext?: unknown } = {};
    gameInstanceClientService.gameInstance = { gameInstanceMetadata: { data: metadataData } } as never;
    const service = TestBed.inject(CampaignLaunchService);

    await service.startMission(mission!);

    expect(gameInstanceClientService.addSelfAsPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ team: 1, factionType: FactionType.Tivara })
    );
    expect(gameInstanceClientService.addAiPlayer).toHaveBeenNthCalledWith(
      1,
      1,
      expect.objectContaining({ team: 2, campaignController: "full-ai" })
    );
    expect(gameInstanceClientService.addAiPlayer).toHaveBeenNthCalledWith(
      2,
      2,
      expect.objectContaining({ team: 2, campaignController: "scripted-ai" })
    );
    expect(gameInstanceClientService.addAiPlayer).toHaveBeenNthCalledWith(
      3,
      3,
      expect.objectContaining({ team: 3, campaignController: "passive", campaignEconomy: "none" })
    );
    expect(metadataData.campaignContext).toMatchObject({
      runId: "run-1",
      difficulty: "normal",
      loadoutSnapshotHash: "12345678",
      selectedLoadoutIds: [],
      humanParticipantCount: 1,
      participantProgressionSnapshots: [
        expect.objectContaining({ slotId: "human", playerNumber: 1, progressionSnapshot: expect.any(Object) })
      ],
      progressionSnapshot: {
        baseProfileRevision: 0,
        profile: { wallet: { balances: { "campaign-crystal": 1 } } },
        pendingRewardIds: []
      }
    });
  });
});

function participant(slotId: string, teamId: string, controller: "human" | "full-ai" | "scripted-ai" | "passive") {
  return {
    slotId: asCampaignContentId<"participant-slot">(slotId),
    controller,
    faction: FactionType.Tivara,
    teamId: asCampaignContentId<"team">(teamId),
    economy: controller === "passive" ? ("none" as const) : ("normal" as const),
    fogPolicy: controller === "full-ai" ? ("omniscient-ai" as const) : ("normal" as const)
  };
}
