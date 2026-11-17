import type { PlayerAiController } from "../../../../../player/ai-controller/player-ai-controller";
import { AiCommittedDebugLines } from "../AiCommittedDebugLines";

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
  skirmish: { squads: [], incidents: [] },
  strategicAssessment: {
    choice: "finish",
    reason: "credible_force_and_route",
    targetActorId: "enemy-core",
    readyForce: 3,
    requiredForce: 2,
    visibleThreatCount: 0,
    confidencePermille: 1000,
    expectedEffectTick: 300,
    reconsiderTick: 280,
    alternatives: [{ targetActorId: "enemy-field", reason: "lower_expected_effect" }]
  },
  decisions: [],
  whyNot: []
} as unknown as NonNullable<ReturnType<PlayerAiController["getBrainDebugSnapshot"]>>;

describe("committed AI debug lines", () => {
  it("identifies completed and remaining fortification piece kinds without counting the open gate", () => {
    expect(
      AiCommittedDebugLines.getFortificationPieceLines([
        { kind: "gate_slot", lifecycle: "finished" },
        { kind: "wall", lifecycle: "finished" },
        { kind: "stair", lifecycle: "finished" },
        { kind: "tower", lifecycle: "planned" }
      ])
    ).toEqual(["  completed pieces: stair:1, wall:1", "  remaining pieces: tower:1"]);
  });

  it("reports map and real match seed in the runtime view even before the first decision", () => {
    expect(AiCommittedDebugLines.getRuntimeLines(undefined, 0, { mapName: "Ember Enclave", seed: 12345 })).toEqual([
      "=== RUNTIME & LIMITS ===",
      "Match Ember Enclave, seed 12345",
      "No committed decision snapshot"
    ]);
  });

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
      getBrainState: jest.fn(() => {
        throw new Error("live state must not be read");
      }),
      getCommittedObservation: jest.fn(() => {
        throw new Error("live observation must not be read");
      })
    } as unknown as PlayerAiController;

    const lines = AiCommittedDebugLines.getCommittedPlanningLines(controller, recorded, 2, "production");

    expect(lines).toContain("Selected historical decision 7 at tick 240");
    expect(lines).toContain("Detailed observation/state rows were not retained in this bounded snapshot");
    expect(controller.getBrainState).not.toHaveBeenCalled();
    expect(controller.getCommittedObservation).not.toHaveBeenCalled();
  });

  it("shows the committed finish rationale and alternatives in historical strategy views", () => {
    const controller = {
      getBrainState: jest.fn(() => {
        throw new Error("live state must not be read");
      }),
      getCommittedObservation: jest.fn(() => {
        throw new Error("live observation must not be read");
      })
    } as unknown as PlayerAiController;

    const lines = AiCommittedDebugLines.getCommittedPlanningLines(controller, recorded, 1, "strategy");
    expect(lines).toContain("Choice: finish; credible_force_and_route");
    expect(lines).toContain("Force: 3/2 compatible units; route unknown; confidence 1000‰");
    expect(lines).toContain("Alternative enemy-field: lower_expected_effect");
    expect(controller.getBrainState).not.toHaveBeenCalled();
  });

  it("shows majority-loss withdrawal policy and the committed tactical reason", () => {
    const controller = {} as PlayerAiController;
    const thresholdLines = AiCommittedDebugLines.getCommittedPlanningLines(controller, recorded, 0, "thresholds");
    const supportLines = AiCommittedDebugLines.getSquadSupportLines({
      ...recorded,
      support: [],
      skirmish: {
        ...recorded.skirmish,
        squads: [
          {
            squadId: "squad:defense",
            state: "retreat",
            stateReason: "majority_committed_losses",
            individualFallbackCount: 1,
            pursuitReleasedTargetIds: ["fleeing-worker"],
            script: "protected_retreat",
            domain: "ground",
            members: 4,
            taskForceId: "task-force:2",
            objectiveId: "enemy-worker",
            targetActorId: "enemy-worker",
            engagementRatioPermille: 600,
            confidencePermille: 900,
            predictedFriendlyLossPermille: 700,
            observedLossCount: 3,
            lastUsefulEffectTick: null,
            orderedActorCount: 4,
            damageReservationCount: 0,
            mobileReserveCount: 0,
            oscillationCount: 0,
            objectiveAlternatives: []
          }
        ]
      }
    } as unknown as NonNullable<ReturnType<PlayerAiController["getBrainDebugSnapshot"]>>);

    expect(thresholdLines).toContain(
      "Full withdrawal: majority losses, whole squad critically exposed, scout under fire, or defender route lost"
    );
    expect(supportLines).toContain("  reason majority_committed_losses; individual fallback 1");
    expect(supportLines).toContain("  pursuit released: fleeing-worker");
  });
});
