import { ObjectNames, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { arbitrateAiIntents } from "../brain/ai-intent-arbiter";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";
import { catalog, completedOpeningState } from "./ai-macro-test-fixtures";
import { AiBaseManager } from "./ai-base-manager";

/** A visible expansion candidate through the real base proposer and shared stockpile admission. */
function fixture(wood: number, reservedWood = 0, priced = true) {
  const tick = 600;
  const capabilities = {
    ...catalog,
    entries: catalog.entries.map((entry) => {
      if (entry.sourceObjectName === ObjectNames.TivaraWorker) {
        return { ...entry, constructs: [...entry.constructs, ObjectNames.Sandhold] };
      }
      if (entry.sourceObjectName === ObjectNames.Sandhold && priced) {
        return {
          ...entry,
          constructionProfile: {
            resourceCost: { [ResourceType.Wood]: 400, [ResourceType.Stone]: 400 },
            footprintRadiusTiles: 2,
            visionRange: 8,
            navigableHeight: null,
            enterHeight: null,
            exitHeight: null
          }
        };
      }
      return entry;
    })
  } satisfies AiCapabilityCatalogV1;
  const main = {
    ...createAiTestOwnedActor("main"),
    objectName: ObjectNames.Sandhold,
    mainBuilding: { status: "known", value: true, observedTick: tick },
    logicalPosition: { status: "known", value: { x: 0, y: 0, z: 0 }, observedTick: tick }
  } satisfies AiObservedActorV1;
  const worker = {
    ...createAiTestOwnedActor("worker"),
    logicalPosition: { status: "known", value: { x: 1, y: 0, z: 0 }, observedTick: tick }
  } satisfies AiObservedActorV1;
  const distant = {
    ...createAiTestOwnedActor("distant"),
    objectName: ObjectNames.Tree1,
    relation: "neutral",
    visibility: "visible",
    owner: null,
    logicalPosition: { status: "known", value: { x: 50, y: 0, z: 0 }, observedTick: tick },
    resourceState: {
      status: "known",
      observedTick: tick,
      value: {
        resourceType: ResourceType.Wood,
        available: { status: "known", value: 200, observedTick: tick },
        carried: unknownAiValue,
        growthReadyTick: unknownAiValue,
        serviceCapacity: { status: "known", value: 2, observedTick: tick }
      }
    }
  } satisfies AiObservedActorV1;
  const observation = {
    ...createAiTestObservation(),
    tick,
    actors: [main, worker, distant],
    resources: [
      {
        resourceType: ResourceType.Wood,
        stockpile: wood,
        reservedUnspent: reservedWood,
        obligationsDue: 0,
        deliveredIncomePerMinute: unknownAiValue
      },
      {
        resourceType: ResourceType.Stone,
        stockpile: 400,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: unknownAiValue
      }
    ]
  } satisfies AiObservationV1;
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
  const initial = completedOpeningState();
  const state = {
    ...initial,
    opening: { ...initial.opening, plan: { ...initial.opening.plan, lifecycle: "completed" as const } }
  };
  const proposal = new AiBaseManager(profile, () => capabilities).propose(observation, state);
  const admitted = arbitrateAiIntents(observation, state, proposal.intents, [], profile, undefined);
  return { proposal, admitted };
}

describe("catalog-priced expansion admission", () => {
  it("reserves every catalog-priced resource instead of treating a main building as free", () => {
    const { proposal } = fixture(400);
    const intent = proposal.intents.find((candidate) => candidate.kind === "construct");
    if (!intent) throw new Error("Missing expansion proposal");
    expect(
      intent.claims
        .filter((claim) => claim.kind === "resource")
        .map((claim) => ({ resourceType: claim.resourceType, amount: claim.amount }))
    ).toEqual([
      { resourceType: ResourceType.Stone, amount: 400 },
      { resourceType: ResourceType.Wood, amount: 400 }
    ]);
  });

  it.each([
    [200, 0],
    [400, 25]
  ])("blocks expansion with wood=%s and reserved=%s before native dispatch", (wood, reserved) => {
    const { proposal, admitted } = fixture(wood, reserved);
    expect(proposal.intents).toHaveLength(1);
    expect(admitted.accepted).toEqual([]);
    expect(admitted.decisions).toContainEqual(expect.objectContaining({ reason: "resource_conflict" }));
  });

  it("admits the same legal candidate once its full cost is available", () => {
    expect(fixture(400).admitted.accepted).toHaveLength(1);
  });

  it("keeps an unpriced candidate explicit without dispatching a free construction", () => {
    const { proposal } = fixture(400, 0, false);
    expect(proposal.intents).toEqual([]);
    expect(proposal.statePatch?.bases?.some((base) => base.lifecycle === "proposed")).toBe(true);
  });
});
