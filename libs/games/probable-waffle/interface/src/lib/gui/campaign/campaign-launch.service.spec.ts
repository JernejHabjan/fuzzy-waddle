import { TestBed } from "@angular/core/testing";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { CampaignProgressService } from "./campaign-progress.service";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";
import { CampaignLaunchService } from "./campaign-launch.service";

describe("CampaignLaunchService", () => {
  const gameInstanceClientService = {
    gameInstance: undefined,
    createGameInstance: jest.fn().mockResolvedValue(undefined),
    stopGameInstance: jest.fn().mockResolvedValue(undefined)
  };
  const campaignProgressService = {
    getMissionProgress: jest.fn(),
    startRun: jest.fn().mockResolvedValue("run-1")
  };

  beforeEach(() => {
    jest.clearAllMocks();
    gameInstanceClientService.gameInstance = undefined;
    TestBed.configureTestingModule({
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientService },
        { provide: CampaignProgressService, useValue: campaignProgressService }
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
});
