import { FactionType, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrainStateV1, AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiIntentDecisionV1 } from "../contracts/ai-intent-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { projectAiStrategicIntentSummary } from "./project-ai-strategic-intent-summary";

const observation = createAiTestObservation();

function brainState(): AiBrainStateV1 {
  return createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium),
    tick: 20,
    archetypeId: "balanced"
  });
}

function squad(role: AiSquadStateV1["role"], state: AiSquadStateV1["state"]): AiSquadStateV1 {
  return {
    squadId: "squad:1",
    role,
    domain: "ground",
    actorIds: ["soldier-1", "soldier-2"],
    objectiveId: "enemy-1",
    state,
    lifecycle: {
      targetPlayerNumber: 2,
      targetRegionId: null,
      protectedBaseId: null,
      rallyNodeId: null,
      retreatNodeId: null,
      createdTick: 20,
      assemblyDeadline: aiDeadline(80),
      effectDeadline: aiDeadline(160),
      lastUsefulEffectTick: null,
      recoveryAttempt: 0,
      terminalReason: null
    }
  };
}

describe("committed strategic intent summary", () => {
  it("does not invent a target or force before a mission exists", () => {
    const summary = projectAiStrategicIntentSummary(observation, brainState(), []);
    expect(summary.objective).toContain("no active squad mission");
    expect(summary.force).toBe("No active combat force");
    expect(summary.nextAction).toContain("Waiting");
  });

  it("shows the observed target, force, phase, and appropriate deadline", () => {
    const enemy = {
      ...createAiTestOwnedActor("enemy-1"),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const state = { ...brainState(), squads: [squad("attack", "rally")] };
    const summary = projectAiStrategicIntentSummary({ ...observation, actors: [...observation.actors, enemy] }, state, []);
    expect(summary.objective).toContain("Attacking Tivara worker belonging to Player 2");
    expect(summary.force).toContain("2 ground units; rally");
    expect(summary.force).toContain("assembly deadline tick 80");
    const engaged = projectAiStrategicIntentSummary(observation, { ...state, squads: [squad("defense", "engage")] }, []);
    expect(engaged.objective).toContain("Defending against assigned area");
    expect(engaged.force).toContain("effect deadline tick 160");
    expect(engaged.objective).not.toContain("enemy-1");
  });

  it("shows committed composition, deficit, queue capacity, and observed counter evidence", () => {
    const state = brainState();
    const demand = {
      demandId: "demand:air",
      purpose: "counter_air_pressure",
      capabilityOrRole: "anti_air",
      unit: "actor_count" as const,
      desired: 3,
      satisfiedActorIds: ["soldier-1"],
      queuedIds: ["queue-1"],
      constructingIds: [],
      acceptedNotObservedEffectIds: [],
      preferredObjectNames: [],
      resourceObligations: {}
    };
    const queuedActor = {
      ...observation.actors[0],
      queue: { status: "known" as const, value: { capacity: 3, occupied: 1, itemIds: ["queue-1"] }, observedTick: 20 }
    };
    const summary = projectAiStrategicIntentSummary(
      { ...observation, actors: [queuedActor] },
      {
        ...state,
        economyProduction: {
          ...state.economyProduction,
          demands: [demand],
          adaptation: {
            ...state.economyProduction.adaptation,
            activeRoleTargets: [{ role: "anti_air", desired: 3, evidenceIds: ["evidence:flyer"] }]
          }
        }
      },
      []
    );
    expect(summary.production).toContain("Need 1 more anti air for counter air pressure (2/3 committed)");
    expect(summary.production).toContain("2 observed free queue slots");
    expect(summary.production).toContain("supported by 1 committed evidence item");
  });

  it("shows the shortage and a committed recovery path without raw plan IDs", () => {
    const state = brainState();
    const summary = projectAiStrategicIntentSummary(
      {
        ...observation,
        resources: [{ ...observation.resources[0], stockpile: 2, reservedUnspent: 8, obligationsDue: 20 }]
      },
      {
        ...state,
        blockers: [{
          blockerId: "blocker:wood",
          planId: state.opening.plan.planId,
          cause: "resource",
          causeId: "wood",
          enteredTick: 20,
          deadline: aiDeadline(90),
          status: "recovering"
        }],
        recovery: {
          records: [{
            recoveryKey: "recovery:wood",
            domain: "economy",
            planId: state.opening.plan.planId,
            actorId: null,
            cause: "resource",
            enteredTick: 20,
            lastProgressTick: 20,
            nextRetryTick: 40,
            phaseDeadline: aiDeadline(90),
            attempt: 1,
            state: "backoff",
            alternate: "switch_to_wood",
            releasedClaimIds: []
          }]
        }
      },
      []
    );
    expect(summary.economy).toContain("short 26 wood");
    expect(summary.blocker).toContain("Resource blocks opening build order until tick 90; backoff, retry tick 40");
    expect(summary.blocker).not.toContain("plan:opening");
  });

  it("uses committed transport and concession state when there is no squad", () => {
    const state = brainState();
    const transport = {
      planId: "plan:transport:1",
      phase: "boarding" as const,
      passengerIds: ["soldier-1"],
      transportIds: ["carrier-1"],
      queryIds: []
    };
    const moving = projectAiStrategicIntentSummary(observation, { ...state, transport: [transport] }, []);
    expect(moving.objective).toContain("Transfer by unconfirmed transport");
    expect(moving.force).toContain("1 passenger, 1 carrier; boarding; deadline tick unknown");
    const conceding = projectAiStrategicIntentSummary(
      observation,
      { ...state, skirmish: { ...state.skirmish, mode: { ...state.skirmish.mode, state: "conceding" } } },
      []
    );
    expect(conceding.objective).toContain("Conceding");
  });

  it("reports an accepted gather action and a rejected prerequisite separately", () => {
    const intent = {
      kind: "assign_gatherers" as const,
      intentId: "intent:gather",
      effectId: "effect:gather",
      planId: "plan:opening",
      demandId: null,
      lane: "essential_economy" as const,
      proposedTick: 20,
      urgencyClass: 1,
      utility: 100,
      preconditions: [],
      claims: [],
      reasonCode: "gather_wood",
      actorIds: ["worker-1"],
      resourceType: ResourceType.Wood,
      sourceActorId: null
    };
    const decisions: AiIntentDecisionV1[] = [
      { outcome: "accepted", reason: "accepted", intent },
      { outcome: "rejected", reason: "precondition_failed", detail: "target_visible", intent }
    ];
    const summary = projectAiStrategicIntentSummary(observation, brainState(), decisions);
    expect(summary.economy).toContain("Assigning 1 worker to wood");
    expect(summary.nextAction).toContain("Gather wood with 1 worker");
    expect(summary.blocker).toBe("A required actor, resource, route, or target is not yet available");
    expect(summary.blocker).not.toContain("target_visible");
  });

  it("labels missing queue and target facts instead of inventing them", () => {
    const state = brainState();
    const summary = projectAiStrategicIntentSummary(
      observation,
      {
        ...state,
        squads: [squad("attack", "forming")],
        economyProduction: {
          ...state.economyProduction,
          demands: [{
            demandId: "demand:ranged",
            purpose: "pressure",
            capabilityOrRole: "ranged",
            unit: "actor_count",
            desired: 2,
            satisfiedActorIds: [],
            queuedIds: [],
            constructingIds: [],
            acceptedNotObservedEffectIds: [],
            preferredObjectNames: [],
            resourceObligations: {}
          }]
        }
      },
      []
    );
    expect(summary.objective).toContain("assigned area");
    expect(summary.objective).not.toContain("enemy-1");
    expect(summary.production).toContain("queue capacity unknown");
  });
});
