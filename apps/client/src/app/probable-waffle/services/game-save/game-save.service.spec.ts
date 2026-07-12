import { TestBed } from "@angular/core/testing";
import type { ProbableWaffleGameInstanceData } from "@fuzzy-waddle/api-interfaces";
import { GameSaveService } from "./game-save.service";

describe("GameSaveService", () => {
  let service: GameSaveService;
  const data = { gameInstanceMetadataData: { gameInstanceId: "run-1" } } as ProbableWaffleGameInstanceData;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameSaveService);
  });
  it("continues from the newest valid manual or automatic campaign save", async () => {
    await service.save({
      scope: "campaign",
      kind: "manual",
      name: "Before battle",
      gameInstanceData: data,
      campaign: { chapterId: "prologue", missionId: "dreams", runId: "run-1" }
    });
    const record = await service.continueCampaignMission("dreams");
    expect(record?.name).toBe("Before battle");
  });
  it("retains at most ten autosaves for a campaign mission", async () => {
    for (let index = 0; index < 11; index++)
      await service.save({
        scope: "campaign",
        kind: "autosave",
        gameInstanceData: data,
        campaign: { chapterId: "prologue", missionId: "dreams", runId: "run-1" }
      });
    expect((await service.list()).length).toBe(10);
  });
});
