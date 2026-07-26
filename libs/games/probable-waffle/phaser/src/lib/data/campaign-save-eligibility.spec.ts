import { GameSessionState } from "@fuzzy-waddle/platform-game-sessions";
import { evaluateCampaignSaveEligibility } from "./campaign-save-eligibility";
import { SimulationPauseReason } from "../world/services/simulation-tick.service";

describe("evaluateCampaignSaveEligibility", () => {
  const base = {
    sceneActive: true,
    sessionState: GameSessionState.InProgress,
    runtime: undefined,
    pauseReasons: [],
    request: { kind: "manual" as const }
  };

  it("allows a manual save while a serializable player pause is active", () => {
    expect(evaluateCampaignSaveEligibility({ ...base, pauseReasons: [SimulationPauseReason.Player] })).toEqual({
      eligible: true
    });
  });

  it("rejects saving during an atomic snapshot restore", () => {
    expect(
      evaluateCampaignSaveEligibility({ ...base, pauseReasons: [SimulationPauseReason.SnapshotRestore] }).eligible
    ).toBe(false);
  });
});
