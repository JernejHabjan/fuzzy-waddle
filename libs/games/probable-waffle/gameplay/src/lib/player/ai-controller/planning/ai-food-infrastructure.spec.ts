import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { AiMacroManager } from "./ai-macro-manager";

const constructionCells = Array.from({ length: 36 }, (_, index) => {
  const x = 8 + (index % 6);
  const y = 8 + Math.floor(index / 6);
  return {
    tileKey: `${x},${y}`,
    position: { x, y, z: 0 },
    groundPassable: true,
    waterPassable: false,
    elevation: 0,
    observedBlocked: false
  };
});

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
      constructs: [ObjectNames.Granary, ObjectNames.Field],
      researches: [],
      gathers: [ResourceType.Food, ResourceType.Wood],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    },
    {
      capabilityId: "granary",
      family: "resource_drop_off",
      sourceObjectName: ObjectNames.Granary,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: 2,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 80 },
        requiredObjectNames: [],
        footprintRadiusTiles: 1,
        visionRange: 10,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    },
    {
      capabilityId: "field",
      family: "resource_source",
      sourceObjectName: ObjectNames.Field,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 60 },
        requiredObjectNames: [ObjectNames.Granary],
        footprintRadiusTiles: 0,
        visionRange: 2,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    }
  ]
};

function state(): AiBrainStateV1 {
  return createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium),
    tick: 200,
    archetypeId: "balanced",
    completedOpeningStepIds: [
      "step:opening:bootstrap-worker",
      "step:opening:supply-safety",
      "step:opening:first-producer",
      "step:opening:sustainable-food"
    ]
  });
}

function observation(granaryCount: number, workerCount = 6) {
  const base = createAiTestObservation();
  const workers = Array.from({ length: workerCount }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
  const granaries = Array.from({ length: granaryCount }, (_, index) => ({
    ...createAiTestOwnedActor(`granary-${index}`),
    objectName: ObjectNames.Granary
  }));
  return {
    ...base,
    tick: 200,
    actors: [...workers, ...granaries],
    map: { ...base.map!, constructionCells },
    resources: base.resources.map((resource) =>
      resource.resourceType === ResourceType.Food ? { ...resource, stockpile: 100 } : resource
    )
  };
}

describe("AI food infrastructure", () => {
  it("does not bypass ordered opening checkpoints to prebuild food prerequisites", () => {
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium),
      tick: 200,
      archetypeId: "balanced"
    });
    const proposal = new AiMacroManager(() => catalog).propose(observation(0), initial);

    expect(
      proposal.statePatch?.economyProduction?.demands.some(
        (candidate) => candidate.purpose === "food_drop_off_capacity"
      )
    ).toBe(false);
  });

  it("rebuilds a destroyed prerequisite without reopening completed opening history", () => {
    const proposal = new AiMacroManager(() => catalog).propose(observation(0), state());

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.Granary })
    );
    expect(proposal.intents).not.toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.Field })
    );
    expect(proposal.statePatch?.opening?.plan.lifecycle).toBe("completed");
  });

  it("adds a useful duplicate drop-off only when forecast-backed Field capacity justifies it", () => {
    const proposal = new AiMacroManager(() => catalog).propose(observation(1, 10), state());
    const demand = proposal.statePatch?.economyProduction?.demands.find(
      (candidate) => candidate.purpose === "food_drop_off_capacity"
    );

    expect(demand).toMatchObject({ desired: 2, satisfiedActorIds: ["granary-0"] });
    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.Granary })
    );
  });

  it("prioritizes staffing an existing Field over constructing the next Field", () => {
    const field = { ...createAiTestOwnedActor("field-ready"), objectName: ObjectNames.Field };
    const proposal = new AiMacroManager(() => catalog).propose(
      { ...observation(1), actors: [...observation(1).actors, field] },
      state()
    );
    const labor = proposal.intents.find(
      (intent) => intent.kind === "assign_gatherers" && intent.sourceActorId === field.actorId
    );
    const construction = proposal.intents.find(
      (intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Field
    );

    expect(labor).toEqual(expect.objectContaining({ kind: "assign_gatherers" }));
    expect(construction).toEqual(expect.objectContaining({ kind: "construct" }));
    expect(construction?.claims).toContainEqual(
      expect.objectContaining({ kind: "resource", resourceType: ResourceType.Wood, amount: 60 })
    );
    expect(labor?.utility).toBeGreaterThan(construction?.utility ?? 0);
  });

  it("retries Field capacity after a rejected effect instead of counting it forever", () => {
    const previous = state();
    const effectId = "food-capacity:Field:effect:4:0" as never;
    const proposal = new AiMacroManager(() => catalog).propose(observation(2), {
      ...previous,
      reservations: [
        {
          claimId: "claim:field" as never,
          subjectKey: `effect:${effectId}`,
          ownerPlanId: previous.opening.plan.planId,
          state: { kind: "applied_spending", appliedTick: 190 as never },
          prerequisites: [],
          createdTick: 180 as never
        }
      ],
      pendingOutcomes: [
        {
          kind: "rejected",
          tick: 195 as never,
          reason: "construction_prerequisites_not_met",
          identity: {
            matchId: "match" as never,
            authorityEpoch: 0,
            playerNumber: 1,
            sequence: 4,
            commandId: "command:4" as never,
            effectId,
            intentId: "intent:4" as never
          }
        }
      ]
    });
    const demand = proposal.statePatch?.economyProduction?.demands.find(
      (candidate) => candidate.purpose === "renewable_food_capacity"
    );

    expect(demand?.acceptedNotObservedEffectIds).toEqual([]);
    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.Field })
    );
  });
});
