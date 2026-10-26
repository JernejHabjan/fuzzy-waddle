import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResearchType,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import { AiAdaptationManager } from "./ai-adaptation-manager";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);

const catalog: AiCapabilityCatalogV1 = {
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

const airPressureCatalog: AiCapabilityCatalogV1 = {
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
): AiObservedActorV1 {
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
  actors: AiObservationV1["actors"],
  researchCandidates: AiObservationV1["researchCandidates"] = []
): AiObservationV1 {
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

  it("TECH-03/04 records one visible flyer as persisted evidence before it changes composition", () => {
    const main = actor("main", ObjectNames.Sandhold, "self", []);
    const flyer = actor("flyer", ObjectNames.TivaraSlingshotFemale, "enemy", ["air"]);
    const initial = createAiBrainStateV1({
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

  it("DOMAIN-02 treats a visible valuable shoreline objective as evidence for bounded naval control", () => {
    const base = createAiTestObservation();
    const access = buildAiAccessGraphV1({
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
    const navalCatalog: AiCapabilityCatalogV1 = {
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
    const initial = createAiBrainStateV1({
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
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:balanced"
    });
    const first = manager.propose(observation(100, [main, flyer]), initial);
    const poor: AiObservationV1 = {
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
    const initial = createAiBrainStateV1({
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
    const initial = createAiBrainStateV1({
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
    const candidate: AiObservationV1["researchCandidates"][number] = {
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
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:tech"
    });
    const funded = (actors: AiObservationV1["actors"]): AiObservationV1 => ({
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
    const queuedMain: AiObservedActorV1 = {
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
    const initial = createAiBrainStateV1({
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
    const withAcceptedCounter: AiBrainStateV1 = {
      ...initial,
      economyProduction: { ...initial.economyProduction, adaptation: second.statePatch!.adaptation! },
      reservations: [
        {
          claimId: "claim:stage14:anti_air:accepted" as AiBrainStateV1["reservations"][number]["claimId"],
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
    const naval = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:1:naval"
    });
    const fallback = manager.propose(observation(100, [main]), naval);
    expect(fallback.statePatch?.openingArchetypeId).toBe(`opening:${FactionType.Tivara}:balanced`);
    const balanced = createAiBrainStateV1({
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
    const initial = createAiBrainStateV1({
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
    const initial = createAiBrainStateV1({
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
