import { FactionType, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "../planning/ai-manager-proposal";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiBrainStateV1 } from "./create-ai-brain-state-v1";
import { PureAiBrainV1 } from "./ai-brain";
import { createStage2Observation } from "../testing/ai-stage-2-test-fixtures";

function stopIntent(id: string, utility: number, actorId: string, wood: number): AiIntentV1 {
  return {
    kind: "stop",
    intentId: `intent:${id}`,
    effectId: `effect:${id}`,
    planId: "plan:opening",
    demandId: null,
    lane: "essential_economy",
    proposedTick: 20,
    urgencyClass: 1,
    utility,
    preconditions: [
      { kind: "actor_exists", actorId },
      { kind: "resource_at_least", resourceType: ResourceType.Wood, amount: wood }
    ],
    claims: [
      { claimId: `claim:${id}:actor`, kind: "actor", actorId },
      { claimId: `claim:${id}:wood`, kind: "resource", resourceType: ResourceType.Wood, amount: wood }
    ],
    reasonCode: `test_${id}`,
    actorIds: [actorId]
  };
}

class DummyManager implements AiProposalManagerV1 {
  readonly managerId = "dummy";

  constructor(private readonly intents: readonly AiIntentV1[]) {}

  propose(): AiManagerProposalV1 {
    return {
      managerId: this.managerId,
      lane: "essential_economy",
      evaluated: true,
      intents: this.intents,
      reasons: ["fixture"]
    };
  }
}

describe("PureAiBrainV1", () => {
  it("explains accepted and rejected intents with deterministic claim arbitration", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const high = stopIntent("high", 900, "worker-1", 40);
    const conflict = stopIntent("conflict", 800, "worker-1", 20);
    const unavailable = stopIntent("missing", 700, "missing-worker", 10);
    const brain = new PureAiBrainV1(profile, [new DummyManager([unavailable, conflict, high])]);

    const result = brain.step(createStage2Observation(), state, []);

    expect(result.acceptedIntents.map((intent) => intent.intentId)).toEqual(["intent:high"]);
    expect(result.decisions.map((decision) => [decision.intent.intentId, decision.outcome, decision.reason])).toEqual([
      ["intent:high", "accepted", "accepted"],
      ["intent:conflict", "rejected", "claim_conflict"],
      ["intent:missing", "rejected", "precondition_failed"]
    ]);
    expect(result.nextState.scheduler.decisionSequence).toBe(1);
    expect(state.scheduler.decisionSequence).toBe(0);
    expect(result.debugSnapshot.nextActions).toEqual(["stop"]);
    expect(result.debugSnapshot.mainBlockingReason).toBe("claim_conflict");
    expect(result.debugSnapshot.sections.productionComposition.status).toBe("not_ready");
  });

  it("rejects invalid utility before it can rank as a winner", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Easy);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "safe"
    });
    const invalid = stopIntent("invalid", Number.NaN, "worker-1", 1);
    const result = new PureAiBrainV1(profile, [new DummyManager([invalid])]).step(createStage2Observation(), state, []);
    expect(result.decisions[0]).toMatchObject({ outcome: "rejected", reason: "invalid_numeric_input" });
  });
});
