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

function completedOpeningState(faction = FactionType.Tivara) {
  return createAiBrainStateV1({
    playerNumber: 1,
    faction,
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

function workers(faction: "Tivara" | "Skaduwee" = "Tivara") {
  const workerName = faction === "Tivara" ? ObjectNames.TivaraWorkerMale : ObjectNames.SkaduweeWorkerMale;
  return Array.from({ length: 6 }, (_, index) => ({
    ...createAiTestOwnedActor(`worker-${faction}-${index}`), objectName: workerName
  }));
}

function producer(actorId: string, objectName: ObjectNames = ObjectNames.AnkGuard) {
  return { ...createAiTestOwnedActor(actorId), objectName };
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
  state = completedOpeningState(),
  faction = FactionType.Tivara,
  resources = createAiTestObservation().resources
): AiManagerProposalV1 {
  const observation = createAiTestObservation();
  return new AiMacroManager(() => catalogInput).propose(
    {
      ...observation,
      faction,
      tick: 200,
      actors,
      resources,
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

function oneTypeCatalog(faction: "Tivara" | "Skaduwee" = "Tivara"): AiCapabilityCatalogV1 {
  const producerName = faction === "Tivara" ? ObjectNames.AnkGuard : ObjectNames.InfantryInn;
  const workerName = faction === "Tivara" ? ObjectNames.TivaraWorkerMale : ObjectNames.SkaduweeWorkerMale;
  const frontlineName = faction === "Tivara" ? ObjectNames.TivaraMacemanMale : ObjectNames.SkaduweeWarriorMale;
  const rangedName = faction === "Tivara" ? ObjectNames.TivaraSlingshotFemale : ObjectNames.SkaduweeRangedFemale;
  return {
    ...catalog,
    entries: catalog.entries.map((entry) =>
      entry.sourceObjectName === ObjectNames.TivaraWorker
        ? { ...entry, sourceObjectName: workerName }
        : entry.sourceObjectName === ObjectNames.AnkGuard
        ? { ...entry, sourceObjectName: producerName, produces: [frontlineName] }
        : entry.sourceObjectName === ObjectNames.TivaraMacemanMale
          ? { ...entry, sourceObjectName: frontlineName, constructionProfile: {
              resourceCost: { [ResourceType.Wood]: 35 }, footprintRadiusTiles: 0, visionRange: 6,
              navigableHeight: null, enterHeight: null, exitHeight: null
            } }
          : entry.sourceObjectName === ObjectNames.TivaraSlingshotFemale
            ? { ...entry, sourceObjectName: rangedName, produces: [] }
            : entry
    )
  };
}

/** Existing useful copies remain legal beneficiaries; producer lane occupancy is observed separately. */
function repeatedArmy(count: number, unitName: ObjectNames = ObjectNames.TivaraMacemanMale) {
  return Array.from({ length: count }, (_, index) => ({
    ...createAiTestOwnedActor(`military-${index}`),
    objectName: unitName
  }));
}

/** A real typed queue commitment fills a deficit even while another producer's lane remains idle. */
function queuedProducer(count: number, producerName: ObjectNames = ObjectNames.AnkGuard,
  unitName: ObjectNames = ObjectNames.TivaraMacemanMale) {
  const items = Array.from({ length: count }, (_, index) => ({
    itemId: `queued-${index}`, kind: "production" as const, objectName: unitName, researchType: null
  }));
  return {
    ...producer("producer-1", producerName),
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

  it("PRO-04 uses priced affordability and shares a busy lane with an idle producer for both factions", () => {
    const base = createAiTestObservation();
    for (const faction of ["Tivara", "Skaduwee"] as const) {
      const factionType = faction === "Tivara" ? FactionType.Tivara : FactionType.Skaduwee;
      const unitName = faction === "Tivara" ? ObjectNames.TivaraMacemanMale : ObjectNames.SkaduweeWarriorMale;
      const producerName = faction === "Tivara" ? ObjectNames.AnkGuard : ObjectNames.InfantryInn;
      const priced = oneTypeCatalog(faction);
      const price = priced.entries.find((entry) => entry.sourceObjectName === unitName)
        ?.constructionProfile?.resourceCost.wood;
      expect(price).toBeDefined();
      const actors = [...workers(faction), producer("producer-1", producerName), producer("producer-2", producerName),
        ...repeatedArmy(11, unitName)];
      const withWood = (wood: number) => {
        const resources = [{ ...base.resources[0]!, stockpile: wood, reservedUnspent: 0, obligationsDue: 0 }];
        return propose(actors, priced, completedOpeningState(factionType), factionType, resources);
      };
      const exact = withWood(price!);
      const exactRuns = [exact, withWood(price!), withWood(price!)];
      expect(new Set(exactRuns.map(digestCanonicalAiValue)).size).toBe(1);
      expect(production(exact.intents)).toHaveLength(1);
      expect(production(withWood(price! - 1).intents)).toHaveLength(0);
      const reordered = propose([...actors].reverse(), { ...priced, entries: [...priced.entries].reverse() },
        completedOpeningState(factionType), factionType,
        [{ ...base.resources[0]!, stockpile: price!, reservedUnspent: 0, obligationsDue: 0 }]);
      expect(digestCanonicalAiValue(reordered)).toBe(digestCanonicalAiValue(exact));

      const laneActors = [...workers(faction), queuedProducer(1, producerName, unitName),
        producer("producer-2", producerName), ...repeatedArmy(10, unitName)];
      const busyAndIdle = propose(laneActors, priced, completedOpeningState(factionType), factionType);
      const laneRuns = [busyAndIdle, propose(laneActors, priced, completedOpeningState(factionType), factionType),
        propose(laneActors, priced, completedOpeningState(factionType), factionType)];
      expect(new Set(laneRuns.map(digestCanonicalAiValue)).size).toBe(1);
      const laneReordered = propose([...laneActors].reverse(), { ...priced, entries: [...priced.entries].reverse() },
        completedOpeningState(factionType), factionType);
      expect(digestCanonicalAiValue(laneReordered)).toBe(digestCanonicalAiValue(busyAndIdle));
      expect(production(busyAndIdle.intents)).toHaveLength(1);
      expect(production(busyAndIdle.intents)[0]?.producerId).toBe("producer-2");
    }
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
