import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createStage2Observation, createStage2OwnedActor } from "../testing/ai-stage-2-test-fixtures";
import { AI_STAGE_12_NO_PROGRESS_TICKS, AiStage12RecoveryManagerV1 } from "./ai-stage-12-recovery-manager";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "worker",
      family: "gather",
      sourceObjectName: ObjectNames.TivaraWorker,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [ObjectNames.Sandhold],
      researches: [],
      gathers: [ResourceType.Food],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    }
  ]
};

function actor(
  id: string,
  objectName: ObjectNames,
  x: number,
  y: number,
  relation: "self" | "enemy" = "self"
): AiObservedActorV1 {
  return {
    ...createStage2OwnedActor(id),
    objectName,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    logicalPosition: { status: "known", value: { x, y, z: 0 }, observedTick: 100 },
    accessNodeId: { status: "known", value: "access:base", observedTick: 100 },
    capabilities: [
      {
        id: `${id}:attack`,
        family: "attack",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 100 }
      }
    ]
  };
}

function observation(extra: readonly AiObservedActorV1[] = [], tick = 100): AiObservationV1 {
  const source = {
    ...actor("source", ObjectNames.Granary, 7, 5),
    resourceState: {
      status: "known" as const,
      value: {
        resourceType: ResourceType.Food,
        available: { status: "known" as const, value: 500, observedTick: tick },
        carried: { status: "unknown" as const, reason: "not_supported" as const },
        growthReadyTick: { status: "unknown" as const, reason: "not_supported" as const },
        serviceCapacity: { status: "known" as const, value: 4, observedTick: tick }
      },
      observedTick: tick
    }
  };
  return {
    ...createStage2Observation(),
    generation: 1,
    tick,
    actors: [
      actor("main", ObjectNames.Sandhold, 5, 5),
      actor("worker-a", ObjectNames.TivaraWorker, 5, 6),
      actor("worker-b", ObjectNames.TivaraWorker, 6, 6),
      source,
      ...extra
    ],
    resources: [
      {
        resourceType: ResourceType.Food,
        stockpile: 0,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known", value: 0, observedTick: tick }
      }
    ],
    threatSummary: {
      observedTick: tick,
      visibleEnemyActorIds: extra.filter((entry) => entry.relation === "enemy").map((entry) => entry.actorId),
      rememberedEnemyActorIds: [],
      observedCapabilityFamilies: []
    }
  };
}

function state(): AiBrainStateV1 {
  const initial = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "opening:1:balanced"
  });
  return {
    ...initial,
    bases: [
      {
        baseId: "base:main:main",
        anchorActorId: "main",
        memberActorIds: ["main", "worker-a", "worker-b"],
        active: true,
        lifecycle: "active" as const,
        anchorPosition: { x: 5, y: 5, z: 0 },
        reservedSiteKey: "site:blocked"
      }
    ]
  };
}

describe("AiStage12RecoveryManagerV1", () => {
  const manager = new AiStage12RecoveryManagerV1(() => catalog);

  it("REC-01/H-16 replaces a depleted or unproductive source with bounded worker reassignment", () => {
    const proposal = manager.propose(observation(), state());
    expect(proposal.intents).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "assign_gatherers", sourceActorId: "source" })])
    );
    expect(proposal.statePatch?.recovery?.records).toEqual(
      expect.arrayContaining([expect.objectContaining({ domain: "economy", state: "recovering" })])
    );
  });

  it("REC-02/H-01 retains causal age and backs off equivalent retries rather than command spam", () => {
    const initial = manager.propose(observation(), state());
    const next = manager.propose(observation([], 110), { ...state(), recovery: initial.statePatch!.recovery! });
    expect(next.intents.filter((intent) => intent.kind === "assign_gatherers")).toHaveLength(0);
    expect(next.statePatch?.recovery?.records[0]?.nextRetryTick).toBeGreaterThanOrEqual(
      100 + AI_STAGE_12_NO_PROGRESS_TICKS
    );
  });

  it("REC-03 prioritizes an observed blocker without targeting an unseen hostile ID", () => {
    const visible = manager.propose(observation([actor("proxy", ObjectNames.Olival, 7, 5, "enemy")]), {
      ...state(),
      squads: [
        {
          squadId: "squad:defend",
          role: "defense",
          domain: "ground",
          actorIds: ["worker-a"],
          objectiveId: null,
          state: "ready"
        }
      ]
    });
    expect(visible.intents).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "attack", targetActorId: "proxy" })])
    );
    const unseen = manager.propose(
      {
        ...observation(),
        threatSummary: {
          observedTick: 100,
          visibleEnemyActorIds: [],
          rememberedEnemyActorIds: ["hidden-proxy"],
          observedCapabilityFamilies: []
        }
      },
      {
        ...state(),
        squads: [
          {
            squadId: "squad:defend",
            role: "defense",
            domain: "ground",
            actorIds: ["worker-a"],
            objectiveId: null,
            state: "ready"
          }
        ]
      }
    );
    expect(unseen.intents.some((intent) => intent.kind === "attack" && intent.targetActorId === "hidden-proxy")).toBe(
      false
    );
  });

  it("REC-04 records rejected placement cooldowns and releases only terminal optional recovery claims", () => {
    const current = state();
    const outcome = {
      kind: "rejected" as const,
      tick: 100,
      reason: "blocked",
      identity: {
        matchId: "match" as never,
        authorityEpoch: 0,
        playerNumber: 1,
        sequence: 1,
        commandId: "command:1" as never,
        effectId: "effect:expansion:1" as never,
        intentId: "intent:expansion:1" as never
      }
    };
    const proposal = manager.propose(observation(), {
      ...current,
      pendingOutcomes: [outcome],
      recovery: {
        records: [
          {
            recoveryKey: "optional",
            domain: "economy",
            planId: "plan:optional" as never,
            actorId: null,
            cause: "blocked",
            enteredTick: 0,
            lastProgressTick: 0,
            nextRetryTick: 0,
            phaseDeadline: aiDeadline(1),
            attempt: 2,
            state: "recovering",
            alternate: null,
            releasedClaimIds: []
          }
        ]
      }
    });
    expect(proposal.statePatch?.bases?.[0]?.rejectedSiteKeys).toHaveLength(1);
    expect(proposal.statePatch?.recovery?.records).toEqual(
      expect.arrayContaining([expect.objectContaining({ recoveryKey: "optional", state: "abandoned" })])
    );
  });

  it("WALL-04/DOMAIN-04/FIGHT-05 preserves recovery as a bounded state instead of teleporting or deleting actors", () => {
    const proposal = manager.propose(observation(), {
      ...state(),
      recovery: {
        records: [
          {
            recoveryKey: "transport:landing",
            domain: "transport",
            planId: "plan:transport:1" as never,
            actorId: "worker-a",
            cause: "unsafe_landing",
            enteredTick: 0,
            lastProgressTick: 0,
            nextRetryTick: 0,
            phaseDeadline: aiDeadline(1),
            attempt: 2,
            state: "recovering",
            alternate: "alternate_landing",
            releasedClaimIds: []
          }
        ]
      }
    });
    const entry = proposal.statePatch?.recovery?.records.find((record) => record.recoveryKey === "transport:landing");
    expect(entry).toMatchObject({ state: "abandoned", actorId: "worker-a" });
    expect(proposal.intents.some((intent) => intent.kind === "stop" && intent.actorIds.includes("worker-a"))).toBe(
      false
    );
  });
});
