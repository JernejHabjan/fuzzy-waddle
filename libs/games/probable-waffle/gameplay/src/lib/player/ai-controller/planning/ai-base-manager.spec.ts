import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { AI_EXPANSION_SATURATION_TICKS, AiBaseManager } from "./ai-base-manager";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "worker",
      family: "worker",
      sourceObjectName: ObjectNames.TivaraWorker,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [ObjectNames.Sandhold],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    }
  ]
};

function actor(actorId: string, objectName: ObjectNames, x: number, main = false): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName,
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 0 },
    accessNodeId: { status: "known", value: `access:${x},0`, observedTick: 0 },
    mainBuilding: { status: "known", value: main, observedTick: 0 }
  };
}

function observation(tick: number, actors: readonly AiObservedActorV1[], deliveredIncome = 5): AiObservationV1 {
  return {
    ...createAiTestObservation(),
    tick,
    generation: 1,
    actors,
    resources: [
      {
        resourceType: ResourceType.Wood,
        stockpile: 500,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known", value: deliveredIncome, observedTick: tick }
      }
    ]
  };
}

function withCompletedOpening(state: ReturnType<typeof createAiBrainStateV1>) {
  return {
    ...state,
    opening: { ...state.opening, plan: { ...state.opening.plan, lifecycle: "completed" as const } }
  };
}

describe("AiBaseManager", () => {
  const manager = new AiBaseManager(profile, () => catalog);

  it("anchors the base to the main structure rather than moving it with a distant scout", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const proposal = manager.propose(
      observation(20, [
        actor("sandhold", ObjectNames.Sandhold, 4, true),
        actor("scout", ObjectNames.TivaraWorker, 400)
      ]),
      state
    );

    expect(proposal.statePatch?.bases).toContainEqual(
      expect.objectContaining({ baseId: "base:main:sandhold", anchorActorId: "sandhold", memberActorIds: ["sandhold"] })
    );
  });

  it("creates one stable expansion reservation from a visible distant resource instead of duplicate same-tick plans", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const distantResource = {
      ...actor("wood-remote", ObjectNames.Tree1, 50),
      owner: null,
      relation: "neutral" as const,
      visibility: "visible" as const,
      resourceState: {
        status: "known" as const,
        value: {
          resourceType: ResourceType.Wood,
          available: { status: "known" as const, value: 200, observedTick: AI_EXPANSION_SATURATION_TICKS },
          carried: { status: "unknown" as const, reason: "not_supported" as const },
          growthReadyTick: { status: "unknown" as const, reason: "not_supported" as const },
          serviceCapacity: { status: "known" as const, value: 4, observedTick: AI_EXPANSION_SATURATION_TICKS }
        },
        observedTick: AI_EXPANSION_SATURATION_TICKS
      }
    } satisfies AiObservedActorV1;
    const completedState = withCompletedOpening(state);
    const first = manager.propose(
      observation(
        AI_EXPANSION_SATURATION_TICKS,
        [
          actor("sandhold", ObjectNames.Sandhold, 4, true),
          actor("worker", ObjectNames.TivaraWorker, 5),
          distantResource
        ],
        0
      ),
      completedState
    );
    const second = manager.propose(
      observation(
        AI_EXPANSION_SATURATION_TICKS + 20,
        [
          actor("sandhold", ObjectNames.Sandhold, 4, true),
          actor("worker", ObjectNames.TivaraWorker, 5),
          distantResource
        ],
        0
      ),
      { ...completedState, bases: first.statePatch!.bases! }
    );

    expect(first.statePatch?.bases?.filter((base) => base.baseId.startsWith("base:expansion:"))).toHaveLength(1);
    expect(second.statePatch?.bases?.filter((base) => base.baseId.startsWith("base:expansion:"))).toHaveLength(1);
  });

  it("does not reissue expansion construction after the reserved site is observed", () => {
    const state = withCompletedOpening(
      createAiBrainStateV1({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "balanced"
      })
    );
    const remote = {
      ...actor("wood-remote", ObjectNames.Tree1, 50),
      owner: null,
      relation: "neutral" as const,
      visibility: "visible" as const,
      resourceState: {
        status: "known" as const,
        value: {
          resourceType: ResourceType.Wood,
          available: { status: "known" as const, value: 200, observedTick: 600 },
          carried: { status: "unknown" as const, reason: "not_supported" as const },
          growthReadyTick: { status: "unknown" as const, reason: "not_supported" as const },
          serviceCapacity: { status: "known" as const, value: 4, observedTick: 600 }
        },
        observedTick: 600
      }
    } satisfies AiObservedActorV1;
    const initialActors = [
      actor("sandhold", ObjectNames.Sandhold, 4, true),
      actor("worker", ObjectNames.TivaraWorker, 5),
      remote
    ];
    const proposed = manager.propose(observation(600, initialActors, 0), state);
    const observedSite = actor("expansion-site", ObjectNames.Sandhold, 54, false);

    const reconciled = manager.propose(observation(620, [...initialActors, observedSite], 0), {
      ...state,
      bases: proposed.statePatch!.bases!
    });

    expect(proposed.intents).toContainEqual(expect.objectContaining({ kind: "construct" }));
    expect(reconciled.intents.some((intent) => intent.kind === "construct")).toBe(false);
  });

  it("retains rejected expansion history and chooses a different deterministic site", () => {
    const state = withCompletedOpening(
      createAiBrainStateV1({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "balanced"
      })
    );
    const remote = {
      ...actor("wood-remote", ObjectNames.Tree1, 50),
      owner: null,
      relation: "neutral" as const,
      visibility: "visible" as const,
      resourceState: {
        status: "known" as const,
        value: {
          resourceType: ResourceType.Wood,
          available: { status: "known" as const, value: 200, observedTick: 600 },
          carried: { status: "unknown" as const, reason: "not_supported" as const },
          growthReadyTick: { status: "unknown" as const, reason: "not_supported" as const },
          serviceCapacity: { status: "known" as const, value: 4, observedTick: 600 }
        },
        observedTick: 600
      }
    } satisfies AiObservedActorV1;
    const actors = [
      actor("sandhold", ObjectNames.Sandhold, 4, true),
      actor("worker", ObjectNames.TivaraWorker, 5),
      remote
    ];
    const first = manager.propose(observation(600, actors, 0), state);
    const firstExpansion = first.statePatch!.bases!.find((base) => base.baseId.startsWith("base:expansion:"))!;
    const rejected = {
      ...firstExpansion,
      lifecycle: "reserved" as const,
      reservedSiteKey: null,
      rejectedSiteKeys: [{ siteKey: firstExpansion.reservedSiteKey!, retryAfterTick: 1000, reason: "outcome_rejected" }]
    };
    const next = manager.propose(observation(620, actors, 0), {
      ...state,
      bases: [...first.statePatch!.bases!.filter((base) => base.baseId !== firstExpansion.baseId), rejected]
    });

    expect(next.intents).toContainEqual(
      expect.objectContaining({ kind: "construct", logicalPosition: { x: 50, y: 4, z: 0 } })
    );
    expect(next.statePatch?.bases?.some((base) => base.baseId === rejected.baseId)).toBe(false);
    expect(
      next.statePatch?.bases
        ?.find((base) => base.anchorActorId === "sandhold")
        ?.rejectedSiteKeys?.map((entry) => entry.siteKey)
    ).toContain(firstExpansion.reservedSiteKey);
  });

  it("defers expansion until the committed opening is complete", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const remote = {
      ...actor("wood-remote", ObjectNames.Tree1, 50),
      owner: null,
      relation: "neutral" as const,
      visibility: "visible" as const,
      resourceState: {
        status: "known" as const,
        value: {
          resourceType: ResourceType.Wood,
          available: { status: "known" as const, value: 200, observedTick: 900 },
          carried: { status: "unknown" as const, reason: "not_supported" as const },
          growthReadyTick: { status: "unknown" as const, reason: "not_supported" as const },
          serviceCapacity: { status: "known" as const, value: 4, observedTick: 900 }
        },
        observedTick: 900
      }
    } satisfies AiObservedActorV1;
    const proposal = manager.propose(
      observation(
        900,
        [actor("sandhold", ObjectNames.Sandhold, 4, true), actor("worker", ObjectNames.TivaraWorker, 5), remote],
        0
      ),
      state
    );

    expect(proposal.statePatch?.bases?.some((base) => base.baseId.startsWith("base:expansion:"))).toBe(false);
    expect(proposal.intents.some((intent) => intent.kind === "construct")).toBe(false);
  });
});
