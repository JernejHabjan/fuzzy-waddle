import { FactionType, ObjectNames, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiReservationV1 } from "../contracts/ai-dependency-contracts";
import { AiMacroManager } from "../planning/ai-macro-manager";
import type { AiManagerProposalV1 } from "../planning/ai-manager-proposal";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "./ai-test-fixtures";

interface AiProductionPureScenarioV1 {
  readonly scenarioId: "PRO-01" | "PRO-02" | "PRO-03" | "PRO-04" | "PRO-05";
  readonly purpose: string;
  readonly execute: () => { readonly subject: AiManagerProposalV1; readonly control?: AiManagerProposalV1 };
  readonly assertSemanticEffect: (result: ReturnType<AiProductionPureScenarioV1["execute"]>) => void;
}

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
      constructs: [ObjectNames.AnkGuard],
      researches: [],
      gathers: [ResourceType.Wood, ResourceType.Food],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    },
    {
      capabilityId: "producer",
      family: "producer",
      sourceObjectName: ObjectNames.AnkGuard,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [ObjectNames.TivaraMacemanMale, ObjectNames.TivaraSlingshotFemale],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 200 },
        footprintRadiusTiles: 0,
        visionRange: 6,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    },
    {
      capabilityId: "frontline",
      family: "frontline",
      sourceObjectName: ObjectNames.TivaraMacemanMale,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: ["ground"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    },
    {
      capabilityId: "ranged",
      family: "ranged",
      sourceObjectName: ObjectNames.TivaraSlingshotFemale,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: ["ground"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    }
  ]
};

function completedOpeningState() {
  return createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
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

function workers() {
  return Array.from({ length: 6 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
}

function producer(actorId: string) {
  return { ...createAiTestOwnedActor(actorId), objectName: ObjectNames.AnkGuard };
}

function constructionCells() {
  return Array.from({ length: 25 }, (_, index) => {
    const x = 7 + (index % 5);
    const y = 7 + Math.floor(index / 5);
    return {
      tileKey: `${x},${y}`,
      position: { x, y, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    };
  });
}

function propose(
  actors: ReturnType<typeof createAiTestObservation>["actors"],
  catalogInput = catalog,
  state = completedOpeningState()
): AiManagerProposalV1 {
  const observation = createAiTestObservation();
  return new AiMacroManager(() => catalogInput).propose(
    {
      ...observation,
      tick: 200,
      actors,
      map: { ...observation.map!, constructionCells: constructionCells() }
    },
    state
  );
}

function production(intents: readonly AiIntentV1[]) {
  return intents.filter((intent) => intent.kind === "produce" && intent.demandId === "demand:composition:first-squad");
}

function capacityConstruction(intents: readonly AiIntentV1[]): readonly Extract<AiIntentV1, { readonly kind: "construct" }>[] {
  return intents.filter(
    (intent): intent is Extract<AiIntentV1, { readonly kind: "construct" }> =>
      intent.kind === "construct" && intent.demandId === "demand:capacity:first-army"
  );
}

function oneTypeCatalog(): AiCapabilityCatalogV1 {
  return {
    ...catalog,
    entries: catalog.entries.map((entry) =>
      entry.sourceObjectName === ObjectNames.AnkGuard
        ? { ...entry, produces: [ObjectNames.TivaraMacemanMale] }
        : entry.sourceObjectName === ObjectNames.TivaraMacemanMale
          ? { ...entry, constructionProfile: {
              resourceCost: { [ResourceType.Wood]: 35 }, footprintRadiusTiles: 0, visionRange: 6,
              navigableHeight: null, enterHeight: null, exitHeight: null
            } }
          : entry
    )
  };
}

/** Existing useful copies remain legal beneficiaries; producer lane occupancy is observed separately. */
function repeatedArmy(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ...createAiTestOwnedActor(`military-${index}`),
    objectName: ObjectNames.TivaraMacemanMale
  }));
}

/** A real typed queue commitment fills a deficit even while another producer's lane remains idle. */
function queuedProducer(count: number) {
  const items = Array.from({ length: count }, (_, index) => ({
    itemId: `queued-${index}`, kind: "production" as const, objectName: ObjectNames.TivaraMacemanMale, researchType: null
  }));
  return {
    ...producer("producer-1"),
    queue: { status: "known" as const, observedTick: 200,
      value: { capacity: 5, occupied: count, itemIds: items.map((item) => item.itemId), items } }
  };
}

const scenarios: readonly AiProductionPureScenarioV1[] = [
  {
    scenarioId: "PRO-01",
    purpose: "A dated twelve-unit force prebuilds exactly one additional producer when one cannot provide throughput.",
    execute: () => ({ subject: propose([...workers(), producer("producer-1")]) }),
    assertSemanticEffect: ({ subject }) => {
      expect(capacityConstruction(subject.intents)).toHaveLength(1);
      expect(production(subject.intents)).toHaveLength(1);
      expect(subject.statePatch?.economyProduction?.demands).toEqual(
        expect.arrayContaining([expect.objectContaining({ purpose: "dated_military_throughput", desired: 2 })])
      );
    }
  },
  {
    scenarioId: "PRO-02",
    purpose: "Existing capacity prevents a cash-only extra producer request.",
    execute: () => ({ subject: propose([...workers(), producer("producer-1"), producer("producer-2")]) }),
    assertSemanticEffect: ({ subject }) => {
      expect(capacityConstruction(subject.intents)).toHaveLength(0);
      expect(production(subject.intents)).toHaveLength(2);
      expect(subject.statePatch?.economyProduction?.demands).toEqual(
        expect.arrayContaining([expect.objectContaining({ purpose: "dated_land_pressure", desired: 12 })])
      );
    }
  },
  {
    scenarioId: "PRO-03",
    purpose: "Capacity is prebuilt before the dated force is complete, rather than after its queue is saturated.",
    execute: () => ({ subject: propose([...workers(), producer("producer-1")]) }),
    assertSemanticEffect: ({ subject }) => {
      expect(capacityConstruction(subject.intents)[0]).toMatchObject({ objectName: ObjectNames.AnkGuard });
      expect(capacityConstruction(subject.intents)[0]?.reasonCode).toContain("dated_target=12");
    }
  },
  {
    scenarioId: "PRO-04",
    purpose: "Ten useful copies admit two priced copies; the otherwise identical satisfied force stops excess production.",
    execute: () => ({
      subject: propose([...workers(), producer("producer-1"), producer("producer-2"), ...repeatedArmy(10)], oneTypeCatalog()),
      control: propose([...workers(), producer("producer-1"), producer("producer-2"), ...repeatedArmy(12)], oneTypeCatalog())
    }),
    assertSemanticEffect: ({ subject, control }) => {
      expect(production(subject.intents)).toHaveLength(2);
      expect(production(subject.intents).every((intent) => intent.objectName === ObjectNames.TivaraMacemanMale)).toBe(
        true
      );
      expect(new Set(production(subject.intents).map((intent) => intent.effectId)).size).toBe(2);
      for (const intent of production(subject.intents)) {
        expect(intent.claims.filter((claim) => claim.kind === "resource"))
          .toEqual([expect.objectContaining({ resourceType: ResourceType.Wood, amount: 35 })]);
      }
      expect(production(control?.intents ?? [])).toHaveLength(0);
    }
  },
  {
    scenarioId: "PRO-05",
    purpose: "A producer loss recreates exactly one still-needed capacity commitment and never duplicates it.",
    execute: () => ({
      control: propose([...workers(), producer("producer-1"), producer("producer-2")]),
      subject: propose([...workers(), producer("producer-1")])
    }),
    assertSemanticEffect: ({ subject, control }) => {
      expect(capacityConstruction(control?.intents ?? [])).toHaveLength(0);
      expect(capacityConstruction(subject.intents)).toHaveLength(1);
      expect(new Set(capacityConstruction(subject.intents).map((intent) => intent.siteKey)).size).toBe(1);
    }
  }
];

describe("typed deterministic production scenarios", () => {
  it.each(scenarios)("$scenarioId: $purpose", (scenario) => {
    const runs = Array.from({ length: 3 }, () => scenario.execute());
    const digests = runs.map((result) => digestCanonicalAiValue(result));

    expect(new Set(digests).size).toBe(1);
    scenario.assertSemanticEffect(runs[0]!);
  });

  it("PRO-04 counts queued copies and unobserved leases before admitting another useful copy", () => {
    const execute = () => {
      const base = completedOpeningState();
      const state = { ...base, reservations: Array.from({ length: 2 }, (_, index) => ({
          claimId: `claim:composition:${index}`,
          subjectKey: `effect:composition:effect:${index}`,
          ownerPlanId: base.opening.plan.planId,
          state: { kind: "provisional", expiresAt: aiDeadline(400) },
          prerequisites: [], createdTick: 200
        } satisfies AiReservationV1)) };
      return {
        queued: propose([...workers(), queuedProducer(2), producer("producer-2"), ...repeatedArmy(10)], oneTypeCatalog()),
        leased: propose([...workers(), producer("producer-1"), producer("producer-2"), ...repeatedArmy(10)], oneTypeCatalog(), state),
        observed: propose([...workers(), queuedProducer(2), producer("producer-2"), ...repeatedArmy(10)], oneTypeCatalog(), state),
        oneMissing: propose([...workers(), producer("producer-1"), producer("producer-2"), ...repeatedArmy(11)], oneTypeCatalog())
      };
    };
    const result = execute();
    const runs = [result, execute(), execute()];
    expect(new Set(runs.map(digestCanonicalAiValue)).size).toBe(1);
    expect(production(result.queued.intents)).toHaveLength(0);
    expect(production(result.leased.intents)).toHaveLength(0);
    expect(production(result.observed.intents)).toHaveLength(0);
    expect(result.observed.statePatch?.economyProduction?.demands.find(
      (demand) => demand.demandId === "demand:composition:first-squad"
    )?.acceptedNotObservedEffectIds).toHaveLength(0);
    expect(production(result.oneMissing.intents)).toHaveLength(1);
  });

  it("PRO-04 preserves duplicate-unit decisions under set-valued actor and catalog ordering", () => {
    const actors = [...workers(), producer("producer-1"), producer("producer-2"), ...repeatedArmy(10)];
    const priced = oneTypeCatalog();
    const original = propose(actors, priced);
    const reordered = propose([...actors].reverse(), { ...priced, entries: [...priced.entries].reverse() });
    expect(digestCanonicalAiValue(reordered)).toBe(digestCanonicalAiValue(original));
    expect(production(reordered.intents)).toHaveLength(2);
  });
});
