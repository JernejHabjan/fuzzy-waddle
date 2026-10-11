import { FactionType, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";

import { aiDeadline } from "../contracts/ai-core-types";
import type { AiReservationV1 } from "../contracts/ai-dependency-contracts";
import { AiMacroManager } from "../planning/ai-macro-manager";

import { createAiProductionPolicyFixture } from "./ai-production-policy-fixture";
import { createAiTestObservation } from "./ai-test-fixtures";
import {
  type AiProductionPureScenarioV1,
  catalog,
  completedOpeningState,
  workers,
  producer,
  propose,
  production,
  capacityConstruction,
  oneTypeCatalog,
  repeatedArmy,
  queuedProducer
} from "./ai-production-scenario-test-fixtures";

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
        expect.arrayContaining([expect.objectContaining({ purpose: "dated_ground_pressure", desired: 12 })])
      );
    }
  },
  {
    scenarioId: "PRO-03",
    purpose: "An affordable observed objective commits fixed future dates and prebuilds before unit admission.",
    execute: () => {
      const { observation, state, catalog: timedCatalog } = createAiProductionPolicyFixture();
      return { subject: new AiMacroManager(() => timedCatalog).propose(observation, state) };
    },
    assertSemanticEffect: ({ subject }) => {
      const transition = subject.statePatch?.economyProduction?.transition;
      expect(transition).toMatchObject({
        status: "committed",
        committedTick: 200,
        beginsTick: 350,
        forceDeadlineTick: 750,
        desiredForce: 12,
        desiredProducers: 2
      });
      expect(subject.intents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "construct", planId: transition?.planId, objectName: ObjectNames.AnkGuard })
        ])
      );
      expect(subject.intents.some((intent) => intent.kind === "produce")).toBe(false);
    }
  },
  {
    scenarioId: "PRO-04",
    purpose:
      "Ten useful copies admit two priced copies; the otherwise identical satisfied force stops excess production.",
    execute: () => ({
      subject: propose(
        [...workers(), producer("producer-1"), producer("producer-2"), ...repeatedArmy(10)],
        oneTypeCatalog()
      ),
      control: propose(
        [...workers(), producer("producer-1"), producer("producer-2"), ...repeatedArmy(12)],
        oneTypeCatalog()
      )
    }),
    assertSemanticEffect: ({ subject, control }) => {
      expect(production(subject.intents)).toHaveLength(2);
      expect(production(subject.intents).every((intent) => intent.objectName === ObjectNames.TivaraMacemanMale)).toBe(
        true
      );
      expect(new Set(production(subject.intents).map((intent) => intent.effectId)).size).toBe(2);
      for (const intent of production(subject.intents)) {
        expect(intent.claims.filter((claim) => claim.kind === "resource")).toEqual([
          expect.objectContaining({ resourceType: ResourceType.Wood, amount: 35 })
        ]);
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
      const state = {
        ...base,
        reservations: Array.from(
          { length: 2 },
          (_, index) =>
            ({
              claimId: `claim:composition:${index}`,
              subjectKey: `effect:composition:effect:${index}`,
              ownerPlanId: base.opening.plan.planId,
              state: { kind: "provisional", expiresAt: aiDeadline(400) },
              prerequisites: [],
              createdTick: 200
            }) satisfies AiReservationV1
        )
      };
      return {
        queued: propose(
          [...workers(), queuedProducer(2), producer("producer-2"), ...repeatedArmy(10)],
          oneTypeCatalog()
        ),
        leased: propose(
          [...workers(), producer("producer-1"), producer("producer-2"), ...repeatedArmy(10)],
          oneTypeCatalog(),
          state
        ),
        observed: propose(
          [...workers(), queuedProducer(2), producer("producer-2"), ...repeatedArmy(10)],
          oneTypeCatalog(),
          state
        ),
        oneMissing: propose(
          [...workers(), producer("producer-1"), producer("producer-2"), ...repeatedArmy(11)],
          oneTypeCatalog()
        )
      };
    };
    const result = execute();
    const runs = [result, execute(), execute()];
    expect(new Set(runs.map(digestCanonicalAiValue)).size).toBe(1);
    expect(production(result.queued.intents)).toHaveLength(0);
    expect(production(result.leased.intents)).toHaveLength(0);
    expect(production(result.observed.intents)).toHaveLength(0);
    expect(
      result.observed.statePatch?.economyProduction?.demands.find(
        (demand) => demand.demandId === "demand:composition:first-squad"
      )?.acceptedNotObservedEffectIds
    ).toHaveLength(0);
    expect(production(result.oneMissing.intents)).toHaveLength(1);
  });

  it("PRO-04 uses priced affordability and shares a busy lane with an idle producer for both factions", () => {
    const base = createAiTestObservation();
    for (const faction of ["Tivara", "Skaduwee"] as const) {
      const factionType = faction === "Tivara" ? FactionType.Tivara : FactionType.Skaduwee;
      const unitName = faction === "Tivara" ? ObjectNames.TivaraMacemanMale : ObjectNames.SkaduweeWarriorMale;
      const producerName = faction === "Tivara" ? ObjectNames.AnkGuard : ObjectNames.InfantryInn;
      const priced = oneTypeCatalog(faction);
      const price = priced.entries.find((entry) => entry.sourceObjectName === unitName)?.constructionProfile
        ?.resourceCost.wood;
      expect(price).toBeDefined();
      const actors = [
        ...workers(faction),
        producer("producer-1", producerName),
        producer("producer-2", producerName),
        ...repeatedArmy(11, unitName)
      ];
      const withWood = (wood: number) => {
        const resources = [{ ...base.resources[0]!, stockpile: wood, reservedUnspent: 0, obligationsDue: 0 }];
        return propose(actors, priced, completedOpeningState(factionType), factionType, resources);
      };
      const exact = withWood(price!);
      const exactRuns = [exact, withWood(price!), withWood(price!)];
      expect(new Set(exactRuns.map(digestCanonicalAiValue)).size).toBe(1);
      expect(production(exact.intents)).toHaveLength(1);
      expect(production(withWood(price! - 1).intents)).toHaveLength(0);
      const reordered = propose(
        [...actors].reverse(),
        { ...priced, entries: [...priced.entries].reverse() },
        completedOpeningState(factionType),
        factionType,
        [{ ...base.resources[0]!, stockpile: price!, reservedUnspent: 0, obligationsDue: 0 }]
      );
      expect(digestCanonicalAiValue(reordered)).toBe(digestCanonicalAiValue(exact));

      const laneActors = [
        ...workers(faction),
        queuedProducer(1, producerName, unitName),
        producer("producer-2", producerName),
        ...repeatedArmy(10, unitName)
      ];
      const busyAndIdle = propose(laneActors, priced, completedOpeningState(factionType), factionType);
      const laneRuns = [
        busyAndIdle,
        propose(laneActors, priced, completedOpeningState(factionType), factionType),
        propose(laneActors, priced, completedOpeningState(factionType), factionType)
      ];
      expect(new Set(laneRuns.map(digestCanonicalAiValue)).size).toBe(1);
      const laneReordered = propose(
        [...laneActors].reverse(),
        { ...priced, entries: [...priced.entries].reverse() },
        completedOpeningState(factionType),
        factionType
      );
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
