import type { CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import { formatCampaignEncounterDiagnostics, selectQuestLogEntry } from "./CampaignObjectivesHud";

describe("formatCampaignEncounterDiagnostics", () => {
  it("projects deterministic encounter state for the developer HUD", () => {
    const state = {
      encounters: {
        ambush: {
          status: "active",
          waveIndex: 2,
          nextEligibleTick: 480,
          livingSpawnedActorIds: ["raider-1", "raider-2"],
          spawnedActorOwners: { "raider-1": 2, "raider-2": 2 },
          spawnCursor: 3,
          deterministicBranchIds: { composition: "heavy" },
          warnedWaveIds: ["wave-2"],
          blockedAttempts: 1
        }
      }
    } as unknown as CampaignMissionRuntimeState;

    expect(formatCampaignEncounterDiagnostics(state)).toEqual([
      "ENCOUNTERS",
      "ambush: active wave=2 living=2 cursor=3 blocked=1 next=480"
    ]);
  });
});

describe("selectQuestLogEntry", () => {
  it("retains a discovered selection and falls back to the first active objective", () => {
    const entries = [
      { type: "undiscovered", presentationKey: "undiscovered:main:0", title: "Undiscovered quest" },
      { type: "objective", presentationKey: "objective:completed", objective: { status: "completed" } },
      { type: "objective", presentationKey: "objective:active", objective: { status: "active" } }
    ] as never;

    expect(selectQuestLogEntry(entries, "objective:completed")).toBe("objective:completed");
    expect(selectQuestLogEntry(entries, "objective:removed")).toBe("objective:active");
  });
});
