import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResearchType,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createStage2Observation, createStage2OwnedActor } from "../testing/ai-stage-2-test-fixtures";
import { AiStage14AdaptationManagerV1 } from "./ai-stage-14-adaptation-manager";

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

function actor(
  id: string,
  objectName: ObjectNames,
  relation: "self" | "enemy",
  domains: readonly ("ground" | "water" | "air")[]
): AiObservedActorV1 {
  return {
    ...createStage2OwnedActor(id),
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
    ...createStage2Observation(),
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

describe("AiStage14AdaptationManagerV1", () => {
  const manager = new AiStage14AdaptationManagerV1(profile, () => catalog);

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

  it("TECH-01/02 scores only a legal upgrade and preserves survival over optional technology", () => {
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
    const quiet = manager.propose(
      observation(100, [main, slingshot], [candidate]),
      createAiBrainStateV1({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "opening:1:tech"
      })
    );
    expect(quiet.intents).toContainEqual(
      expect.objectContaining({ kind: "research", researchType: candidate.researchType })
    );
    const underAttack = manager.propose(
      observation(
        100,
        [main, slingshot, actor("enemy", ObjectNames.TivaraSlingshotFemale, "enemy", ["ground"])],
        [candidate]
      ),
      createAiBrainStateV1({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 0,
        archetypeId: "opening:1:tech"
      })
    );
    expect(underAttack.intents.some((intent) => intent.kind === "research")).toBe(false);
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
});
