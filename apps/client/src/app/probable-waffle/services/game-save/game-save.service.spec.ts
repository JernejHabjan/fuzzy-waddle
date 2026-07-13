import { TestBed } from "@angular/core/testing";
import type { ProbableWaffleGameInstanceData } from "@fuzzy-waddle/api-interfaces";
import { GameSaveService } from "./game-save.service";
import { GameSaveCodecService } from "./game-save-codec.service";
import { GameSaveCodecServiceStub } from "./game-save-codec.service.stub";
import { GameSaveRepository } from "./game-save.repository";
import { GameSaveRepositoryStub } from "./game-save.repository.stub";

describe("GameSaveService", () => {
  let service: GameSaveService;
  const data = { gameInstanceMetadataData: { gameInstanceId: "run-1" } } as ProbableWaffleGameInstanceData;
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
  it("overwrites only a named save from the same campaign mission", async () => {
    const original = await service.save({
      scope: "campaign",
      kind: "manual",
      name: "Before battle",
      gameInstanceData: data,
      campaign: { chapterId: "prologue", missionId: "dreams", runId: "run-1" }
    });
    const replacement = await service.save({
      scope: "campaign",
      kind: "manual",
      name: "After battle",
      overwriteSaveId: original.id,
      gameInstanceData: data,
      campaign: { chapterId: "prologue", missionId: "dreams", runId: "run-1" }
    });
    expect(replacement.id).toBe(original.id);
    expect(replacement.revision).toBe(2);
    expect((await service.list()).map((save) => save.name)).toEqual(["After battle"]);
  });
});
