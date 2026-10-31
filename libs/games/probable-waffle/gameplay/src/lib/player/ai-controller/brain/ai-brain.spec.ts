import { FactionType, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "../planning/ai-manager-proposal";
import { aiDeadline } from "../contracts/ai-core-types";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiBrainStateV1 } from "./create-ai-brain-state-v1";
import { PureAiBrain } from "./ai-brain";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { findAiWhyNotExplanationV1 } from "../debug/project-ai-debug-snapshot";
import { AiSkirmishManager } from "../planning/ai-skirmish-manager";
import {
  catalog as scoutCatalog,
  homeNode,
  enemyNode,
  observation as scoutObservation,
  unit as scoutUnit
} from "../planning/ai-skirmish-test-fixtures";

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

  constructor(
    private readonly intents: readonly AiIntentV1[],
    private readonly spendingBudget?: AiManagerProposalV1["spendingBudget"]
  ) {}

  propose(): AiManagerProposalV1 {
    return {
      managerId: this.managerId,
      lane: "essential_economy",
      evaluated: true,
      intents: this.intents,
      ...(this.spendingBudget ? { spendingBudget: this.spendingBudget } : {}),
      reasons: ["fixture"]
    };
  }
}

class ThrowingOptionalManager implements AiProposalManagerV1 {
  readonly managerId = "throwing.optional";

  propose(): AiManagerProposalV1 {
    throw new Error("fixture_failure");
  }
}

class MacroLedgerManager implements AiProposalManagerV1 {
  readonly managerId = "stage-7-macro";

  propose(_: unknown, state: ReturnType<typeof createAiBrainStateV1>): AiManagerProposalV1 {
    return {
      managerId: this.managerId,
      lane: "essential_economy",
      evaluated: true,
      intents: [],
      reasons: ["fixture_macro_ledger"],
      statePatch: {
        economyProduction: {
          ...state.economyProduction,
          demands: [
            {
              demandId: "demand:macro:worker" as const,
              purpose: "fixture_macro",
              capabilityOrRole: "worker",
              unit: "actor_count",
              desired: 1,
              satisfiedActorIds: [],
              queuedIds: [],
              constructingIds: [],
              acceptedNotObservedEffectIds: [],
              preferredObjectNames: [],
              resourceObligations: {}
            }
          ]
        }
      }
    };
  }
}

class AdaptationLedgerManager implements AiProposalManagerV1 {
  readonly managerId = "stagez14.adaptation";

  propose(_: unknown, state: ReturnType<typeof createAiBrainStateV1>): AiManagerProposalV1 {
    return {
      managerId: this.managerId,
      lane: "optional_infrastructure_tech",
      evaluated: true,
      intents: [],
      reasons: ["fixture_adaptation_ledger"],
      statePatch: {
        adaptation: { ...state.economyProduction.adaptation, lastTransitionTick: 20, lastTransitionReason: "anti_air" },
        adaptationDemands: [
          {
            demandId: "demand:adapt:anti_air" as const,
            purpose: "fixture_adaptation",
            capabilityOrRole: "anti_air",
            unit: "actor_count",
            desired: 1,
            satisfiedActorIds: [],
            queuedIds: [],
            constructingIds: [],
            acceptedNotObservedEffectIds: [],
            preferredObjectNames: [],
            resourceObligations: {}
          }
        ]
      }
    };
  }
}

describe("PureAiBrain", () => {
  it("records accepted command service separately from evaluated but rejected lanes", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const observation = createAiTestObservation();
    const result = new PureAiBrain(profile, [new DummyManager([stopIntent("service", 900, "worker-1", 0)])]).step(
      observation,
      state,
      []
    );
    expect(result.acceptedIntents).toHaveLength(1);
    expect(result.nextState.lanes.find((entry) => entry.lane === "essential_economy")?.lastServicedTick).toBe(
      observation.tick
    );
    const blocked = new PureAiBrain(profile, [new DummyManager([stopIntent("blocked", 900, "absent", 100000)])]).step(
      observation,
      state,
      []
    );
    expect(blocked.acceptedIntents).toHaveLength(0);
    expect(blocked.nextState.lanes.find((entry) => entry.lane === "essential_economy")?.lastServicedTick).toBe(0);
  });
  it("SCOUT-05 commits identical exact intents from identical permitted inputs, then responds to a real sighting", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const input = scoutObservation(20, [scoutUnit("scout", homeNode, 0), scoutUnit("z-reserve", homeNode, 0)]);
    const brain = new PureAiBrain(profile, [new AiSkirmishManager(profile, () => scoutCatalog)]);
    const first = brain.step(input, state, []);
    const paired = brain.step(structuredClone(input), structuredClone(state), []);
    expect(first.acceptedIntents.length).toBeGreaterThan(0);
    expect(paired.acceptedIntents).toEqual(first.acceptedIntents);
    expect(paired.nextState).toEqual(first.nextState);
    const revealed = brain.step(
      scoutObservation(20, [
        scoutUnit("scout", homeNode, 0),
        scoutUnit("z-reserve", homeNode, 0),
        { ...scoutUnit("enemy", enemyNode, 22), owner: 2, relation: "enemy", visibility: "visible" }
      ]),
      state,
      []
    );
    expect(revealed.acceptedIntents).not.toEqual(first.acceptedIntents);
  });

  it("applies the emergency posture to competing affordable spending while preserving survival", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const observation = createAiTestObservation();
    const economy = { ...stopIntent("economy", 950, "worker-1", 100), spendingCategory: "economy" as const };
    const defense = { ...stopIntent("defense", 900, "worker-2", 100), spendingCategory: "defense" as const };
    const available = {
      ...observation,
      actors: [...observation.actors, createAiTestOwnedActor("worker-2")],
      resources: [{ ...observation.resources[0]!, stockpile: 200, reservedUnspent: 0, obligationsDue: 0 }]
    };

    const result = new PureAiBrain(profile, [
      new DummyManager([economy, defense], { economyPermille: 200, defensePermille: 800 })
    ]).step(available, state, []);

    expect(result.acceptedIntents.map((intent) => intent.intentId)).toEqual(["intent:defense"]);
    expect(result.decisions).toContainEqual(
      expect.objectContaining({ outcome: "rejected", reason: "posture_budget", detail: ResourceType.Wood })
    );
  });

  it("admits only the affordable combination of separately affordable resource claims", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const observation = createAiTestObservation();
    const result = new PureAiBrain(profile, [
      new DummyManager([stopIntent("housing", 920, "worker-1", 50), stopIntent("field", 880, "worker-2", 40)])
    ]).step({ ...observation, actors: [...observation.actors, createAiTestOwnedActor("worker-2")] }, state, []);

    expect(result.acceptedIntents.map((intent) => intent.intentId)).toEqual(["intent:housing"]);
    expect(result.decisions).toContainEqual(
      expect.objectContaining({ outcome: "rejected", reason: "resource_conflict", detail: ResourceType.Wood })
    );
  });

  it.each([
    { tick: 19, expiry: 20, accepted: false },
    { tick: 20, expiry: 20, accepted: true }
  ])("retains provisional resource escrow until its deadline across a contracted balance: %j", ({ tick, expiry, accepted }) => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const oldReservation = {
      claimId: "claim:old:wood" as const,
      subjectKey: "resource:wood",
      resourceAmount: 60,
      ownerPlanId: "plan:opening" as const,
      state: { kind: "provisional" as const, expiresAt: aiDeadline(expiry) },
      prerequisites: [] as const,
      createdTick: 0
    };
    const oldEffect = {
      claimId: "claim:old:effect" as const,
      subjectKey: "effect:effect:old",
      ownerPlanId: "plan:opening" as const,
      state: { kind: "provisional" as const, expiresAt: aiDeadline(expiry) },
      prerequisites: [] as const,
      createdTick: 0
    };
    const observation = createAiTestObservation();
    const contracted = {
      ...observation,
      tick,
      resources: observation.resources.map((resource) => resource.resourceType === ResourceType.Wood
        ? { ...resource, stockpile: 120, reservedUnspent: 20, obligationsDue: 10 }
        : resource)
    };
    const result = new PureAiBrain(profile, [new DummyManager([stopIntent("after-capacity-change", 900, "worker-1", 50)])])
      .step(contracted, { ...state, reservations: [oldReservation, oldEffect] }, []);

    expect(result.acceptedIntents.length > 0).toBe(accepted);
    expect(result.nextState.reservations.some((reservation) => reservation.claimId === oldReservation.claimId)).toBe(!accepted);
  });

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
    const brain = new PureAiBrain(profile, [new DummyManager([unavailable, conflict, high])]);

    const result = brain.step(createAiTestObservation(), state, []);

    expect(result.acceptedIntents.map((intent) => intent.intentId)).toEqual(["intent:high"]);
    expect(result.decisions.map((decision) => [decision.intent.intentId, decision.outcome, decision.reason])).toEqual([
      ["intent:high", "accepted", "accepted"],
      ["intent:conflict", "rejected", "claim_conflict"],
      ["intent:missing", "rejected", "precondition_failed"]
    ]);
    expect(result.nextState.scheduler.decisionSequence).toBe(1);
    expect(state.scheduler.decisionSequence).toBe(0);
    expect(result.debugSnapshot.nextActions).toEqual(["stop:test_high"]);
    expect(result.debugSnapshot.mainBlockingReason).toBe("claim_conflict");
    expect(result.debugSnapshot.strategicIntentSummary).toMatchObject({
      production: "Production goals currently satisfied",
      nextAction: "Stop"
    });
    expect(result.debugSnapshot.strategicIntentSummary.headline).toContain("Opening");
    expect(result.debugSnapshot.strategicIntentSummary.blocker).toContain("Claim conflict");
    expect(result.debugSnapshot.sections.productionComposition.status).toBe("ready");
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
    const result = new PureAiBrain(profile, [new DummyManager([invalid])]).step(createAiTestObservation(), state, []);
    expect(result.decisions).toEqual([]);
    expect(result.acceptedIntents).toEqual([]);
    expect(result.nextState.scheduler.boundaryFaults).toEqual([
      expect.objectContaining({ owner: "dummy", failures: 1 })
    ]);
  });

  it("does not reacquire a live physical claim from the same plan on the next decision", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const repeated = stopIntent("repeat", 900, "worker-1", 1);
    const brain = new PureAiBrain(profile, [new DummyManager([repeated])]);
    const first = brain.step(createAiTestObservation(), state, []);

    const second = brain.step(createAiTestObservation(), first.nextState, []);

    expect(first.acceptedIntents).toHaveLength(1);
    expect(first.nextState.reservations).toContainEqual(
      expect.objectContaining({ subjectKey: "resource:wood", resourceAmount: 1 })
    );
    expect(second.acceptedIntents).toHaveLength(0);
    expect(second.decisions).toContainEqual(expect.objectContaining({ outcome: "rejected", reason: "claim_conflict" }));
  });

  it("does not reacquire a physical claim while the same plan still owns it", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const intent = stopIntent("stable", 900, "worker-1", 1);
    const brain = new PureAiBrain(profile, [new DummyManager([intent])]);
    const first = brain.step(createAiTestObservation(), initial, []);
    const repeated = brain.step(createAiTestObservation(), first.nextState, []);

    expect(first.acceptedIntents).toHaveLength(1);
    expect(repeated.acceptedIntents).toHaveLength(0);
    expect(repeated.decisions).toContainEqual(
      expect.objectContaining({ outcome: "rejected", reason: "claim_conflict" })
    );
  });

  it("H-30 isolates an optional proposer exception and records why it was not evaluated", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const useful = stopIntent("useful", 900, "worker-1", 1);
    const result = new PureAiBrain(profile, [new ThrowingOptionalManager(), new DummyManager([useful])]).step(
      createAiTestObservation(),
      state,
      []
    );
    expect(result.acceptedIntents).toContainEqual(expect.objectContaining({ intentId: "intent:useful" }));
    expect(result.debugSnapshot.whyNot).toContainEqual(
      expect.objectContaining({
        subjectId: "throwing.optional",
        status: "not_evaluated",
        reason: "technical_fault:Error"
      })
    );
    expect(findAiWhyNotExplanationV1(result.debugSnapshot, "unrecorded.alternative")).toEqual({
      subjectId: "unrecorded.alternative",
      status: "not_recorded",
      reason: null
    });
  });

  it("preserves the current macro ledger while Stage 14 replaces only adaptive demand rows", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const result = new PureAiBrain(profile, [new AdaptationLedgerManager(), new MacroLedgerManager()]).step(
      createAiTestObservation(),
      state,
      []
    );

    expect(result.nextState.economyProduction.demands.map((demand) => demand.demandId)).toEqual([
      "demand:adapt:anti_air",
      "demand:macro:worker"
    ]);
    expect(result.nextState.economyProduction.adaptation.lastTransitionReason).toBe("anti_air");
  });

  it("does not accept new commands after an authoritative player goal resolves", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const terminalObservation = {
      ...createAiTestObservation(),
      modeGoals: [
        {
          id: "mode:win:no_enemy_players_left",
          kind: "destroy" as const,
          owner: 1,
          targetActorIds: [],
          targetAccessNodeIds: [],
          state: "completed" as const
        }
      ]
    };
    const result = new PureAiBrain(profile, [new DummyManager([stopIntent("post-game", 900, "worker-1", 1)])]).step(
      terminalObservation,
      state,
      []
    );

    expect(result.acceptedIntents).toEqual([]);
    expect(result.decisions).toEqual([]);
    expect(result.debugSnapshot.nextActions).toEqual([]);
  });
});
