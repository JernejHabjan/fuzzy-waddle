import type { PlayerAiController } from "../../../../player/ai-controller/player-ai-controller";
import { AiCommittedDebugLines } from "./AiCommittedDebugLines";

const recorded = {
  decisionSequence: 7,
  tick: 240,
  profileDifficulty: "normal",
  strategicIntentSummary: {
    objective: "Attacking last known guard belonging to Player 2",
    force: "3 ground units; advance; effect deadline tick 300",
    production: "Need 1 more ranged unit for pressure (2/3 committed)",
    economy: "4 workers; short 10 wood for commitments",
    nextAction: "Train archer",
    blocker: "Resource blocks current plan until tick 280; backoff, retry tick 250"
  },
  commitmentUntilTick: 280,
  progressHealth: "watching",
  topReasons: ["observed enemy pressure"],
  decisions: [],
  whyNot: []
} as unknown as NonNullable<ReturnType<PlayerAiController["getBrainDebugSnapshot"]>>;

describe("committed AI debug lines", () => {
  it("renders the recorded strategic overview even when current state is unavailable", () => {
    const controller = {
      getBrainState: jest.fn(() => undefined),
      getCommittedObservation: jest.fn(() => undefined)
    } as unknown as PlayerAiController;

    const lines = AiCommittedDebugLines.getCommittedPlanningLines(controller, recorded, 1, "overview");

    expect(lines.slice(1, 7)).toEqual([
      "Purpose: Attacking last known guard belonging to Player 2 (normal)",
      "Force: 3 ground units; advance; effect deadline tick 300",
      "Production: Need 1 more ranged unit for pressure (2/3 committed)",
      "Economy: 4 workers; short 10 wood for commitments",
      "Next: Train archer",
      "Blocker: Resource blocks current plan until tick 280; backoff, retry tick 250"
    ]);
    expect(controller.getBrainState).not.toHaveBeenCalled();
    expect(controller.getCommittedObservation).not.toHaveBeenCalled();
  });

  it("labels unavailable historical details instead of mixing in current facts", () => {
    const controller = {
      getBrainState: jest.fn(() => { throw new Error("live state must not be read"); }),
      getCommittedObservation: jest.fn(() => { throw new Error("live observation must not be read"); })
    } as unknown as PlayerAiController;

    const lines = AiCommittedDebugLines.getCommittedPlanningLines(controller, recorded, 2, "production");

    expect(lines).toContain("Selected historical decision 7 at tick 240");
    expect(lines).toContain("Detailed observation/state rows were not retained in this bounded snapshot");
    expect(controller.getBrainState).not.toHaveBeenCalled();
    expect(controller.getCommittedObservation).not.toHaveBeenCalled();
  });
});
