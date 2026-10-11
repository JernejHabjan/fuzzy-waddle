import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { AiAdaptationManager } from "./ai-adaptation-manager";

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "producer",
      family: "producer",
      sourceObjectName: ObjectNames.Sandhold,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [ObjectNames.TivaraSlingshotFemale],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null
    },
    {
      capabilityId: "counter",
      family: "ranged",
      sourceObjectName: ObjectNames.TivaraSlingshotFemale,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: ["ground", "air"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 40 },
        footprintRadiusTiles: 0,
        visionRange: 8,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    }
  ]
};

function world(tick: number, queuedItemCount: number): AiObservationV1 {
  const base = createAiTestObservation();
  const main = {
    ...createAiTestOwnedActor("main"),
    objectName: ObjectNames.Sandhold,
    queue: {
      status: "known" as const,
      observedTick: tick,
      value: {
        capacity: 4,
        occupied: queuedItemCount,
        itemIds: Array.from({ length: queuedItemCount }, (_, index) => `queued-${index}`),
        items: Array.from({ length: queuedItemCount }, (_, index) => ({
          itemId: `queued-${index}`,
          kind: "production" as const,
          objectName: ObjectNames.TivaraSlingshotFemale,
          researchType: null
        }))
      }
    }
  };
  const flyers = ["flyer-a", "flyer-b"].map((actorId) => ({
    ...createAiTestOwnedActor(actorId),
    owner: 2,
    relation: "enemy" as const,
    visibility: "visible" as const,
    observedTick: tick,
    evidenceId: `evidence:${actorId}` as const,
    capabilities: [
      {
        id: `${actorId}:air`,
        family: "attack",
        level: 1,
        domains: ["air" as const],
        targetDomains: ["ground" as const],
        capacity: { status: "known" as const, value: 0, observedTick: tick }
      }
    ]
  }));
  return {
    ...base,
    tick,
    actors: [main, ...flyers],
    threatSummary: {
      observedTick: tick,
      visibleEnemyActorIds: flyers.map((flyer) => flyer.actorId),
      rememberedEnemyActorIds: [],
      observedCapabilityFamilies: ["attack"]
    }
  };
}

describe("adaptation queue commitments", () => {
  it("TECH-05: counts compatible queued counters without redundant production or queue cancellation", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const manager = new AiAdaptationManager(profile, () => catalog);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const first = manager.propose(world(100, 0), initial);
    const adaptation = first.statePatch?.adaptation;
    if (!adaptation) throw new Error("first adaptation patch missing");
    const confirmedState = { ...initial, economyProduction: { ...initial.economyProduction, adaptation } };
    const fullyQueued = manager.propose(world(140, 2), confirmedState);
    expect(fullyQueued.statePatch?.adaptationDemands).toContainEqual(
      expect.objectContaining({
        demandId: "demand:adapt:anti_air",
        desired: 2,
        queuedIds: ["queued-0", "queued-1"]
      })
    );
    expect(fullyQueued.intents.some((intent) => intent.kind === "produce" || intent.kind === "cancel")).toBe(false);
    const oneQueued = manager.propose(world(140, 1), confirmedState);
    expect(oneQueued.intents).toContainEqual(
      expect.objectContaining({
        kind: "produce",
        objectName: ObjectNames.TivaraSlingshotFemale
      })
    );
  });
});
