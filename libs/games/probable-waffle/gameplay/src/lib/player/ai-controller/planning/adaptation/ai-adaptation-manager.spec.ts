import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResearchType,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainState } from "../../brain/state/create-ai-brain-state";
import { digestCanonicalAiValue } from "../../brain/persistence/canonical-ai-serialization";
import { aiDeadline } from "../../contracts/ai-core-types";
import type { AiCapabilityCatalog } from "../../contracts/observation/ai-capability-catalog";
import type { AiBrainState } from "../../contracts/state/ai-state-contracts";
import type { AiObservation, AiObservedActor } from "../../contracts/observation/ai-observation";
import { createAiProfileConfig } from "../../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../../testing/fixtures/coordination/ai-test-fixtures";
import { buildAiAccessGraph } from "../access/ai-access-graph";
import { AiAdaptationManager } from "./ai-adaptation-manager";

const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);

const catalog: AiCapabilityCatalog = {
  schemaVersion: 1,
  generation: 1,
  entries: [
    {
      capabilityId: "main",
      family: "producer",
      sourceObjectName: ObjectNames.Sandhold,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [ObjectNames.TivaraSlingshotFemale],
      constructs: [],
      researches: [ResearchType.TivaraSlingshotUpgradeLevel2],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null
    },
    {
      capabilityId: "anti-air",
      family: "ranged",
      sourceObjectName: ObjectNames.TivaraSlingshotFemale,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: ["ground", "water", "air"],
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
    },
    {
      capabilityId: "boat",
      family: "ranged",
      sourceObjectName: ObjectNames.VikingBoat,
      effectiveLevel: 1,
      movementDomains: ["water"],
      targetDomains: ["water"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    }
  ],
  unsupported: []
};

const airPressureCatalog: AiCapabilityCatalog = {
  ...catalog,
  entries: [
    ...catalog.entries,
    {
      capabilityId: "air-producer",
      family: "producer",
      sourceObjectName: ObjectNames.Temple,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [ObjectNames.Banshee],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null
    },
    {
      capabilityId: "air-pressure",
      family: "air_attack",
      sourceObjectName: ObjectNames.Banshee,
      effectiveLevel: 1,
      movementDomains: ["air"],
      targetDomains: ["ground"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Food]: 100, [ResourceType.Wood]: 40 },
        footprintRadiusTiles: 0,
        visionRange: 8,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    }
  ]
};

function actor(
  id: string,
  objectName: ObjectNames,
  relation: "self" | "enemy",
  domains: readonly ("ground" | "water" | "air")[]
): AiObservedActor {
  return {
    ...createAiTestOwnedActor(id),
    objectName,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? ("owned" as const) : ("visible" as const),
    evidenceId: `evidence:${id}`,
    capabilities: [
      {
        id: `${id}:movement`,
        family: "attack",
        level: 1,
        domains,
        targetDomains: domains.includes("air") ? (["air"] as const) : (["ground"] as const),
        capacity: { status: "known" as const, value: 0, observedTick: 100 }
      }
    ]
  };
}

function observation(
  tick: number,
  actors: AiObservation["actors"],
  researchCandidates: AiObservation["researchCandidates"] = []
): AiObservation {
  return {
    ...createAiTestObservation(),
    tick,
    actors,
    researchCandidates,
    threatSummary: {
      observedTick: tick,
      visibleEnemyActorIds: actors.filter((entry) => entry.relation === "enemy").map((entry) => entry.actorId),
      rememberedEnemyActorIds: [],
      observedCapabilityFamilies: ["attack"]
    }
  };
}

describe("AiAdaptationManager", () => {
  const manager = new AiAdaptationManager(profile, () => catalog);

  it("waits for a counter unit's required building to be finished before proposing production", () => {
    const counterCatalog: AiCapabilityCatalog = {
      ...catalog,
      entries: catalog.entries.map((entry) =>
        entry.sourceObjectName === ObjectNames.TivaraSlingshotFemale && entry.constructionProfile
          ? {
              ...entry,
              constructionProfile: { ...entry.constructionProfile, requiredObjectNames: [ObjectNames.Temple] }
            }
          : entry
      )
    };
    const planner = new AiAdaptationManager(profile, () => counterCatalog);
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const temple = actor("temple", ObjectNames.Temple, "self", []);
    const unfinished: AiObservedActor = {
      ...temple,
      constructionProgress: { status: "known", value: 50, observedTick: 140 }
    };
    const flyers = [1, 2, 3].map((id) => actor(`owl-${id}`, ObjectNames.SkaduweeOwl, "enemy", ["air"]));
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const first = planner.propose(observation(100, [main, ...flyers]), initial);
    if (!first.statePatch?.adaptation) throw new Error("missing_adaptation_state");
    const state = {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: first.statePatch.adaptation }
    };
    for (const actors of [
      [main, ...flyers],
      [main, unfinished, ...flyers]
    ]) {
      const proposal = planner.propose(observation(140, actors), state);
      expect(proposal.intents.filter((intent) => intent.kind === "produce")).toEqual([]);
      expect(
        proposal.statePatch?.adaptationDemands?.find((demand) => demand.capabilityOrRole === "anti_air")?.desired
      ).toBe(3);
    }
    const counter = counterCatalog.entries.find(
      (entry) => entry.sourceObjectName === ObjectNames.TivaraSlingshotFemale
    );
    if (!counter?.constructionProfile) throw new Error("counter_catalog_missing");
    const alternatives: AiCapabilityCatalog = {
      ...counterCatalog,
      entries: [
        ...counterCatalog.entries.map((entry) =>
          entry.sourceObjectName === ObjectNames.Sandhold
            ? { ...entry, produces: [...entry.produces, ObjectNames.TivaraAlchemist] }
            : entry
        ),
        {
          ...counter,
          sourceObjectName: ObjectNames.TivaraAlchemist,
          capabilityId: "alternative-counter",
          constructionProfile: {
            ...counter.constructionProfile,
            requiredObjectNames: [],
            resourceCost: { [ResourceType.Wood]: 50 }
          }
        }
      ]
    };
    const alternative = new AiAdaptationManager(profile, () => alternatives).propose(
      observation(140, [main, ...flyers]),
      state
    );
    expect(alternative.intents).toContainEqual(
      expect.objectContaining({
        kind: "produce",
        objectName: ObjectNames.TivaraAlchemist
      })
    );
    const ready = planner.propose(observation(160, [main, temple, ...flyers]), state);
    expect(ready.intents).toContainEqual(
      expect.objectContaining({
        kind: "produce",
        producerId: main.actorId,
        objectName: ObjectNames.TivaraSlingshotFemale
      })
    );
  });

  it("waits for an unfinished counter producer to complete before assigning production", () => {
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const building: AiObservedActor = {
      ...main,
      constructionProgress: { status: "known", value: 50, observedTick: 140 }
    };
    const flyers = [1, 2, 3].map((id) => actor(`owl-${id}`, ObjectNames.SkaduweeOwl, "enemy", ["air"]));
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const first = manager.propose(observation(100, [building, ...flyers]), initial);
    if (!first.statePatch?.adaptation) throw new Error("missing_adaptation_state");
    const state = {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: first.statePatch.adaptation }
    };
    const incomplete = manager.propose(observation(140, [building, ...flyers]), state);
    expect(incomplete.intents.filter((intent) => intent.kind === "produce")).toEqual([]);
    const finished = manager.propose(observation(160, [main, ...flyers]), state);
    expect(finished.intents).toContainEqual(
      expect.objectContaining({
        kind: "produce",
        producerId: main.actorId,
        objectName: ObjectNames.TivaraSlingshotFemale
      })
    );
    const unfinishedCounter: AiObservedActor = {
      ...actor("unfinished-counter", ObjectNames.TivaraSlingshotFemale, "self", ["ground"]),
      constructionProgress: { status: "known", value: 50, observedTick: 160 }
    };
    const underConstruction = manager.propose(observation(160, [main, unfinishedCounter, ...flyers]), state);
    expect(
      underConstruction.statePatch?.adaptationDemands?.find((demand) => demand.capabilityOrRole === "anti_air")
        ?.satisfiedActorIds
    ).toEqual([]);
    expect(underConstruction.intents).toContainEqual(
      expect.objectContaining({
        kind: "produce",
        producerId: main.actorId
      })
    );
  });

  it.each(["missing", "busy"] as const)(
    "waits for a %s counter producer and resumes when it is available",
    (constraint) => {
      const main = actor("main", ObjectNames.Sandhold, "self", []);
      const flyers = [1, 2, 3].map((id) => actor(`owl-${id}`, ObjectNames.SkaduweeOwl, "enemy", ["air"]));
      const initial = createAiBrainState({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "opening:1:balanced"
      });
      const busy: AiObservedActor = {
        ...main,
        queue: {
          status: "known",
          observedTick: 140,
          value: {
            capacity: 1,
            occupied: 1,
            itemIds: ["paid-worker"],
            items: [
              {
                itemId: "paid-worker",
                kind: "production",
                objectName: ObjectNames.TivaraWorkerMale,
                researchType: null
              }
            ]
          }
        }
      };
      const withAdaptation = (tick: number, actors: AiObservedActor[], state: AiBrainState) => {
        const proposal = manager.propose(observation(tick, actors), state);
        return {
          proposal,
          state: {
            ...state,
            economyProduction: { ...state.economyProduction, adaptation: proposal.statePatch!.adaptation! }
          }
        };
      };
      const first = withAdaptation(100, [main, ...flyers], initial);
      const constrained = withAdaptation(140, constraint === "missing" ? flyers : [busy, ...flyers], first.state);
      expect(constrained.proposal.intents).toEqual([]);
      const recovered = manager.propose(observation(180, [main, ...flyers]), constrained.state);
      expect(recovered.intents).toContainEqual(
        expect.objectContaining({
          kind: "produce",
          producerId: main.actorId,
          objectName: ObjectNames.TivaraSlingshotFemale
        })
      );
    }
  );

  it("TECH-03/04 records one visible flyer as persisted evidence before it changes composition", () => {
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const flyer = actor("flyer", ObjectNames.TivaraSlingshotFemale, "enemy", ["air"]);
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const first = manager.propose(observation(100, [main, flyer]), initial);
    expect(first.intents.some((intent) => intent.reasonCode.startsWith("adapt:anti_air"))).toBe(false);
    expect(first.statePatch?.adaptation?.evidence).toContainEqual(
      expect.objectContaining({ kind: "flyer", consecutiveEvaluations: 1 })
    );

    const second = manager.propose(observation(140, [main, flyer]), {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: first.statePatch!.adaptation! }
    });
    expect(second.intents).toContainEqual(
      expect.objectContaining({
        kind: "produce",
        objectName: ObjectNames.TivaraSlingshotFemale,
        claims: expect.arrayContaining([
          expect.objectContaining({ kind: "resource", resourceType: ResourceType.Wood, amount: 40 })
        ])
      })
    );
    expect(second.statePatch?.adaptation?.activeRoleTargets).toContainEqual(
      expect.objectContaining({ role: "anti_air", desired: 1 })
    );
  });

  it.each([0, 1])(
    "admits confirmed anti-air growth during an unrelated composition cooldown (prior=%i)",
    (priorDesired) => {
      const main = actor("main", ObjectNames.Sandhold, "self", []);
      const flyers = [1, 2, 3].map((id) => actor(`flyer-${id}`, ObjectNames.Banshee, "enemy", ["air"]));
      const initial = createAiBrainState({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "opening:1:balanced"
      });
      const adaptation = {
        ...initial.economyProduction.adaptation,
        lastTransitionTick: 100,
        lastTransitionReason: "water_control",
        activeRoleTargets: [
          { role: "water_control" as const, desired: 1, evidenceIds: [] },
          ...(priorDesired ? [{ role: "anti_air" as const, desired: priorDesired, evidenceIds: [] }] : [])
        ]
      };
      const first = manager.propose(observation(110, [main, ...flyers]), {
        ...initial,
        economyProduction: { ...initial.economyProduction, adaptation }
      });
      expect(first.intents.some((intent) => intent.reasonCode.startsWith("adapt:anti_air"))).toBe(false);
      const second = manager.propose(observation(120, [main, ...flyers]), {
        ...initial,
        economyProduction: { ...initial.economyProduction, adaptation: first.statePatch!.adaptation! }
      });
      expect(second.statePatch?.adaptationDemands).toContainEqual(
        expect.objectContaining({ capabilityOrRole: "anti_air", desired: 3 })
      );
      expect(second.intents).toContainEqual(
        expect.objectContaining({ kind: "produce", objectName: ObjectNames.TivaraSlingshotFemale })
      );
      expect(second.statePatch?.adaptation?.activeRoleTargets).toContainEqual(
        expect.objectContaining({ role: "anti_air", desired: 3 })
      );
      expect(second.statePatch?.adaptation?.activeRoleTargets).toContainEqual(
        expect.objectContaining({ role: "water_control", desired: 1 })
      );
      expect(second.statePatch?.adaptation?.lastTransitionTick).toBe(100);
    }
  );

  it.each(["producer_clue", "memory"])("keeps composition cooldown for %s without confirmed live flyers", (source) => {
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const flyer = actor("flyer", ObjectNames.Banshee, "enemy", ["air"]);
    const contact: AiObservedActor =
      source === "memory"
        ? { ...flyer, visibility: "last_seen" }
        : { ...flyer, capabilities: [{ ...flyer.capabilities[0]!, family: "produce_air", domains: [] }] };
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const first = manager.propose(observation(110, [main, contact]), {
      ...initial,
      economyProduction: {
        ...initial.economyProduction,
        adaptation: { ...initial.economyProduction.adaptation, lastTransitionTick: 100 }
      }
    });
    const second = manager.propose(observation(120, [main, contact]), {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: first.statePatch!.adaptation! }
    });
    expect(second.intents.some((intent) => intent.reasonCode.startsWith("adapt:anti_air"))).toBe(false);
    expect(second.statePatch?.adaptation?.activeRoleTargets).toEqual([]);
    expect(second.statePatch?.adaptation?.lastTransitionTick).toBe(100);
  });

  it("DOMAIN-02 treats a visible valuable shoreline objective as evidence for bounded naval control", () => {
    const base = createAiTestObservation();
    const access = buildAiAccessGraph({
      generation: 1,
      staticRevision: 1,
      dynamicRevision: 1,
      threatRevision: 0,
      builtTick: 100,
      continuationCursor: 0,
      includeAirRegion: true,
      cells: [
        {
          x: 0,
          y: 0,
          ground: true,
          water: false,
          elevation: 0,
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        },
        {
          x: 1,
          y: 0,
          ground: false,
          water: true,
          elevation: 0,
          groundNeighborKeys: [],
          knowledge: "known_static",
          clearance: 2
        }
      ]
    });
    const shorelineNode = access.groundNodeByTileKey.get("0,0");
    if (!shorelineNode) throw new Error("test_shoreline_ground_node_missing");
    const shoreline = {
      ...actor("coastal-workmill", ObjectNames.WorkMill, "enemy", []),
      accessNodeId: {
        status: "known" as const,
        value: shorelineNode,
        observedTick: 100
      },
      capabilities: [
        {
          id: "coastal-workmill:drop-off",
          family: "drop_off",
          level: 1,
          domains: [],
          targetDomains: [],
          capacity: { status: "known" as const, value: 0, observedTick: 100 }
        }
      ]
    };
    const navalCatalog: AiCapabilityCatalog = {
      ...catalog,
      entries: [
        ...catalog.entries.map((entry) =>
          entry.sourceObjectName === ObjectNames.Sandhold
            ? { ...entry, produces: [...entry.produces, ObjectNames.VikingBoat] }
            : entry
        ),
        {
          capabilityId: "viking-boat",
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
    const navalManager = new AiAdaptationManager(profile, () => navalCatalog);
    const main = { ...createAiTestOwnedActor("main"), objectName: ObjectNames.Sandhold };
    const makeObservation = (tick: number) => ({
      ...base,
      tick,
      actors: [main, shoreline],
      map: {
        bounds: { status: "known" as const, value: { width: 2, height: 1 }, observedTick: tick },
        staticRevision: 1,
        frontierAccessNodeIds: [],
        scoutCoverageAccessNodeIds: [],
        dynamicObstacleActorIds: [],
        regionGeneration: { generation: 1, status: "ready" as const, continuationCursor: 0 },
        accessGraph: access.graph
      }
    });
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });

    const first = navalManager.propose(makeObservation(100), initial);
    expect(
      first.intents.some((intent) => intent.kind === "produce" && intent.objectName === ObjectNames.VikingBoat)
    ).toBe(false);
    expect(first.statePatch?.adaptation?.evidence).toContainEqual(
      expect.objectContaining({ kind: "water_or_transport", permittedFacts: ["visible_coastal_objective"] })
    );
    const firstAdaptation = first.statePatch?.adaptation;
    if (!firstAdaptation) throw new Error("test_coastal_adaptation_state_missing");

    const second = navalManager.propose(makeObservation(140), {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: firstAdaptation }
    });

    expect(second.intents).toContainEqual(
      expect.objectContaining({ kind: "produce", objectName: ObjectNames.VikingBoat })
    );
    expect(second.statePatch?.adaptationDemands).toContainEqual(
      expect.objectContaining({ demandId: "demand:adapt:water_control", desired: 1 })
    );
  });

  it("does not propose an evidence-backed counter that the current resource ledger cannot afford", () => {
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const flyer = actor("flyer", ObjectNames.TivaraSlingshotFemale, "enemy", ["air"]);
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const first = manager.propose(observation(100, [main, flyer]), initial);
    const poor: AiObservation = {
      ...observation(140, [main, flyer]),
      resources: [
        {
          resourceType: ResourceType.Wood,
          stockpile: 50,
          reservedUnspent: 20,
          obligationsDue: 10,
          deliveredIncomePerMinute: { status: "known", value: 0, observedTick: 140 }
        }
      ]
    };

    const second = manager.propose(poor, {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: first.statePatch!.adaptation! }
    });

    expect(second.intents.some((intent) => intent.kind === "produce")).toBe(false);
  });

  it("TECH-04 decays last-seen evidence without treating memory as another sighting", () => {
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const flyer = actor("flyer", ObjectNames.TivaraSlingshotFemale, "enemy", ["air"]);
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const visible = manager.propose(observation(100, [main, flyer]), initial);
    const rememberedFlyer = { ...flyer, visibility: "last_seen" as const, observedTick: 100 };
    const remembered = manager.propose(observation(140, [main, rememberedFlyer]), {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: visible.statePatch!.adaptation! }
    });

    expect(remembered.intents.some((intent) => intent.reasonCode.startsWith("adapt:anti_air"))).toBe(false);
    expect(remembered.statePatch?.adaptation?.evidence).toContainEqual(
      expect.objectContaining({
        kind: "flyer",
        confidencePermille: 660,
        consecutiveEvaluations: 0
      })
    );
  });

  it("does not classify a stationary container-bearing structure as naval transport evidence", () => {
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const structure = {
      ...actor("structure", ObjectNames.Sandhold, "enemy", ["water"]),
      housingCost: { status: "known" as const, value: 0, observedTick: 100 },
      containerState: {
        status: "known" as const,
        value: { capacity: 8, passengerIds: [], pendingPassengerIds: [], mobileDomains: [] },
        observedTick: 100
      }
    };
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });

    const proposal = manager.propose(observation(100, [main, structure]), initial);

    expect(proposal.statePatch?.adaptation?.evidence.some((entry) => entry.kind === "water_or_transport")).toBe(false);
  });

  it("TECH-01 TECH-02 delays expensive small-army research, funds useful mass, and protects survival", () => {
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const slingshot = actor("slingshot", ObjectNames.TivaraSlingshotFemale, "self", ["ground"]);
    const candidate: AiObservation["researchCandidates"][number] = {
      producerId: "main",
      researchType: ResearchType.TivaraSlingshotUpgradeLevel2,
      cost: { [ResourceType.Minerals]: 200, [ResourceType.Wood]: 150 },
      durationTicks: 800,
      refundPermille: 500,
      benefit: {
        kind: "unit_level",
        targetObjectName: ObjectNames.TivaraSlingshotFemale,
        targetLevel: 2,
        spellType: null
      }
    };
    const state = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:tech"
    });
    const funded = (actors: AiObservation["actors"]): AiObservation => ({
      ...observation(100, actors, [candidate]),
      resources: [ResourceType.Wood, ResourceType.Minerals].map((resourceType) => ({
        resourceType,
        stockpile: 1000,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known" as const, value: 100, observedTick: 100 }
      }))
    });
    const army = Array.from({ length: 4 }, (_, index) =>
      actor(`slingshot-${index}`, ObjectNames.TivaraSlingshotFemale, "self", ["ground"])
    );
    const early = Array.from({ length: 3 }, () => manager.propose(funded([main, slingshot]), state));
    const quiet = Array.from({ length: 3 }, () => manager.propose(funded([main, ...army]), state));
    const queuedMain: AiObservedActor = {
      ...main,
      queue: {
        status: "known",
        observedTick: 100,
        value: {
          capacity: 4,
          occupied: 3,
          itemIds: ["queue-1", "queue-2", "queue-3"],
          items: ["queue-1", "queue-2", "queue-3"].map((itemId) => ({
            itemId,
            kind: "production" as const,
            objectName: ObjectNames.TivaraSlingshotFemale,
            researchType: null
          }))
        }
      }
    };
    const committed = Array.from({ length: 3 }, () => manager.propose(funded([queuedMain, slingshot]), state));
    expect(new Set(early.map(digestCanonicalAiValue)).size).toBe(1);
    expect(new Set(quiet.map(digestCanonicalAiValue)).size).toBe(1);
    expect(new Set(committed.map(digestCanonicalAiValue)).size).toBe(1);
    expect(early[0]?.intents.some((intent) => intent.kind === "research")).toBe(false);
    expect(early[0]?.reasons).toContain("research:no_sufficient_legal_value");
    expect(quiet[0]?.intents).toContainEqual(
      expect.objectContaining({ kind: "research", researchType: candidate.researchType })
    );
    expect(committed[0]?.intents).toContainEqual(
      expect.objectContaining({ kind: "research", researchType: candidate.researchType })
    );
    const underAttack = Array.from({ length: 3 }, () =>
      manager.propose(
        funded([main, ...army, actor("enemy", ObjectNames.TivaraSlingshotFemale, "enemy", ["ground"])]),
        state
      )
    );
    expect(new Set(underAttack.map(digestCanonicalAiValue)).size).toBe(1);
    expect(underAttack[0]?.intents.some((intent) => intent.kind === "research")).toBe(false);
    expect(underAttack[0]?.reasons).toContain("research:survival_threat");
  });

  it("PRO-06/07 counts accepted counter production until reconciliation observes the completed actor", () => {
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const flyer = actor("flyer", ObjectNames.TivaraSlingshotFemale, "enemy", ["air"]);
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const first = manager.propose(observation(100, [main, flyer]), initial);
    const second = manager.propose(observation(140, [main, flyer]), {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: first.statePatch!.adaptation! }
    });
    const withAcceptedCounter: AiBrainState = {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: second.statePatch!.adaptation! },
      reservations: [
        {
          claimId: "claim:stage14:anti_air:accepted" as AiBrainState["reservations"][number]["claimId"],
          subjectKey: "effect:effect:stage14:anti_air:accepted",
          ownerPlanId: initial.opening.plan.planId,
          state: { kind: "provisional" as const, expiresAt: aiDeadline(220) },
          prerequisites: [],
          createdTick: 140
        }
      ]
    };
    const repeated = manager.propose(observation(180, [main, flyer]), withAcceptedCounter);

    expect(
      repeated.intents.some((intent) => intent.kind === "produce" && intent.reasonCode.startsWith("adapt:anti_air"))
    ).toBe(false);
    expect(repeated.statePatch?.adaptationDemands).toContainEqual(
      expect.objectContaining({
        demandId: "demand:adapt:anti_air",
        acceptedNotObservedEffectIds: ["effect:stage14:anti_air:accepted"]
      })
    );
  });

  it("DOMAIN-01/02 and D-05 fall back from an unsupported saved naval personality without rerolling a supported one", () => {
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const naval = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:naval"
    });
    const fallback = manager.propose(observation(100, [main]), naval);
    expect(fallback.statePatch?.openingArchetypeId).toBe(`opening:${FactionType.Tivara}:balanced`);
    const balanced = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    expect(manager.propose(observation(100, [main]), balanced).statePatch?.openingArchetypeId).toBeUndefined();
  });

  it("DOMAIN-05: produces one air unit for a confirmed exposed valuable objective", () => {
    const airManager = new AiAdaptationManager(profile, () => airPressureCatalog);
    const home = {
      ...createAiTestOwnedActor("air-home"),
      objectName: ObjectNames.Sandhold,
      logicalPosition: { status: "known" as const, value: { x: 0, y: 0, z: 0 }, observedTick: 100 },
      mainBuilding: { status: "known" as const, value: true, observedTick: 100 }
    };
    const producer = { ...createAiTestOwnedActor("air-producer"), objectName: ObjectNames.Temple };
    const target = {
      ...actor("backline-workmill", ObjectNames.WorkMill, "enemy", []),
      logicalPosition: { status: "known" as const, value: { x: 30, y: 30, z: 0 }, observedTick: 100 },
      capabilities: [
        {
          id: "backline-workmill:drop-off",
          family: "drop_off",
          level: 1,
          domains: [],
          targetDomains: [],
          capacity: { status: "known" as const, value: 0, observedTick: 100 }
        }
      ]
    };
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const makeObservation = (tick: number) => ({
      ...observation(tick, [home, producer, target]),
      resources: [ResourceType.Food, ResourceType.Wood].map((resourceType) => ({
        resourceType,
        stockpile: 2000,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known" as const, value: 30, observedTick: tick }
      }))
    });
    const first = airManager.propose(makeObservation(100), initial);
    expect(first.intents.some((intent) => intent.kind === "produce" && intent.objectName === ObjectNames.Banshee)).toBe(
      false
    );
    const second = airManager.propose(makeObservation(140), {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: first.statePatch!.adaptation! }
    });
    expect(second.statePatch?.adaptation?.evidence).toContainEqual(
      expect.objectContaining({ kind: "exposed_backline", consecutiveEvaluations: 2 })
    );
    expect(second.statePatch?.adaptationDemands).toContainEqual(
      expect.objectContaining({ demandId: "demand:adapt:air_pressure", desired: 1 })
    );
    expect(second.intents).toContainEqual(
      expect.objectContaining({
        kind: "produce",
        objectName: ObjectNames.Banshee,
        demandId: "demand:adapt:air_pressure"
      })
    );
  });

  it("DOMAIN-05: suppresses air demand for an irrelevant target or one covered by observed anti-air", () => {
    const airManager = new AiAdaptationManager(profile, () => airPressureCatalog);
    const home = {
      ...createAiTestOwnedActor("air-home"),
      objectName: ObjectNames.Sandhold,
      logicalPosition: { status: "known" as const, value: { x: 0, y: 0, z: 0 }, observedTick: 100 },
      mainBuilding: { status: "known" as const, value: true, observedTick: 100 }
    };
    const producer = { ...createAiTestOwnedActor("air-producer"), objectName: ObjectNames.Temple };
    const irrelevant = actor("irrelevant-worker", ObjectNames.TivaraWorkerMale, "enemy", []);
    const target = {
      ...actor("covered-workmill", ObjectNames.WorkMill, "enemy", []),
      logicalPosition: { status: "known" as const, value: { x: 30, y: 30, z: 0 }, observedTick: 100 },
      capabilities: [
        {
          id: "covered-workmill:drop-off",
          family: "drop_off",
          level: 1,
          domains: [],
          targetDomains: [],
          capacity: { status: "known" as const, value: 0, observedTick: 100 }
        }
      ]
    };
    const antiAirTower = {
      ...actor("anti-air-tower", ObjectNames.WatchTower, "enemy", []),
      logicalPosition: { status: "known" as const, value: { x: 34, y: 30, z: 0 }, observedTick: 100 },
      combatProfile: {
        status: "known" as const,
        observedTick: 100,
        value: {
          maxHealth: 100,
          maxArmour: 0,
          armourPermille: 1000,
          passiveRegenerationPerSecond: 0,
          healing: { amount: 0, cooldownTicks: 0, remainingCooldownTicks: 0, range: 0 },
          attacks: [
            {
              damage: 10,
              cooldownTicks: 20,
              range: 20,
              minRange: 0,
              highGroundRangeBonus: 0,
              impactDelayTicks: 0,
              areaRadius: 0,
              targetDomains: ["air" as const]
            }
          ],
          spells: [],
          statuses: []
        }
      }
    };
    const initial = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const irrelevantFirst = airManager.propose(observation(100, [home, producer, irrelevant]), initial);
    const irrelevantSecond = airManager.propose(observation(140, [home, producer, irrelevant]), {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: irrelevantFirst.statePatch!.adaptation! }
    });
    expect(
      irrelevantSecond.intents.some((intent) => intent.kind === "produce" && intent.objectName === ObjectNames.Banshee)
    ).toBe(false);

    const defendedFirst = airManager.propose(observation(100, [home, producer, target, antiAirTower]), initial);
    const defendedSecond = airManager.propose(observation(140, [home, producer, target, antiAirTower]), {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: defendedFirst.statePatch!.adaptation! }
    });
    expect(
      defendedSecond.intents.some((intent) => intent.kind === "produce" && intent.objectName === ObjectNames.Banshee)
    ).toBe(false);
  });
});
