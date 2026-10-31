import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";

import { AiMacroManager } from "./ai-macro-manager";
import { catalog, completedOpeningState } from "./ai-macro-test-fixtures";

describe("AI macro production demand", () => {
  it("uses every free producer and permits repeated useful unit types", () => {
    const state = completedOpeningState();
    const oneTypeCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: catalog.entries.map((entry) =>
        entry.sourceObjectName === ObjectNames.AnkGuard
          ? { ...entry, produces: [ObjectNames.TivaraMacemanMale] }
          : entry
      )
    };
    const actors = [
      ...Array.from({ length: 6 }, (_, index) => createAiTestOwnedActor(`worker-${index}`)),
      { ...createAiTestOwnedActor("producer-1"), objectName: ObjectNames.AnkGuard },
      { ...createAiTestOwnedActor("producer-2"), objectName: ObjectNames.AnkGuard }
    ];

    const proposal = new AiMacroManager(() => oneTypeCatalog).propose(
      { ...createAiTestObservation(), tick: 200, actors },
      state
    );
    const composition = proposal.intents.filter(
      (intent) => intent.kind === "produce" && intent.demandId === "demand:composition:first-squad"
    );

    expect(composition).toHaveLength(2);
    expect(composition.map((intent) => (intent.kind === "produce" ? intent.objectName : null))).toEqual([
      ObjectNames.TivaraMacemanMale,
      ObjectNames.TivaraMacemanMale
    ]);
    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.AnkGuard)
    ).toBe(false);
  });

  it("stops production and capacity admission after ready and queued commitments satisfy demand", () => {
    const state = completedOpeningState();
    const military = Array.from({ length: 10 }, (_, index) => ({
      ...createAiTestOwnedActor(`military-${index}`),
      objectName: ObjectNames.TivaraMacemanMale
    }));
    const queuedProducer = (id: string) => ({
      ...createAiTestOwnedActor(id),
      objectName: ObjectNames.AnkGuard,
      queue: {
        status: "known" as const,
        value: {
          capacity: 2,
          occupied: 1,
          itemIds: [`${id}:queue`],
          items: [
            {
              itemId: `${id}:queue`,
              kind: "production" as const,
              objectName: ObjectNames.TivaraMacemanMale,
              researchType: null
            }
          ]
        },
        observedTick: 200
      }
    });
    const proposal = new AiMacroManager(() => catalog).propose(
      {
        ...createAiTestObservation(),
        tick: 200,
        actors: [queuedProducer("producer-1"), queuedProducer("producer-2"), ...military]
      },
      state
    );

    expect(proposal.intents.some((intent) => intent.kind === "produce")).toBe(false);
    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.AnkGuard)
    ).toBe(false);
  });

  it("selects an affordable composition unit and reserves its resources for the decision", () => {
    const state = completedOpeningState();
    const resourceCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: catalog.entries.map((entry) => {
        if (entry.sourceObjectName === ObjectNames.TivaraMacemanMale)
          return {
            ...entry,
            family: "frontline",
            constructionProfile: {
              resourceCost: { [ResourceType.Food]: 100 },
              footprintRadiusTiles: 0,
              visionRange: 8,
              navigableHeight: null,
              enterHeight: null,
              exitHeight: null
            }
          };
        if (entry.sourceObjectName === ObjectNames.TivaraSlingshotFemale)
          return {
            ...entry,
            family: "frontline",
            constructionProfile: {
              resourceCost: { [ResourceType.Food]: 50 },
              footprintRadiusTiles: 0,
              visionRange: 8,
              navigableHeight: null,
              enterHeight: null,
              exitHeight: null
            }
          };
        return entry;
      })
    };
    const resources = [
      ...createAiTestObservation().resources,
      {
        resourceType: ResourceType.Food,
        stockpile: 60,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known" as const, value: 0, observedTick: 200 }
      }
    ];
    const proposal = new AiMacroManager(() => resourceCatalog).propose(
      {
        ...createAiTestObservation(),
        tick: 200,
        resources,
        actors: [
          ...Array.from({ length: 6 }, (_, index) => createAiTestOwnedActor(`worker-${index}`)),
          { ...createAiTestOwnedActor("producer-1"), objectName: ObjectNames.AnkGuard },
          { ...createAiTestOwnedActor("producer-2"), objectName: ObjectNames.AnkGuard }
        ]
      },
      state
    );
    const composition = proposal.intents.filter((intent) => intent.kind === "produce");

    expect(composition).toHaveLength(1);
    expect(composition[0]).toEqual(
      expect.objectContaining({ objectName: ObjectNames.TivaraSlingshotFemale, producerId: "producer-1" })
    );
  });

  it("reserves scarce food for workforce recovery before optional reinforcements", () => {
    const proposal = new AiMacroManager(() => catalog).propose(
      {
        ...createAiTestObservation(),
        tick: 200,
        actors: [
          createAiTestOwnedActor("worker"),
          { ...createAiTestOwnedActor("main"), objectName: ObjectNames.Sandhold },
          { ...createAiTestOwnedActor("producer"), objectName: ObjectNames.AnkGuard },
          { ...createAiTestOwnedActor("military"), objectName: ObjectNames.TivaraMacemanMale }
        ],
        resources: [
          ...createAiTestObservation().resources,
          {
            resourceType: ResourceType.Food,
            stockpile: 100,
            reservedUnspent: 0,
            obligationsDue: 0,
            deliveredIncomePerMinute: { status: "known" as const, value: 0, observedTick: 200 }
          }
        ]
      },
      completedOpeningState()
    );
    const produced = proposal.intents.flatMap((intent) => (intent.kind === "produce" ? [intent.objectName] : []));

    expect(produced).toContain(ObjectNames.TivaraWorker);
    expect(produced).not.toContain(ObjectNames.TivaraMacemanMale);
    expect(produced).not.toContain(ObjectNames.TivaraSlingshotFemale);
  });

  it("keeps land-force demand and throughput separate from air and naval production", () => {
    const state = completedOpeningState();
    const domainCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: [
        ...catalog.entries.map((entry) =>
          entry.sourceObjectName === ObjectNames.Sandhold
            ? { ...entry, produces: [...entry.produces, ObjectNames.VikingBoat] }
            : entry
        ),
        {
          capabilityId: "naval",
          family: "naval",
          sourceObjectName: ObjectNames.VikingBoat,
          effectiveLevel: 1,
          movementDomains: ["water"],
          targetDomains: ["ground", "water"],
          produces: [],
          constructs: [],
          researches: [],
          gathers: [],
          housingCapacity: null,
          housingCost: 1,
          cargoCapacity: null
        },
        {
          capabilityId: "air",
          family: "air",
          sourceObjectName: ObjectNames.SkaduweeOwl,
          effectiveLevel: 1,
          movementDomains: ["air"],
          targetDomains: ["ground", "air"],
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
    for (const [readyForce, desiredProducers] of [
      [3, 2],
      [10, 1]
    ] as const) {
      const military = Array.from({ length: readyForce }, (_, index) => ({
        ...createAiTestOwnedActor(`military-${index}`),
        objectName: ObjectNames.TivaraMacemanMale
      }));
      const proposal = new AiMacroManager(() => domainCatalog).propose(
        {
          ...createAiTestObservation(),
          tick: 200,
          actors: [
            ...military,
            { ...createAiTestOwnedActor("producer"), objectName: ObjectNames.AnkGuard },
            { ...createAiTestOwnedActor("main"), objectName: ObjectNames.Sandhold },
            { ...createAiTestOwnedActor("air-unit"), objectName: ObjectNames.SkaduweeOwl },
            { ...createAiTestOwnedActor("naval-unit"), objectName: ObjectNames.VikingBoat }
          ]
        },
        state
      );

      expect(
        proposal.statePatch?.economyProduction?.demands.find((demand) => demand.purpose === "dated_ground_pressure")
      ).toMatchObject({
        desired: 12,
        satisfiedActorIds: expect.arrayContaining(military.map((actor) => actor.actorId))
      });
      expect(
        proposal.statePatch?.economyProduction?.demands.find((demand) => demand.purpose === "dated_military_throughput")
      ).toMatchObject({ desired: desiredProducers, satisfiedActorIds: ["producer"] });
    }
  });
});
