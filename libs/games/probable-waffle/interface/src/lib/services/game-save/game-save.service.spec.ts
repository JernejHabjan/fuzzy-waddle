import { TestBed } from "@angular/core/testing";
import {
  type CampaignGameSaveContext,
  type ProbableWaffleGameInstanceData
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
  createCampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-campaign";
import { GameSaveService } from "./game-save.service";
import { GameSaveCodecService } from "./game-save-codec.service";
import { GameSaveCodecServiceStub } from "./game-save-codec.service.stub";
import { GameSaveRepository } from "./game-save.repository";
import { GameSaveRepositoryStub } from "./game-save.repository.stub";

describe("GameSaveService", () => {
  let service: GameSaveService;
  const runtime = createCampaignMissionRuntimeState(
    ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
    AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission("dreams")
  );
  const data = {
    gameInstanceMetadataData: { gameInstanceId: "run-1" },
    gameStateData: { campaignMission: runtime }
  } as ProbableWaffleGameInstanceData;
  const campaign = (runId = "run-1"): CampaignGameSaveContext => ({
    campaignId: ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
    chapterId: "prologue",
    missionId: "dreams",
    runId,
    missionRevision: 1,
    runtimeSchemaVersion: runtime.schemaVersion,
    profileRevision: 0,
    participantCount: 1
  });
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: GameSaveCodecService, useClass: GameSaveCodecServiceStub },
        { provide: GameSaveRepository, useClass: GameSaveRepositoryStub }
      ]
    });
    service = TestBed.inject(GameSaveService);
  });
  it("continues from the newest valid manual or automatic campaign save", async () => {
    await service.save({
      scope: "campaign",
      kind: "manual",
      name: "Before battle",
      gameInstanceData: data,
      campaign: campaign()
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
        campaign: campaign()
      });
    expect((await service.list()).length).toBe(10);
  });
  it("retains ten autosaves independently for separate mission runs", async () => {
    for (let index = 0; index < 11; index++) {
      await service.save({
        scope: "campaign",
        kind: "autosave",
        gameInstanceData: data,
        campaign: campaign("run-a")
      });
      await service.save({
        scope: "campaign",
        kind: "autosave",
        gameInstanceData: data,
        campaign: campaign("run-b")
      });
    }
    expect((await service.list()).length).toBe(20);
  });
  it("overwrites only a named save from the same campaign mission", async () => {
    const original = await service.save({
      scope: "campaign",
      kind: "manual",
      name: "Before battle",
      gameInstanceData: data,
      campaign: campaign()
    });
    const replacement = await service.save({
      scope: "campaign",
      kind: "manual",
      name: "After battle",
      overwriteSaveId: original.id,
      gameInstanceData: data,
      campaign: campaign()
    });
    expect(replacement.id).toBe(original.id);
    expect(replacement.revision).toBe(2);
    expect((await service.list()).map((save) => save.name)).toEqual(["After battle"]);
  });
  it("keeps one quicksave slot for the current campaign mission", async () => {
    const first = await service.save({
      scope: "campaign",
      kind: "quicksave",
      name: "Quick Save",
      gameInstanceData: data,
      campaign: campaign()
    });
    const second = await service.save({
      scope: "campaign",
      kind: "quicksave",
      name: "Quick Save",
      gameInstanceData: data,
      campaign: campaign()
    });
    expect(second.id).toBe(first.id);
    expect(second.revision).toBe(2);
    expect((await service.list()).filter((save) => save.kind === "quicksave")).toHaveLength(1);
  });
});
