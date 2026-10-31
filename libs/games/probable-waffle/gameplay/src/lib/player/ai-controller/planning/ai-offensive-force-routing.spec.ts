import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import { guard, core, producer, world, brain, manager } from "./ai-offensive-opportunity-test-fixtures";
import { createAiSkirmishProposalContext } from "./ai-skirmish-proposal-draft";
import { selectAiOffensiveOpportunity } from "./select-ai-offensive-opportunity";

function flyer(id: string): AiObservedActorV1 {
  const actor = guard(id, "self", 0);
  return {
    ...actor,
    accessNodeId: { status: "known", value: "access:region:air:global", observedTick: 20 },
    capabilities: actor.capabilities.map((capability) => ({ ...capability, domains: ["air"] }))
  };
}

describe("offensive force routing and domain readiness", () => {
  it("uses recent last-seen defenders as raid risk without making them target candidates", () => {
    const attackers = Array.from({ length: 3 }, (_, index) => guard(`raid-attacker-${index}`, "self", 0));
    const target = producer("raid-workmill");
    const defenders = Array.from({ length: 8 }, (_, index) => ({
      ...guard(`remembered-defender-${index}`, "enemy", 1),
      visibility: "last_seen" as const,
      wasCombatant: true,
      capabilities: [],
      observedTick: 20
    }));
    const observation = world([...attackers, target, ...defenders]);
    const catalog = {
      schemaVersion: 1 as const,
      generation: 1,
      unsupported: [],
      entries: [{
        capabilityId: "remembered-maceman",
        family: "military",
        sourceObjectName: defenders[0]!.objectName,
        effectiveLevel: 1,
        movementDomains: ["ground" as const],
        targetDomains: ["ground" as const],
        produces: [], constructs: [], researches: [], gathers: [],
        housingCapacity: null, housingCost: 1, cargoCapacity: null
      }]
    };
    const context = createAiSkirmishProposalContext(observation, brain(), catalog);
    const choice = selectAiOffensiveOpportunity(
      { ...context, rememberedEnemies: [] },
      attackers,
      { raid: true, threatContacts: defenders, candidateFilter: (actor) => actor.actorId === target.actorId }
    );

    expect(choice.opponent?.actorId).toBe(target.actorId);
    expect(choice.assessment).toMatchObject({ requiredForce: 13, visibleThreatCount: 8 });

    const nearExpiryContext = { ...context, observation: { ...context.observation, tick: 1020 }, rememberedEnemies: [] };
    const nearExpiryChoice = selectAiOffensiveOpportunity(nearExpiryContext, attackers, {
      raid: true,
      threatContacts: defenders,
      candidateFilter: (actor) => actor.actorId === target.actorId
    });
    expect(nearExpiryChoice.assessment).toMatchObject({ requiredForce: 13, visibleThreatCount: 8 });

    const expiredContext = { ...context, observation: { ...context.observation, tick: 1221 }, rememberedEnemies: [] };
    const expiredChoice = selectAiOffensiveOpportunity(expiredContext, attackers, {
      raid: true,
      threatContacts: defenders,
      candidateFilter: (actor) => actor.actorId === target.actorId
    });
    expect(expiredChoice.assessment).toMatchObject({ requiredForce: 3, visibleThreatCount: 0 });
  });

  it("keeps a ground anti-air force eligible for an observed flying objective", () => {
    const attackers = Array.from({ length: 3 }, (_, i) => {
      const actor = guard(`interceptor-${i}`, "self", 0);
      return {
        ...actor,
        capabilities: actor.capabilities.map((capability) => ({ ...capability, targetDomains: ["air" as const] }))
      };
    });
    const target = { ...flyer("enemy-air"), relation: "enemy" as const, visibility: "visible" as const, owner: 2 };
    const context = createAiSkirmishProposalContext(world([...attackers, target]), brain(), {
      schemaVersion: 1,
      generation: 1,
      unsupported: [],
      entries: []
    });
    const choice = selectAiOffensiveOpportunity(context, attackers);
    expect(choice.route?.kind).toBe("air_or_naval_objective");
    expect(choice.assessment).toMatchObject({ reason: "credible_force_and_route", readyForce: 3, requiredForce: 3 });
  });

  it("prioritizes a nearby water attacker that threatens friendly units", () => {
    const access = buildAiAccessGraphV1({
      generation: 1,
      staticRevision: 1,
      dynamicRevision: 1,
      threatRevision: 0,
      builtTick: 0,
      continuationCursor: 0,
      includeAirRegion: true,
      cells: [
        { x: 0, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: ["1,0"], knowledge: "known_static", clearance: 2 },
        { x: 1, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: ["0,0"], knowledge: "known_static", clearance: 2 },
        { x: 0, y: 1, ground: false, water: true, elevation: 0, groundNeighborKeys: [], knowledge: "known_static", clearance: 2 },
        { x: 1, y: 1, ground: false, water: true, elevation: 0, groundNeighborKeys: [], knowledge: "known_static", clearance: 2 }
      ]
    });
    const navalActor = (id: string, relation: "self" | "enemy", x: number): AiObservedActorV1 => ({
      ...guard(id, relation, x),
      objectName: "VikingBoat",
      accessNodeId: { status: "known", value: access.waterNodeByTileKey.get(`${x},1`)!, observedTick: 20 },
      logicalPosition: { status: "known", value: { x, y: 1, z: 0 }, observedTick: 20 },
      capabilities: [{
        id: `${id}:attack`, family: "military", level: 1, domains: ["water"], targetDomains: ["ground", "water"],
        capacity: { status: "known", value: 0, observedTick: 20 }
      }],
      combatProfile: { status: "known", observedTick: 20, value: {
        maxHealth: 240, maxArmour: 30, passiveRegenerationPerSecond: 0, armourPermille: 0,
        attacks: [{ damage: 12, cooldownTicks: 60, remainingCooldownTicks: null, range: 7, minRange: 2,
          highGroundRangeBonus: 1, impactDelayTicks: 0, areaRadius: 0, targetDomains: ["ground", "water"] }],
        healing: null, spells: [], statuses: []
      } }
    });
    const groundForce = guard("frontline", "self", 0);
    const groundForce2 = guard("frontline-2", "self", 0);
    const boat = navalActor("naval-reserve", "self", 0);
    const enemyBoat = navalActor("enemy-vessel", "enemy", 1);
    const enemyCore = core("enemy-core");
    const prior = manager.propose(world([groundForce, groundForce2, enemyCore]), brain());
    const priorState = {
      ...brain(),
      squads: prior.statePatch?.squads?.map((squad) => squad.role === "attack" && squad.lifecycle
        ? { ...squad, lifecycle: { ...squad.lifecycle, lastUsefulEffectTick: 100 } }
        : squad),
      strategy: prior.statePatch?.strategy,
      skirmish: prior.statePatch?.skirmish
    };
    const observation = world([groundForce, groundForce2, boat, enemyBoat, enemyCore], 120);
    const context = createAiSkirmishProposalContext({
      ...observation,
      map: { ...observation.map!, accessGraph: access.graph }
    }, priorState, { schemaVersion: 1, generation: 1, unsupported: [], entries: [] });

    const choice = selectAiOffensiveOpportunity(context, [groundForce, groundForce2, boat]);

    expect(choice.assessment).toMatchObject({ targetActorId: "enemy-vessel", routeDomain: "water", readyForce: 1, requiredForce: 1 });
    expect(choice.attackers.map((actor) => actor.actorId)).toEqual(["naval-reserve"]);
  });

  it("uses a water firing position for a remembered coastal producer", () => {
    const access = buildAiAccessGraphV1({
      generation: 1, staticRevision: 1, dynamicRevision: 1, threatRevision: 0, builtTick: 0,
      continuationCursor: 0, includeAirRegion: true,
      cells: [
        { x: 0, y: 0, ground: true, water: false, elevation: 0, groundNeighborKeys: [], knowledge: "known_static", clearance: 2 },
        { x: 1, y: 0, ground: false, water: true, elevation: 0, groundNeighborKeys: [], knowledge: "known_static", clearance: 2 }
      ]
    });
    const boat = {
      ...guard("coastal-boat", "self", 1),
      objectName: "VikingBoat",
      accessNodeId: { status: "known" as const, value: access.waterNodeByTileKey.get("1,0")!, observedTick: 20 },
      capabilities: [{ id: "coastal-boat:attack", family: "military", level: 1,
        domains: ["water" as const], targetDomains: ["ground" as const],
        capacity: { status: "known" as const, value: 0, observedTick: 20 } }],
      combatProfile: { status: "known" as const, observedTick: 20, value: {
        maxHealth: 240, maxArmour: 30, passiveRegenerationPerSecond: 0, armourPermille: 0,
        attacks: [{ damage: 12, cooldownTicks: 60, remainingCooldownTicks: 0, range: 7, minRange: 2,
          highGroundRangeBonus: 1, impactDelayTicks: 0, areaRadius: 0, targetDomains: ["ground" as const] }],
        healing: null, spells: [], statuses: []
      } }
    };
    const target = {
      ...producer("coastal-workmill"),
      visibility: "last_seen" as const,
      accessNodeId: { status: "unknown" as const, reason: "query_pending" as const },
      logicalPosition: { status: "known" as const, value: { x: 0, y: 0, z: 0 }, observedTick: 20 }
    };
    const observation = {
      ...world([boat, target]),
      map: { ...world([boat, target]).map!, accessGraph: access.graph }
    };
    const catalog = { schemaVersion: 1 as const, generation: 1, unsupported: [], entries: [] };
    const context = createAiSkirmishProposalContext(observation, brain(), catalog);
    const choice = selectAiOffensiveOpportunity(context, [boat]);

    expect(choice.opponent?.actorId).toBe("coastal-workmill");
    expect(choice.route).toMatchObject({ kind: "direct", domain: "water" });
    expect(choice.attackers.map((actor) => actor.actorId)).toEqual(["coastal-boat"]);
  });

  it("meets the developed-base force gate with both domains after retaining the home reserve", () => {
    const army = [
      ...Array.from({ length: 7 }, (_, i) => guard(`ground-${i}`, "self", 0)),
      ...Array.from({ length: 4 }, (_, i) => flyer(`air-${i}`))
    ];
    const result = manager.propose(world([...army, core("core"), producer("range"), producer("inn")]), brain());
    expect(result.statePatch?.strategy?.assessment).toMatchObject({
      choice: "finish",
      readyForce: 8,
      requiredForce: 8
    });
    expect(result.statePatch?.squads?.find((entry) => entry.role === "reserve")?.actorIds).toHaveLength(3);
    expect(result.intents.find((intent) => intent.kind === "attack")?.actorIds).toHaveLength(8);
  });
  it("launches independently reachable ground and air units as one useful force", () => {
    const result = manager.propose(world([guard("ground", "self", 0), flyer("air"), core("enemy-core")]), brain());
    expect(result.statePatch?.strategy?.assessment).toMatchObject({ choice: "finish", readyForce: 2 });
    expect(result.intents).toContainEqual(expect.objectContaining({ kind: "attack", actorIds: ["air", "ground"] }));
  });

  it("does not certify disconnected ground reinforcements from the first actor's route", () => {
    const blocked = {
      ...guard("z-blocked", "self", 0),
      accessNodeId: { status: "known" as const, value: "access:region:ground:isolated" as const, observedTick: 20 }
    };
    const observation = world([guard("a-ready", "self", 0), blocked, core("enemy-core")]);
    const graph = observation.map!.accessGraph!;
    const result = manager.propose(
      {
        ...observation,
        map: {
          ...observation.map!,
          accessGraph: {
            ...graph,
            nodes: [...graph.nodes, { ...graph.nodes[0]!, nodeId: blocked.accessNodeId.value }]
          }
        }
      },
      brain()
    );
    expect(result.statePatch?.strategy?.assessment).toMatchObject({ readyForce: 1, requiredForce: 2 });
    expect(result.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("does not demand an anti-ground defense allowance for a purely airborne attack", () => {
    const enemies = Array.from({ length: 4 }, (_, i) => guard(`defender-${i}`, "enemy", 1));
    const attackers = [flyer("a"), flyer("b")];
    const context = createAiSkirmishProposalContext(world([...attackers, core("enemy-core"), ...enemies]), brain(), {
      schemaVersion: 1,
      generation: 1,
      unsupported: [],
      entries: []
    });
    const result = selectAiOffensiveOpportunity(context, attackers);
    expect(result.assessment).toMatchObject({
      choice: "finish",
      readyForce: 2,
      requiredForce: 2,
      visibleThreatCount: 0
    });
  });
});
